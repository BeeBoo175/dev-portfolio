import { describe, expect, it } from "vitest";
import type { ReadinessReport } from "../types";
import { parseReport } from "./parseReport";
import { BUDGET_MS, delayBeforeAsk, deriveSnapshot, describeStatus, explainStatus, partLabel } from "./statusModel";

const report = (status: ReadinessReport["status"], parts: Partial<ReadinessReport["parts"]> = {}): ReadinessReport => ({
    status,
    checkedAt: "2026-11-28T04:00:00.000Z",
    parts: { site: "ready", api: "ready", database: "ready", storage: "not-checked", ...parts },
});

describe("parseReport", () => {
    it("accepts a complete report", () => {
        const complete = report("waking", { api: "waking", database: "unknown" });
        expect(parseReport(structuredClone(complete))).toEqual(complete);
    });

    it("rejects anything that is not a whole report", () => {
        for (const value of [
            null,
            "<html>starting</html>",
            {},
            { status: "ready" },
            { ...report("ready"), status: "fine" },
            { ...report("ready"), checkedAt: 5 },
            { ...report("ready"), parts: { site: "ready", api: "ready", database: "ready" } },
            { ...report("ready"), parts: { ...report("ready").parts, api: "great" } },
        ]) {
            expect(parseReport(value)).toBeNull();
        }
    });
});

describe("deriveSnapshot", () => {
    it("is ready the moment the report says so", () => {
        expect(deriveSnapshot(report("ready"), 1_000, false).state).toBe("ready");
    });

    it("keeps waking and unknown parts as waking until the budget is spent", () => {
        const waking = report("waking", { api: "waking", database: "unknown" });
        expect(deriveSnapshot(waking, 20_000, false)).toMatchObject({ state: "waking", exhausted: false });
        expect(deriveSnapshot(waking, BUDGET_MS, false)).toMatchObject({ state: "slow", exhausted: true });
    });

    it("shows down at once when the report names a down part", () => {
        const down = report("unavailable", { database: "down" });
        expect(deriveSnapshot(down, 1_000, false)).toMatchObject({ state: "down", exhausted: false });
    });

    it("does not claim an unreachable address is down", () => {
        expect(deriveSnapshot(null, 1_000, false).state).toBe("checking");
        expect(deriveSnapshot(null, BUDGET_MS, false)).toMatchObject({ state: "unreachable", report: null });
    });
});

describe("partLabel", () => {
    it("calls a part that outlasts the wait still starting, and only a reported failure not responding", () => {
        expect(partLabel("waking", false)).toBe("Starting");
        expect(partLabel("waking", true)).toBe("Still starting");
        expect(partLabel("unknown", true)).toBe("Waiting for the API");
        expect(partLabel("down", false)).toBe("Not responding");
        expect(partLabel("ready", true)).toBe("Ready");
    });
});

describe("delayBeforeAsk", () => {
    it("steps through 3, 5, 8 and 10 seconds, then every 10", () => {
        expect([0, 1, 2, 3, 4, 9].map(delayBeforeAsk)).toEqual([3_000, 5_000, 8_000, 10_000, 10_000, 10_000]);
    });
});

describe("describeStatus", () => {
    const words = (value: ReadinessReport | null, elapsedMs = 1_000) =>
        describeStatus(deriveSnapshot(value, elapsedMs, false));

    it("says ready, or that it is still checking, or just names the demo", () => {
        expect(words(report("ready"))).toBe("Demo ready");
        expect(words(null)).toBe("Checking");
        expect(words(null, BUDGET_MS)).toBe("Live demo");
    });

    it("names the part that is not ready", () => {
        expect(words(report("waking", { api: "waking", database: "unknown" }))).toBe("API starting");
        expect(words(report("waking", { api: "waking", database: "unknown" }), BUDGET_MS)).toBe("API slow to start");
        expect(words(report("unavailable", { database: "down" }))).toBe("Database unavailable");
    });
});

describe("explainStatus", () => {
    const explain = (value: ReadinessReport | null, elapsedMs = 1_000) =>
        explainStatus(deriveSnapshot(value, elapsedMs, false));

    it("never leaves the impression that the demo was not deployed", () => {
        expect(explain(report("ready"))).toContain("Deployed on");
        expect(explain(report("waking", { api: "waking" }))).toContain("waking it now");
        expect(explain(report("waking", { api: "waking" }), BUDGET_MS)).toContain("is deployed");
        expect(explain(report("unavailable", { database: "down" }))).toContain("its database");
        expect(explain(report("unavailable", { api: "down" }))).toContain("its API");
        expect(explain(null, BUDGET_MS)).toContain("still open the demo");
    });
});
