import type { ReadinessReport, StatusSnapshot } from "./types";
import { parseReport } from "./utils/parseReport";
import {
    ASK_TIMEOUT_MS,
    BUDGET_MS,
    MIN_REFRESH_MS,
    RECENT_READY_MS,
    delayBeforeAsk,
    deriveSnapshot,
} from "./utils/statusModel";

interface Run {
    snapshot: StatusSnapshot;
    listeners: Set<() => void>;
    report: ReadinessReport | null;
    startedAt: number;
    attempt: number;
    active: boolean;
    readyAt: number | null;
    timer: ReturnType<typeof setTimeout> | null;
    controller: AbortController | null;
}

const INITIAL: StatusSnapshot = { state: "checking", report: null, exhausted: false, refreshing: false };

/** One run per address for the whole page, so the list and the project page never ask twice. */
const runs = new Map<string, Run>();
let watchingVisibility = false;

function runFor(url: string): Run {
    let run = runs.get(url);
    if (!run) {
        run = {
            snapshot: INITIAL,
            listeners: new Set(),
            report: null,
            startedAt: 0,
            attempt: 0,
            active: false,
            readyAt: null,
            timer: null,
            controller: null,
        };
        runs.set(url, run);
    }
    return run;
}

function publish(run: Run, snapshot: StatusSnapshot) {
    run.snapshot = snapshot;
    run.listeners.forEach((listener) => listener());
}

function halt(run: Run) {
    run.active = false;
    if (run.timer) clearTimeout(run.timer);
    run.controller?.abort();
    run.timer = null;
    run.controller = null;
    if (run.snapshot.refreshing) publish(run, { ...run.snapshot, refreshing: false });
}

/** The seconds a 429 asks for, from its body or header; a missing value waits the first delay. */
function retryAfterMs(response: Response, body: unknown) {
    const fromBody =
        typeof body === "object" && body !== null && "retryAfterSeconds" in body
            ? Number(body.retryAfterSeconds)
            : NaN;
    const seconds = Number.isFinite(fromBody) ? fromBody : Number(response.headers.get("Retry-After"));
    return Number.isFinite(seconds) && seconds > 0 ? Math.min(seconds, 120) * 1000 : delayBeforeAsk(0);
}

async function ask(url: string, run: Run) {
    const controller = new AbortController();
    run.controller = controller;
    let report: ReadinessReport | null = null;
    let waitMs: number | null = null;

    try {
        const response = await fetch(url, {
            headers: { Accept: "application/json" },
            cache: "no-store",
            signal: AbortSignal.any([controller.signal, AbortSignal.timeout(ASK_TIMEOUT_MS)]),
        });
        const body: unknown = await response.json().catch(() => null);
        if (response.status === 429) {
            waitMs = retryAfterMs(response, body);
        } else {
            report = parseReport(body);
        }
    } catch {
        // an unreachable address or a timeout leaves the report as it was
    }

    if (run.snapshot.refreshing) {
        const remaining = MIN_REFRESH_MS - (Date.now() - run.startedAt);
        if (remaining > 0) await new Promise((resolve) => setTimeout(resolve, remaining));
    }

    if (controller.signal.aborted || run.controller !== controller) return;
    run.controller = null;

    if (waitMs !== null) {
        // time the host asked us to wait is not spent from the budget
        run.startedAt += waitMs;
        run.timer = setTimeout(() => void ask(url, run), waitMs);
        return;
    }

    run.report = report ?? run.report;
    const elapsed = Date.now() - run.startedAt;
    const next = deriveSnapshot(run.report, elapsed, false);

    if (next.state === "ready") {
        run.readyAt = Date.now();
        run.active = false;
        publish(run, next);
        return;
    }
    if (elapsed >= BUDGET_MS) {
        run.active = false;
        publish(run, deriveSnapshot(run.report, elapsed, true));
        return;
    }
    // during a refresh the last result stays until this run has something to say
    if (!(run.snapshot.refreshing && next.state === "checking")) publish(run, next);
    // the last ask lands exactly when the budget ends, so the final state never arrives late
    const delay = Math.min(delayBeforeAsk(run.attempt++), BUDGET_MS - elapsed);
    run.timer = setTimeout(() => void ask(url, run), delay);
}

function begin(url: string, run: Run) {
    if (run.active) return;
    if (run.readyAt !== null && Date.now() - run.readyAt < RECENT_READY_MS) return;
    run.active = true;
    run.startedAt = Date.now();
    run.attempt = 0;
    run.report = null;
    const answered = run.snapshot.state !== "checking";
    publish(run, answered ? { ...run.snapshot, refreshing: true } : INITIAL);
    void ask(url, run);
}

function watchVisibility() {
    if (watchingVisibility || typeof document === "undefined") return;
    watchingVisibility = true;
    document.addEventListener("visibilitychange", () => {
        for (const [url, run] of runs) {
            if (run.listeners.size === 0) continue;
            if (document.hidden) halt(run);
            else begin(url, run);
        }
    });
}

export const statusStore = {
    subscribe(url: string, listener: () => void) {
        const run = runFor(url);
        run.listeners.add(listener);
        return () => {
            run.listeners.delete(listener);
            // nobody is watching, so nothing keeps asking
            if (run.listeners.size === 0) halt(run);
        };
    },
    getSnapshot: (url: string) => runFor(url).snapshot,
    start(url: string) {
        watchVisibility();
        begin(url, runFor(url));
    },
    /** A new run now, whatever the last result was. */
    recheck(url: string) {
        const run = runFor(url);
        halt(run);
        run.readyAt = null;
        begin(url, run);
    },
};
