import { describe, expect, it } from "vitest";
import { getPlanetViewAzimuth, getPortraitScale, getViewShift } from "./viewFraming";

const desktop = { width: 1280, height: 800, isHome: false, isInspectorOpen: true };
const phone = { width: 390, height: 844, isHome: false, isInspectorOpen: false };

describe("getViewShift", () => {
    it("moves the subject right of the plate on desktop", () => {
        expect(getViewShift({ ...desktop, isEditorMode: false }).x).toBeGreaterThan(0);
    });

    it("moves the subject left of an open inspector", () => {
        expect(getViewShift({ ...desktop, isEditorMode: true }).x).toBeLessThan(0);
        expect(getViewShift({ ...desktop, isEditorMode: true, isInspectorOpen: false }).x).toBe(0);
    });

    // a phone plate starts around 28% of the way down, with its backdrop fading in above that
    it("centres a portfolio planet in the top quarter of a phone screen", () => {
        expect(0.5 - getViewShift({ ...phone, isEditorMode: false }).y).toBeLessThanOrEqual(0.25);
    });

    it("lifts the subject above bottom content on phones", () => {
        expect(getViewShift({ ...phone, isEditorMode: false }).y).toBeGreaterThan(0);
        expect(getViewShift({ ...phone, isEditorMode: true, isInspectorOpen: true }).y).toBeGreaterThan(0);
        expect(getViewShift({ ...phone, isEditorMode: true }).y).toBe(0);
    });
});

describe("getPlanetViewAzimuth", () => {
    it("swings inner planets further from the sun line, within limits", () => {
        expect(getPlanetViewAzimuth(7)).toBeGreaterThan(getPlanetViewAzimuth(14));
        expect(getPlanetViewAzimuth(1)).toBeLessThanOrEqual(1.25);
        expect(getPlanetViewAzimuth(40)).toBe(0.62);
    });
});

describe("getPortraitScale", () => {
    it("steps back only on tall screens, within limits", () => {
        expect(getPortraitScale(1280, 800)).toBe(1);
        expect(getPortraitScale(390, 760)).toBeGreaterThan(1);
        expect(getPortraitScale(100, 900)).toBe(1.5);
    });
});
