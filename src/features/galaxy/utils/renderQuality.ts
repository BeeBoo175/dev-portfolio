/** Highest device pixel ratio to draw at, best first. A slow machine walks down and stays there. */
export const DPR_STEPS = [1.5, 1.25, 1];

export interface DeviceHints {
    hardwareConcurrency?: number;
    /** Gigabytes, rounded down by the browser. Chromium only. */
    deviceMemory?: number;
}

export function isLowEndDevice({ hardwareConcurrency, deviceMemory }: DeviceHints): boolean {
    return (hardwareConcurrency ?? 8) <= 4 || (deviceMemory ?? 8) <= 4;
}

export const getInitialStep = (lowEnd: boolean) => (lowEnd ? DPR_STEPS.length - 1 : 0);

/** Frames judged together, so that one stall does not lower the resolution. */
export const SAMPLE_SIZE = 90;

/** Frame times in seconds. True when the typical frame runs below 45 per second. */
export function isTooSlow(frameTimes: number[]): boolean {
    const sorted = [...frameTimes].sort((a, b) => a - b);
    return sorted[Math.floor(sorted.length / 2)] > 1 / 45;
}
