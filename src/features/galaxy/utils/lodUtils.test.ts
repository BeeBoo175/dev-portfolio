import { describe, it, expect } from "vitest";
import * as THREE from "three";
import {
    calculateProjectedDiameter,
    resolveLODLevel,
    LOD_LEVEL_HIGH,
    LOD_LEVEL_MEDIUM,
    LOD_LEVEL_SPARSE,
    LOD_LEVEL_SIMPLE,
    LOD_LEVEL_POINT,
    DEFAULT_PLANET_LOD_THRESHOLDS,
} from "./lodUtils";

describe("lodUtils", () => {
    describe("calculateProjectedDiameter", () => {
        it("returns 0 for non-positive dimensions", () => {
            const camera = new THREE.PerspectiveCamera(50, 1, 0.1, 1000);
            expect(calculateProjectedDiameter(0, new THREE.Vector3(0, 0, -10), camera, 1080)).toBe(0);
            expect(calculateProjectedDiameter(1, new THREE.Vector3(0, 0, -10), camera, 0)).toBe(0);
        });

        it("calculates perspective projected diameter correctly", () => {
            const camera = new THREE.PerspectiveCamera(60, 1, 0.1, 1000);
            camera.position.set(0, 0, 0);
            const pos = new THREE.Vector3(0, 0, 10);
            const diameter = calculateProjectedDiameter(1.0, pos, camera, 1000);
            expect(diameter).toBeGreaterThan(0);

            const posFurther = new THREE.Vector3(0, 0, 20);
            const diameterFurther = calculateProjectedDiameter(1.0, posFurther, camera, 1000);
            expect(diameterFurther).toBeCloseTo(diameter / 2, 1);
        });
    });

    describe("resolveLODLevel with hysteresis", () => {
        it("maintains current level within hysteresis margin", () => {
            const h = DEFAULT_PLANET_LOD_THRESHOLDS.hysteresisFraction;
            const threshold = DEFAULT_PLANET_LOD_THRESHOLDS.high;

            let level = resolveLODLevel(threshold + 5, -1, false);
            expect(level).toBe(LOD_LEVEL_HIGH);

            level = resolveLODLevel(threshold - 1, LOD_LEVEL_HIGH, false);
            expect(level).toBe(LOD_LEVEL_HIGH);

            level = resolveLODLevel(threshold * (1 - h) - 1, LOD_LEVEL_HIGH, false);
            expect(level).toBe(LOD_LEVEL_MEDIUM);
        });

        it("scales all the way to point level for small pixel diameter", () => {
            const level = resolveLODLevel(2, -1, false);
            expect(level).toBe(LOD_LEVEL_POINT);
        });

        it("resolves medium, sparse, and simple steps", () => {
            expect(resolveLODLevel(45, -1, false)).toBe(LOD_LEVEL_MEDIUM);
            expect(resolveLODLevel(20, -1, false)).toBe(LOD_LEVEL_SPARSE);
            expect(resolveLODLevel(8, -1, false)).toBe(LOD_LEVEL_SIMPLE);
        });
    });
});
