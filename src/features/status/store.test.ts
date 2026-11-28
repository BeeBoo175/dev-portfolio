import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { statusStore } from "./store";
import type { ReadinessReport } from "./types";

const report = (status: ReadinessReport["status"], api: ReadinessReport["parts"]["api"]): ReadinessReport => ({
    status,
    checkedAt: "2026-11-28T04:00:00.000Z",
    parts: { site: "ready", api, database: api === "ready" ? "ready" : "unknown", storage: "not-checked" },
});

const reply = (body: unknown, status = 200) =>
    Promise.resolve(new Response(JSON.stringify(body), { status, headers: { "Content-Type": "application/json" } }));

let address = 0;
const nextAddress = () => `https://demo.example/${(address += 1)}`;

describe("statusStore", () => {
    beforeEach(() => {
        vi.useFakeTimers();
    });

    afterEach(() => {
        vi.useRealTimers();
        vi.unstubAllGlobals();
    });

    it("asks again after the waking delays and stops at the first ready report", async () => {
        const url = nextAddress();
        const answers = [report("waking", "waking"), report("waking", "waking"), report("ready", "ready")];
        const fetchMock = vi.fn(() => reply(answers.shift(), 503));
        vi.stubGlobal("fetch", fetchMock);
        const unsubscribe = statusStore.subscribe(url, () => {});

        statusStore.start(url);
        await vi.advanceTimersByTimeAsync(0);
        expect(statusStore.getSnapshot(url).state).toBe("waking");

        await vi.advanceTimersByTimeAsync(3_000);
        expect(fetchMock).toHaveBeenCalledTimes(2);
        await vi.advanceTimersByTimeAsync(5_000);
        expect(fetchMock).toHaveBeenCalledTimes(3);
        expect(statusStore.getSnapshot(url).state).toBe("ready");

        await vi.advanceTimersByTimeAsync(60_000);
        expect(fetchMock).toHaveBeenCalledTimes(3);
        unsubscribe();
    });

    it("calls a start that outlasts the budget slow, not down", async () => {
        const url = nextAddress();
        vi.stubGlobal("fetch", vi.fn(() => reply(report("waking", "waking"), 503)));
        const unsubscribe = statusStore.subscribe(url, () => {});

        statusStore.start(url);
        await vi.advanceTimersByTimeAsync(95_000);

        expect(statusStore.getSnapshot(url)).toMatchObject({ state: "slow", exhausted: true });
        unsubscribe();
    });

    it("says the status is unavailable, not down, when the address never answers", async () => {
        const url = nextAddress();
        vi.stubGlobal("fetch", vi.fn(() => Promise.reject(new TypeError("Failed to fetch"))));
        const unsubscribe = statusStore.subscribe(url, () => {});

        statusStore.start(url);
        await vi.advanceTimersByTimeAsync(95_000);

        expect(statusStore.getSnapshot(url)).toMatchObject({ state: "unreachable", report: null });
        unsubscribe();
    });

    it("waits as long as a 429 asks without spending the budget", async () => {
        const url = nextAddress();
        const answers = [
            () => reply({ status: "limited", retryAfterSeconds: 40 }, 429),
            () => reply(report("ready", "ready")),
        ];
        const fetchMock = vi.fn(() => answers.shift()!());
        vi.stubGlobal("fetch", fetchMock);
        const unsubscribe = statusStore.subscribe(url, () => {});

        statusStore.start(url);
        await vi.advanceTimersByTimeAsync(39_000);
        expect(fetchMock).toHaveBeenCalledTimes(1);
        await vi.advanceTimersByTimeAsync(1_500);

        expect(fetchMock).toHaveBeenCalledTimes(2);
        expect(statusStore.getSnapshot(url).state).toBe("ready");
        unsubscribe();
    });

    it("keeps the last result on screen, marked refreshing, until a new check answers", async () => {
        const url = nextAddress();
        vi.stubGlobal("fetch", vi.fn(() => reply(report("ready", "ready"))));
        const seen: string[] = [];
        const unsubscribe = statusStore.subscribe(url, () => {
            const { state, refreshing } = statusStore.getSnapshot(url);
            seen.push(`${state}:${refreshing}`);
        });
        statusStore.start(url);
        await vi.advanceTimersByTimeAsync(0);
        seen.length = 0;

        statusStore.recheck(url);
        await vi.advanceTimersByTimeAsync(600);
        expect(seen).toEqual(["ready:true"]);
        await vi.advanceTimersByTimeAsync(200);

        expect(seen).toEqual(["ready:true", "ready:false"]);
        unsubscribe();
    });

    it("stops asking once nobody is watching", async () => {
        const url = nextAddress();
        const fetchMock = vi.fn(() => reply(report("waking", "waking"), 503));
        vi.stubGlobal("fetch", fetchMock);
        const unsubscribe = statusStore.subscribe(url, () => {});

        statusStore.start(url);
        await vi.advanceTimersByTimeAsync(0);
        unsubscribe();
        await vi.advanceTimersByTimeAsync(60_000);

        expect(fetchMock).toHaveBeenCalledTimes(1);
    });
});
