import { describe, it, expect } from "vitest";
import {
    BIOME_PRESETS,
    generateRandomPlanet,
    generateRandomMoon,
    generateRandomSun,
    generateRandomAsteroidBelt,
    generateRandomGalaxy,
} from "./presets";
import { ORBIT_LAYOUT, DEFAULT_ASTEROID_BELT, DEFAULT_SUN } from "../galaxy";

describe("galaxy-studio presets & randomizers", () => {
    it("has valid biome presets", () => {
        expect(BIOME_PRESETS.length).toBeGreaterThan(0);
        for (const preset of BIOME_PRESETS) {
            expect(preset.name).toBeTruthy();
            expect(preset.color).toMatch(/^#/);
            expect(preset.terrain.seed).toBeDefined();
            expect(preset.palette.land || preset.palette.water).toBeDefined();
        }
    });

    it("generates a random sun", () => {
        const sun = generateRandomSun(DEFAULT_SUN);
        expect(sun.id).toBe("home");
        expect(sun.radius).toBeGreaterThan(2.0);
        expect(sun.glowIntensity).toBeGreaterThan(0);
        expect(sun.lightIntensity).toBeGreaterThan(0);
        expect(sun.color).toMatch(/^#/);
    });

    it("generates a random planet", () => {
        const planet = generateRandomPlanet(ORBIT_LAYOUT[0]);
        expect(planet.radius).toBeGreaterThan(0.5);
        expect(planet.terrain?.seed).toBeDefined();
        expect(planet.palette).toBeDefined();
    });

    it("generates a random moon", () => {
        const moon = generateRandomMoon("about", 0);
        expect(moon.id).toBe("about-moon-1");
        expect(moon.radius).toBeGreaterThan(0.1);
        expect(moon.orbitRadius).toBeGreaterThan(1.0);
        expect(moon.orbitSpeed).toBeGreaterThan(0);
    });

    it("generates a random asteroid belt", () => {
        const belt = generateRandomAsteroidBelt(DEFAULT_ASTEROID_BELT);
        expect(belt.enabled).toBe(true);
        expect(belt.count).toBeGreaterThan(300);
        expect(belt.innerRadius).toBeLessThan(belt.outerRadius);
    });

    it("generates a full randomized galaxy with sun", () => {
        const galaxy = generateRandomGalaxy(ORBIT_LAYOUT, DEFAULT_ASTEROID_BELT, DEFAULT_SUN);
        expect(galaxy.planets.length).toBe(ORBIT_LAYOUT.length);
        expect(galaxy.asteroidBelt.enabled).toBe(true);
        expect(galaxy.sun.id).toBe("home");
    });
});
