import { describe, expect, it } from "vitest";
import { galaxyStore } from "./store";

describe("revertToPersisted", () => {
    it("keeps the same objects, and stays quiet, when nothing changed", () => {
        galaxyStore.revertToPersisted();
        const planets = galaxyStore.getSnapshot();
        const sun = galaxyStore.getSunSnapshot();
        let notified = 0;
        const unsubscribe = galaxyStore.subscribe(() => notified++);

        galaxyStore.revertToPersisted();
        unsubscribe();

        expect(galaxyStore.getSnapshot()).toBe(planets);
        expect(galaxyStore.getSunSnapshot()).toBe(sun);
        expect(notified).toBe(0);
    });

    it("still discards unsaved edits", () => {
        galaxyStore.revertToPersisted();
        const savedRadius = galaxyStore.getSnapshot()[0].radius;
        galaxyStore.updatePlanet(galaxyStore.getSnapshot()[0].id, { radius: savedRadius + 1 });

        galaxyStore.revertToPersisted();

        expect(galaxyStore.getSnapshot()[0].radius).toBe(savedRadius);
    });
});
