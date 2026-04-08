import { describe, it, expect } from "vitest";
import { generateRandomGalaxy } from "./presets";
import type { OrbitConfig } from "../galaxy/types";

const mockPlanets: OrbitConfig[] = [
    {
        id: "about",
        color: "#ff0000",
        radius: 1,
        rotationSpeed: 0.02,
        orbitRadius: 10,
        orbitSpeed: 0.01,
    },
    {
        id: "projects",
        color: "#00ff00",
        radius: 1.2,
        rotationSpeed: 0.015,
        orbitRadius: 18,
        orbitSpeed: 0.008,
    },
];

describe("planet-creator presets", () => {
    it("generates randomized galaxy while preserving planet ids and basic structure", () => {
        const { planets, asteroidBelt } = generateRandomGalaxy(mockPlanets);
        expect(planets).toHaveLength(mockPlanets.length);
        expect(planets.find((p) => p.id === "about")).toBeDefined();
        expect(planets.find((p) => p.id === "projects")).toBeDefined();
        expect(planets[0].orbitRadius).toBeGreaterThan(0);
        expect(planets[1].orbitRadius).toBeGreaterThan(planets[0].orbitRadius ?? 0);

        expect(asteroidBelt).toBeDefined();
        expect(asteroidBelt.innerRadius).toBeGreaterThan(10);
        expect(asteroidBelt.outerRadius).toBeGreaterThan(asteroidBelt.innerRadius);
        expect(asteroidBelt.count).toBeGreaterThan(0);
        expect(asteroidBelt.color).toBeDefined();
    });
});
