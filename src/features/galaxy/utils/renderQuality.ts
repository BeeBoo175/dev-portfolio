/** Above this, extra pixels cost far more than they can be seen. */
const MAX_DPR = 2;
/**
 * The lowest a dense screen is drawn at. Phones put two to four pixels in every CSS pixel, so
 * drawing at 1x there leaves the scene visibly blurred.
 */
const DENSE_FLOOR = 1.5;

/** Pixel ratios to draw at on this screen, best first. A slow machine walks down and stays there. */
export function getDprSteps(screenDpr: number): number[] {
    const top = Math.min(Math.max(screenDpr, 1), MAX_DPR);
    const floor = Math.min(top, DENSE_FLOOR);
    return [...new Set([top, (top + floor) / 2, floor])];
}

export interface DeviceHints {
    hardwareConcurrency?: number;
    /** Gigabytes, rounded down by the browser. Chromium only. */
    deviceMemory?: number;
}

export function isLowEndDevice({ hardwareConcurrency, deviceMemory }: DeviceHints): boolean {
    return (hardwareConcurrency ?? 8) <= 4 || (deviceMemory ?? 8) <= 4;
}

/** Weak devices start one step down, not at the bottom: many capable phones report modest hardware. */
export const getInitialStep = (lowEnd: boolean, steps: number[]) => (lowEnd ? Math.min(1, steps.length - 1) : 0);

/** Frames judged together, so that one stall does not lower the resolution. */
export const SAMPLE_SIZE = 90;

const SLOW_FRAME = 1 / 45;
/** A step down has to cut the typical frame time by at least this share to be worth its blur. */
const WORTHWHILE_GAIN = 0.1;

export interface QualityState {
    step: number;
    /** The typical frame time before the last step down, until that step has been judged. */
    before: number | null;
    /** Set once fewer pixels turn out not to help: the resolution then stays put. */
    settled: boolean;
}

export const startQuality = (step: number): QualityState => ({ step, before: null, settled: false });

export const typicalFrame = (frameTimes: number[]) => [...frameTimes].sort((a, b) => a - b)[Math.floor(frameTimes.length / 2)];

/**
 * Lowers the resolution while the scene runs below 45 frames a second, but only for as long as that
 * makes it faster. A phone capped at 30 frames in low power mode, or one held back by its processor,
 * gets its sharpness back.
 */
export function judgeQuality(state: QualityState, frame: number, stepCount: number): QualityState {
    if (state.settled) return state;
    if (state.before !== null && frame > state.before * (1 - WORTHWHILE_GAIN)) {
        return { step: state.step - 1, before: null, settled: true };
    }
    if (frame > SLOW_FRAME && state.step < stepCount - 1) {
        return { step: state.step + 1, before: frame, settled: false };
    }
    return state.before === null ? state : { ...state, before: null };
}
