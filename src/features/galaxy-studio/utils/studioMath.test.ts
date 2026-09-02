import { describe, it, expect } from "vitest";
import { radToDeg, degToRad, clamp, generateRandomSeed } from "./studioMath";

describe("studioMath", () => {
    it("converts radians to degrees accurately", () => {
        expect(radToDeg(0)).toBe(0);
        expect(radToDeg(Math.PI)).toBeCloseTo(180);
        expect(radToDeg(Math.PI / 2)).toBeCloseTo(90);
    });

    it("converts degrees to radians accurately", () => {
        expect(degToRad(0)).toBe(0);
        expect(degToRad(180)).toBeCloseTo(Math.PI);
        expect(degToRad(90)).toBeCloseTo(Math.PI / 2);
    });

    it("clamps values within range", () => {
        expect(clamp(5, 0, 10)).toBe(5);
        expect(clamp(-5, 0, 10)).toBe(0);
        expect(clamp(15, 0, 10)).toBe(10);
    });

    it("generates a random seed within expected bounds", () => {
        const seed = generateRandomSeed();
        expect(seed).toBeGreaterThanOrEqual(1);
        expect(seed).toBeLessThanOrEqual(9999);
        expect(Number.isInteger(seed)).toBe(true);
    });
});
