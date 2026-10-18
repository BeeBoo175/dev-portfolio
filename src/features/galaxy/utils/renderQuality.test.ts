import { describe, expect, it } from "vitest";
import { DPR_STEPS, getInitialStep, isLowEndDevice, isTooSlow } from "./renderQuality";

describe("render quality", () => {
    it("treats few cores or little memory as low-end, and unknown as capable", () => {
        expect(isLowEndDevice({ hardwareConcurrency: 4, deviceMemory: 8 })).toBe(true);
        expect(isLowEndDevice({ hardwareConcurrency: 12, deviceMemory: 4 })).toBe(true);
        expect(isLowEndDevice({ hardwareConcurrency: 12 })).toBe(false);
        expect(isLowEndDevice({})).toBe(false);
        expect(getInitialStep(true)).toBeGreaterThan(getInitialStep(false));
    });

    it("judges the typical frame, not the odd stall", () => {
        expect(isTooSlow([...Array(80).fill(1 / 60), ...Array(10).fill(0.2)])).toBe(false);
        expect(isTooSlow(Array(90).fill(1 / 30))).toBe(true);
    });

    it("never goes below one device pixel per CSS pixel", () => {
        expect(Math.min(...DPR_STEPS)).toBe(1);
    });
});
