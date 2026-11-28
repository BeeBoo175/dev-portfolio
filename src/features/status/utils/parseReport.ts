import type { PartState, ReadinessParts, ReadinessReport } from "../types";

const PART_STATES: readonly string[] = ["ready", "waking", "down", "unknown", "not-checked"];
const OVERALL_STATES: readonly string[] = ["ready", "waking", "unavailable"];

const isRecord = (value: unknown): value is Record<string, unknown> =>
    typeof value === "object" && value !== null;

const asPartState = (value: unknown): PartState | null =>
    typeof value === "string" && PART_STATES.includes(value) ? (value as PartState) : null;

/** Accepts only a complete report, so a start-up page or an error body is never read as a status. */
export function parseReport(value: unknown): ReadinessReport | null {
    if (!isRecord(value) || !isRecord(value.parts)) return null;
    if (typeof value.status !== "string" || !OVERALL_STATES.includes(value.status)) return null;
    if (typeof value.checkedAt !== "string") return null;

    const site = asPartState(value.parts.site);
    const api = asPartState(value.parts.api);
    const database = asPartState(value.parts.database);
    const storage = asPartState(value.parts.storage);
    if (!site || !api || !database || !storage) return null;

    const parts: ReadinessParts = { site, api, database, storage };
    return { status: value.status as ReadinessReport["status"], checkedAt: value.checkedAt, parts };
}
