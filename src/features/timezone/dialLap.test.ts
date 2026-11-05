import { describe, expect, it } from "vitest";
import { lapDegrees } from "./dialLap";

describe("lapDegrees", () => {
    // winding the travel back from the target must land on 9 o'clock
    const startOf = (hours: number) => ((((hours - 12) * 15 - lapDegrees(hours)) % 360) + 360) % 360;

    it("always starts at 9 o'clock", () => {
        for (const hours of [0, 5.75, 6, 11.5, 12, 18, 23.99]) {
            expect(startOf(hours)).toBeCloseTo(270);
        }
    });

    it("makes at least one full turn and less than two", () => {
        expect(lapDegrees(6)).toBe(360);
        expect(lapDegrees(12)).toBe(450);
        for (let hours = 0; hours < 24; hours += 0.25) {
            expect(lapDegrees(hours)).toBeGreaterThanOrEqual(360);
            expect(lapDegrees(hours)).toBeLessThan(720);
        }
    });
});
