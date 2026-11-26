import { describe, expect, it } from "vitest";
import { getDprSteps, getInitialStep, isLowEndDevice, judgeQuality, startQuality, typicalFrame } from "./renderQuality";

describe("render quality", () => {
    it("treats few cores or little memory as low-end, and unknown as capable", () => {
        expect(isLowEndDevice({ hardwareConcurrency: 4, deviceMemory: 8 })).toBe(true);
        expect(isLowEndDevice({ hardwareConcurrency: 12, deviceMemory: 4 })).toBe(true);
        expect(isLowEndDevice({ hardwareConcurrency: 12 })).toBe(false);
        expect(isLowEndDevice({})).toBe(false);
        const steps = getDprSteps(3);
        expect(getInitialStep(true, steps)).toBeGreaterThan(getInitialStep(false, steps));
    });

    it("judges the typical frame, not the odd stall", () => {
        expect(typicalFrame([...Array(80).fill(1 / 60), ...Array(10).fill(0.2)])).toBe(1 / 60);
    });

    it("leaves a smooth scene alone", () => {
        const state = startQuality(0);
        expect(judgeQuality(state, 1 / 60, 3)).toBe(state);
    });

    it("keeps lowering while fewer pixels make it faster, and stops at the floor", () => {
        let state = judgeQuality(startQuality(0), 1 / 25, 3);
        expect(state.step).toBe(1);
        state = judgeQuality(state, 1 / 33, 3);
        expect(state.step).toBe(2);
        state = judgeQuality(state, 1 / 42, 3);
        expect(state).toMatchObject({ step: 2, settled: false });
    });

    it("gives the sharpness back when it buys no speed, as in low power mode", () => {
        const lowered = judgeQuality(startQuality(0), 1 / 30, 3);
        const restored = judgeQuality(lowered, 1 / 30, 3);
        expect(restored).toMatchObject({ step: 0, settled: true });
        expect(judgeQuality(restored, 1 / 20, 3)).toBe(restored);
    });

    it("keeps a dense phone screen sharp at every step", () => {
        for (const dpr of [2, 2.625, 3, 4]) {
            const steps = getDprSteps(dpr);
            expect(steps[0]).toBe(2);
            expect(Math.min(...steps)).toBe(1.5);
            expect(steps[getInitialStep(true, steps)]).toBeGreaterThanOrEqual(1.5);
        }
    });

    it("never asks an ordinary screen for more or less than it has", () => {
        expect(getDprSteps(1)).toEqual([1]);
        expect(getDprSteps(0.75)).toEqual([1]);
        expect(getDprSteps(1.25)).toEqual([1.25]);
        expect(getInitialStep(true, getDprSteps(1))).toBe(0);
    });
});
