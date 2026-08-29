import { describe, it, expect } from "vitest";
import {
    detectPlanetCollisions,
    detectMoonCollisions,
    detectAllGalaxyCollisions,
    resolveGalaxyCollisions,
} from "./collisionDetection";
import type { OrbitConfig } from "../types";

const mockPlanets: OrbitConfig[] = [
    {
        id: "sun",
        color: "#ffffff",
        radius: 2,
        rotationSpeed: 0.01,
        orbitRadius: 0,
        orbitSpeed: 0,
    },
    {
        id: "about",
        color: "#ff0000",
        radius: 1,
        rotationSpeed: 0.02,
        orbitRadius: 10,
        orbitSpeed: 0.01,
        children: [
            {
                id: "about-moon-1",
                color: "#aaaaaa",
                radius: 0.3,
                rotationSpeed: 0.05,
                orbitRadius: 2.0,
                orbitSpeed: 0.05,
            },
        ],
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

describe("collisionDetection utils", () => {
    it("detects no collisions when orbital paths are well spaced", () => {
        const warnings = detectPlanetCollisions(mockPlanets[1], mockPlanets);
        expect(warnings).toHaveLength(0);
    });

    it("detects planet-planet collision when orbit radii are too close", () => {
        const overlappingPlanets: OrbitConfig[] = [
            mockPlanets[0],
            mockPlanets[1],
            {
                ...mockPlanets[2],
                orbitRadius: 10.5,
            },
        ];

        const warnings = detectPlanetCollisions(overlappingPlanets[1], overlappingPlanets);
        expect(warnings.some((w) => w.type === "planet-planet")).toBe(true);
    });

    it("detects moon-surface penetration collision", () => {
        const planetWithSurfaceMoon: OrbitConfig = {
            id: "test-planet",
            radius: 2.0,
            rotationSpeed: 0.01,
            orbitRadius: 15,
            orbitSpeed: 0.01,
            children: [
                {
                    id: "penetrating-moon",
                    radius: 0.5,
                    rotationSpeed: 0.02,
                    orbitRadius: 1.5,
                    orbitSpeed: 0.05,
                },
            ],
        };

        const warnings = detectPlanetCollisions(planetWithSurfaceMoon, [planetWithSurfaceMoon]);
        expect(warnings.some((w) => w.type === "planet-moon")).toBe(true);
    });

    it("detects moon-to-moon collisions between sibling moons", () => {
        const parent: OrbitConfig = {
            id: "parent",
            radius: 1.0,
            rotationSpeed: 0.01,
            orbitRadius: 10,
            children: [
                {
                    id: "moon-1",
                    radius: 0.3,
                    rotationSpeed: 0.02,
                    orbitRadius: 2.0,
                },
                {
                    id: "moon-2",
                    radius: 0.3,
                    rotationSpeed: 0.02,
                    orbitRadius: 2.1,
                },
            ],
        };

        const warnings = detectMoonCollisions(parent, parent.children![0]);
        expect(warnings.some((w) => w.type === "moon-moon")).toBe(true);
    });

    it("resolves galaxy collisions by separating orbits", () => {
        const overlappingPlanets: OrbitConfig[] = [
            mockPlanets[0],
            { ...mockPlanets[1], orbitRadius: 10 },
            { ...mockPlanets[2], orbitRadius: 10.5 },
        ];

        const { resolvedPlanets, changedCount } = resolveGalaxyCollisions(overlappingPlanets);
        expect(changedCount).toBeGreaterThan(0);

        const warningsAfter = detectAllGalaxyCollisions(resolvedPlanets);
        const planetPlanetWarnings = warningsAfter.filter((w) => w.type === "planet-planet");
        expect(planetPlanetWarnings).toHaveLength(0);
    });

    it("detects and resolves collisions with asteroid belt", () => {
        const asteroidBelt = {
            enabled: true,
            innerRadius: 13.5,
            outerRadius: 16.5,
            count: 400,
            minSize: 0.05,
            maxSize: 0.15,
            orbitSpeed: 0.1,
            heightSpread: 0.5,
        };

        const planetsInsideBelt: OrbitConfig[] = [
            {
                id: "planet-in-belt",
                radius: 1.0,
                rotationSpeed: 0.01,
                orbitRadius: 14.5,
            },
        ];

        const warnings = detectAllGalaxyCollisions(planetsInsideBelt, asteroidBelt);
        expect(warnings.some((w) => w.type === "planet-belt")).toBe(true);

        const { resolvedPlanets, changedCount } = resolveGalaxyCollisions(planetsInsideBelt, asteroidBelt);
        expect(changedCount).toBeGreaterThan(0);

        const warningsAfter = detectAllGalaxyCollisions(resolvedPlanets, asteroidBelt);
        expect(warningsAfter.some((w) => w.type === "planet-belt")).toBe(false);
    });
});

