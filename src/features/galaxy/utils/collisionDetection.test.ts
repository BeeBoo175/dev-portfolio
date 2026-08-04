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

    it("detects and resolves collisions with oversized planetary rings", () => {
        const ringedPlanets: OrbitConfig[] = [
            {
                id: "planet-a",
                radius: 1.0,
                rotationSpeed: 0.01,
                orbitRadius: 10.0,
                ring: {
                    innerRadius: 1.5,
                    outerRadius: 3.5,
                    color: "#ffffff",
                },
            },
            {
                id: "planet-b",
                radius: 1.0,
                rotationSpeed: 0.01,
                orbitRadius: 12.0,
            },
        ];

        const warnings = detectAllGalaxyCollisions(ringedPlanets);
        expect(warnings.some((w) => w.type === "planet-planet")).toBe(true);

        const { resolvedPlanets, changedCount } = resolveGalaxyCollisions(ringedPlanets);
        expect(changedCount).toBeGreaterThan(0);

        const warningsAfter = detectAllGalaxyCollisions(resolvedPlanets);
        expect(warningsAfter.some((w) => w.type === "planet-planet")).toBe(false);
    });

    it("resolves multi-moon collisions and surface penetrations completely", () => {
        const planetWithMultipleMoons: OrbitConfig[] = [
            {
                id: "jupiter",
                radius: 1.8,
                rotationSpeed: 0.01,
                orbitRadius: 10.0,
                children: [
                    {
                        id: "m1",
                        radius: 0.3,
                        rotationSpeed: 0.02,
                        orbitRadius: 0.5,
                    },
                    {
                        id: "m2",
                        radius: 0.4,
                        rotationSpeed: 0.02,
                        orbitRadius: 0.6,
                    },
                    {
                        id: "m3",
                        radius: 0.25,
                        rotationSpeed: 0.02,
                        orbitRadius: 0.7,
                    },
                ],
            },
        ];

        const warnings = detectAllGalaxyCollisions(planetWithMultipleMoons);
        expect(warnings.length).toBeGreaterThan(0);

        const { resolvedPlanets, changedCount } = resolveGalaxyCollisions(planetWithMultipleMoons);
        expect(changedCount).toBeGreaterThan(0);

        const warningsAfter = detectAllGalaxyCollisions(resolvedPlanets);
        expect(warningsAfter).toHaveLength(0);
    });

    it("resolves asteroid belt collisions when previous planet constrains inner space", () => {
        const asteroidBelt = {
            enabled: true,
            innerRadius: 12.0,
            outerRadius: 15.0,
            count: 300,
            minSize: 0.05,
            maxSize: 0.15,
            orbitSpeed: 0.1,
            heightSpread: 0.5,
        };

        const planets: OrbitConfig[] = [
            {
                id: "planet-1",
                radius: 1.0,
                rotationSpeed: 0.01,
                orbitRadius: 10.5,
            },
            {
                id: "planet-2",
                radius: 1.2,
                rotationSpeed: 0.01,
                orbitRadius: 13.0,
            },
        ];

        const warnings = detectAllGalaxyCollisions(planets, asteroidBelt);
        expect(warnings.length).toBeGreaterThan(0);

        const { resolvedPlanets, changedCount } = resolveGalaxyCollisions(planets, asteroidBelt);
        expect(changedCount).toBeGreaterThan(0);

        const warningsAfter = detectAllGalaxyCollisions(resolvedPlanets, asteroidBelt);
        expect(warningsAfter).toHaveLength(0);
    });

    it("detects sun-planet collisions when orbit radius is inside or too close to the sun", () => {
        const planetTooCloseToSun: OrbitConfig[] = [
            {
                id: "too-close",
                radius: 1.0,
                rotationSpeed: 0.01,
                orbitRadius: 3.8,
            },
        ];

        const warnings = detectAllGalaxyCollisions(planetTooCloseToSun, undefined, { radius: 3.5 });
        expect(warnings.some((w) => w.type === "sun-planet")).toBe(true);

        const { resolvedPlanets, changedCount } = resolveGalaxyCollisions(planetTooCloseToSun, undefined, { radius: 3.5 });
        expect(changedCount).toBeGreaterThan(0);
        expect(resolvedPlanets[0].orbitRadius).toBeGreaterThanOrEqual(3.5 + 1.0 + 0.5);

        const warningsAfter = detectAllGalaxyCollisions(resolvedPlanets, undefined, { radius: 3.5 });
        expect(warningsAfter.some((w) => w.type === "sun-planet")).toBe(false);
    });

    it("detects sun-moon collision when moon orbit swings inside the sun", () => {
        const planetWithReachingMoon: OrbitConfig[] = [
            {
                id: "planet-with-moon",
                radius: 1.0,
                rotationSpeed: 0.01,
                orbitRadius: 5.5,
                children: [
                    {
                        id: "sun-crossing-moon",
                        radius: 0.4,
                        rotationSpeed: 0.02,
                        orbitRadius: 2.2,
                    },
                ],
            },
        ];

        const warnings = detectAllGalaxyCollisions(planetWithReachingMoon, undefined, { radius: 3.5 });
        expect(warnings.some((w) => w.type === "sun-moon")).toBe(true);

        const { resolvedPlanets, changedCount } = resolveGalaxyCollisions(planetWithReachingMoon, undefined, { radius: 3.5 });
        expect(changedCount).toBeGreaterThan(0);

        const warningsAfter = detectAllGalaxyCollisions(resolvedPlanets, undefined, { radius: 3.5 });
        expect(warningsAfter.some((w) => w.type === "sun-moon")).toBe(false);
    });
});

