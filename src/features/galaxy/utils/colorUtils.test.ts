import { describe, it, expect } from "vitest";
import { getEffectiveAccentColor, getEffectiveAccentThreeColor, resolveCelestialBodyColor } from "./colorUtils";

describe("colorUtils", () => {
    it("returns original color in dark mode", () => {
        expect(getEffectiveAccentColor("#5da9ff", false)).toBe("#5da9ff");
        expect(getEffectiveAccentColor("#ffb15d", false)).toBe("#ffb15d");
    });

    it("darkens and saturates color in light mode for contrast", () => {
        const lightSkills = getEffectiveAccentColor("#5da9ff", true);
        expect(lightSkills).toMatch(/^#[0-9a-f]{6}$/i);
        expect(lightSkills).not.toBe("#5da9ff");

        const threeColor = getEffectiveAccentThreeColor("#5da9ff", true);
        const hsl = { h: 0, s: 0, l: 0 };
        threeColor.getHSL(hsl);
        expect(hsl.l).toBeLessThanOrEqual(0.25);
    });

    it("resolves celestial body color prioritizing override, palette, body color, and fallback", () => {
        expect(resolveCelestialBodyColor({ color: "#111111" }, "#222222")).toBe("#222222");
        expect(resolveCelestialBodyColor({ color: "#111111" })).toBe("#111111");
        expect(resolveCelestialBodyColor({ color: "#111111", palette: { land: "#333333" } })).toBe("#333333");
        expect(resolveCelestialBodyColor({ color: "#111111", palette: { coast: "#444444" } })).toBe("#444444");
        expect(resolveCelestialBodyColor({ color: "#111111", palette: { water: "#555555" } })).toBe("#555555");
        expect(resolveCelestialBodyColor({ color: "#111111", palette: { peak: "#666666" } })).toBe("#666666");
        expect(resolveCelestialBodyColor({}, undefined, "#abcdef")).toBe("#abcdef");
    });
});
