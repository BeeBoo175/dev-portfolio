import { describe, it, expect, beforeEach } from "vitest";
import { galaxyStore } from "./store";
import { ORBIT_LAYOUT } from "./data";

describe("galaxyStore", () => {
    beforeEach(() => {
        if (typeof localStorage !== "undefined" && localStorage.clear) {
            localStorage.clear();
        }
        galaxyStore.resetAll();
    });

    it("initializes with default planets", () => {
        const planets = galaxyStore.getSnapshot();
        expect(planets.length).toBe(ORBIT_LAYOUT.length);
        expect(planets.map((p) => p.id)).toEqual(ORBIT_LAYOUT.map((p) => p.id));
    });

    it("updates a specific planet properties", () => {
        const targetId = ORBIT_LAYOUT[1].id;
        galaxyStore.updatePlanet(targetId, { radius: 4.5, color: "#123456" });

        const updatedPlanets = galaxyStore.getSnapshot();
        const updated = updatedPlanets.find((p) => p.id === targetId);

        expect(updated?.radius).toBe(4.5);
        expect(updated?.color).toBe("#123456");
    });

    it("updates visuals settings", () => {
        galaxyStore.setVisualSettings({ showOrbitPaths: false, showOrbitalAxes: true });
        const visuals = galaxyStore.getVisualsSnapshot();

        expect(visuals.showOrbitPaths).toBe(false);
        expect(visuals.showOrbitalAxes).toBe(true);
    });

    it("notifies subscribers on store update", () => {
        let callCount = 0;
        const unsubscribe = galaxyStore.subscribe(() => {
            callCount++;
        });

        galaxyStore.updatePlanet(ORBIT_LAYOUT[0].id, { radius: 3 });
        expect(callCount).toBe(1);

        unsubscribe();
        galaxyStore.updatePlanet(ORBIT_LAYOUT[0].id, { radius: 2 });
        expect(callCount).toBe(1);
    });

    it("resets all planets back to defaults", () => {
        galaxyStore.updatePlanet(ORBIT_LAYOUT[1].id, { radius: 9.9 });
        galaxyStore.resetAll();

        const planets = galaxyStore.getSnapshot();
        const resetPlanet = planets.find((p) => p.id === ORBIT_LAYOUT[1].id);
        expect(resetPlanet?.radius).toBe(ORBIT_LAYOUT[1].radius);
    });
});
