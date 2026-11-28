import type { PartState, ReadinessReport, StatusSnapshot, StatusState } from "../types";

/** Waits between asks while a part is still waking, then every STEADY_DELAY_MS. */
export const RETRY_DELAYS_MS = [3_000, 5_000, 8_000, 10_000] as const;
export const STEADY_DELAY_MS = 10_000;
/** How long one run keeps asking before it calls the start slow. */
export const BUDGET_MS = 90_000;
/** A run does not start again this soon after a ready result in the same visit. */
export const RECENT_READY_MS = 60_000;
/** A refresh shows its spinner at least this long, so a quick answer does not flicker. */
export const MIN_REFRESH_MS = 700;
/** A single ask gives up after this long, a little more than the report's own deadline. */
export const ASK_TIMEOUT_MS = 8_000;

export function delayBeforeAsk(attempt: number) {
    return RETRY_DELAYS_MS[attempt] ?? STEADY_DELAY_MS;
}

const hasDownPart = (report: ReadinessReport) => Object.values(report.parts).includes("down");

/**
 * What to show. Only a part the report names as down is a failure. A start that outlasts the budget is slow,
 * and an address that cannot be reached says nothing about the demo itself.
 */
export function deriveSnapshot(
    report: ReadinessReport | null,
    elapsedMs: number,
    finished: boolean
): StatusSnapshot {
    const exhausted = finished || elapsedMs >= BUDGET_MS;
    const refreshing = false;

    if (!report) {
        return { state: exhausted ? "unreachable" : "checking", report: null, exhausted, refreshing };
    }
    if (report.status === "ready") return { state: "ready", report, exhausted: false, refreshing };
    if (hasDownPart(report)) return { state: "down", report, exhausted, refreshing };
    return { state: exhausted ? "slow" : "waking", report, exhausted, refreshing };
}

export const SHOWN_PARTS = ["site", "api", "database"] as const;
type ShownPart = (typeof SHOWN_PARTS)[number];

export const PART_LABELS: Record<ShownPart, string> = {
    site: "Website",
    api: "API",
    database: "Database",
};

export const PART_HOSTS: Record<ShownPart, string> = {
    site: "Next.js on Vercel",
    api: ".NET on Render",
    database: "PostgreSQL on Neon",
};

/** The words for one part. A part that is slow is still starting, never down. */
export function partLabel(state: PartState, exhausted: boolean) {
    if (state === "ready") return "Ready";
    if (state === "down") return "Not responding";
    if (state === "unknown") return "Waiting for the API";
    if (state === "not-checked") return "Not checked";
    return exhausted ? "Still starting" : "Starting";
}

/** The part to name: the failed one if any, otherwise the first that is not ready yet. */
function partToName(report: ReadinessReport): ShownPart | undefined {
    return (
        SHOWN_PARTS.find((part) => report.parts[part] === "down") ??
        SHOWN_PARTS.find((part) => report.parts[part] !== "ready")
    );
}

/** The few words beside the project in the list, naming the part that is not ready. */
export function describeStatus({ state, report }: StatusSnapshot): string {
    if (state === "ready") return "Demo ready";
    if (state === "checking") return "Checking";
    if (state === "unreachable" || !report) return "Live demo";

    const part = partToName(report);
    const name = part ? PART_LABELS[part] : "Demo";
    if (state === "down") return `${name} unavailable`;
    return state === "slow" ? `${name} slow to start` : `${name} starting`;
}

export const HEADLINES: Record<StatusState, string> = {
    ready: "Live demo ready",
    checking: "Checking demo",
    waking: "Starting demo, about 1 min",
    slow: "Taking longer to start",
    down: "Temporarily unavailable",
    unreachable: "Live demo",
};

/** One sentence that makes clear the demo is deployed and what the visitor can do. */
export function explainStatus({ state, report }: StatusSnapshot): string {
    if (state === "ready") return "Deployed on Vercel, Render and Neon.";
    if (state === "slow") {
        return "The demo is deployed, but free hosting is slow to wake. You can still open it, or check again.";
    }
    if (state === "down") {
        const part = report ? partToName(report) : undefined;
        const name = part === "api" ? "API" : part ? PART_LABELS[part].toLowerCase() : "service";
        return `The demo is deployed, but its ${name} isn’t responding right now.`;
    }
    if (state === "unreachable") return "The status check didn’t answer. You can still open the demo.";
    return "Free hosting sleeps when idle. Your visit is waking it now.";
}

/** True while an answer is still on its way, which is when the spinner shows. */
export function isBusy({ state, refreshing }: StatusSnapshot) {
    return refreshing || state === "checking" || state === "waking";
}

/** Every headline and sentence, so the widget can hold room for the longest and never change size. */
export const ALL_HEADLINES = Object.values(HEADLINES);

export const ALL_EXPLANATIONS = (["ready", "checking", "slow", "down", "unreachable"] as const).map((state) =>
    explainStatus({
        state,
        refreshing: false,
        exhausted: false,
        report:
            state === "down"
                ? {
                      status: "unavailable",
                      checkedAt: "",
                      parts: { site: "ready", api: "ready", database: "down", storage: "not-checked" },
                  }
                : null,
    })
);
