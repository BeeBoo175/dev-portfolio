export type PartState = "ready" | "waking" | "down" | "unknown" | "not-checked";

export interface ReadinessParts {
    site: PartState;
    api: PartState;
    database: PartState;
    storage: PartState;
}

/** The report a project's readiness address returns. */
export interface ReadinessReport {
    status: "ready" | "waking" | "unavailable";
    checkedAt: string;
    parts: ReadinessParts;
}

/**
 * What is shown: not answered yet, ready, waking, still not ready after the wait, a part reporting a failure,
 * or a status that cannot be read.
 */
export type StatusState = "checking" | "ready" | "waking" | "slow" | "down" | "unreachable";

export interface StatusSnapshot {
    state: StatusState;
    /** The latest report; null until one arrives, or while the address cannot be reached. */
    report: ReadinessReport | null;
    /** True while a new run is asking and the last result is still the one shown. */
    refreshing: boolean;
    /** True once the waiting budget is spent. */
    exhausted: boolean;
}
