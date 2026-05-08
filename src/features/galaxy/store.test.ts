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

    it("updates and resets asteroid belt configuration", () => {
        galaxyStore.updateAsteroidBelt({ count: 620, innerRadius: 14.5 });
        let belt = galaxyStore.getAsteroidBeltSnapshot();
        expect(belt.count).toBe(620);
        expect(belt.innerRadius).toBe(14.5);

        galaxyStore.resetAsteroidBelt();
        belt = galaxyStore.getAsteroidBeltSnapshot();
        expect(belt.count).toBe(450);
        expect(belt.innerRadius).toBe(14.8);
    });

    it("exports and imports galaxy data including asteroid belt", () => {
        galaxyStore.updateAsteroidBelt({ count: 580, color: "#112233" });
        const exported = galaxyStore.exportJSON();
        expect(exported).toContain('"count": 580');

        galaxyStore.resetAll();
        expect(galaxyStore.getAsteroidBeltSnapshot().count).toBe(450);

        const success = galaxyStore.importJSON(exported);
        expect(success).toBe(true);
        expect(galaxyStore.getAsteroidBeltSnapshot().count).toBe(580);
        expect(galaxyStore.getAsteroidBeltSnapshot().color).toBe("#112233");
    });

    it("updates and resets sun configuration", () => {
        galaxyStore.updateSun({ radius: 4.8, color: "#ff5500", glowIntensity: 1.6 });
        let sun = galaxyStore.getSunSnapshot();
        expect(sun.radius).toBe(4.8);
        expect(sun.color).toBe("#ff5500");
        expect(sun.glowIntensity).toBe(1.6);

        galaxyStore.resetSun();
        sun = galaxyStore.getSunSnapshot();
        expect(sun.radius).toBe(3.5);
        expect(sun.color).toBe("#ffe59e");
    });
});

