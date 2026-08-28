import { describe, it, expect } from "vitest";
import { perlin3D, fbm3D, createLowPolyPlanetGeometry } from "./proceduralTerrain";

describe("proceduralTerrain utils", () => {
    describe("perlin3D", () => {
        it("returns deterministic output for identical coordinates", () => {
            const val1 = perlin3D(1.23, 4.56, 7.89);
            const val2 = perlin3D(1.23, 4.56, 7.89);
            expect(val1).toBe(val2);
        });

        it("returns continuous values within [-1, 1] range", () => {
            const val = perlin3D(10.5, 20.3, 30.1);
            expect(val).toBeGreaterThanOrEqual(-1);
            expect(val).toBeLessThanOrEqual(1);
        });
    });

    describe("fbm3D", () => {
        it("computes fractal brownian motion bounded in [-1, 1]", () => {
            const val = fbm3D(2.5, 3.5, 4.5, 3, 2.0, 0.5);
            expect(val).toBeGreaterThanOrEqual(-1);
            expect(val).toBeLessThanOrEqual(1);
        });
    });

    describe("createLowPolyPlanetGeometry", () => {
        it("generates buffer geometry with vertex colors and normals", () => {
            const geom = createLowPolyPlanetGeometry({
                radius: 1.5,
                terrain: {
                    seed: 123,
                    noiseScale: 1.5,
                    roughness: 0.2,
                    waterLevel: 0.3,
                    detail: 2,
                },
                palette: {
                    water: "#0000ff",
                    land: "#00ff00",
                    mountain: "#888888",
                    peak: "#ffffff",
                },
            });

            expect(geom.getAttribute("position")).toBeDefined();
            expect(geom.getAttribute("color")).toBeDefined();
            expect(geom.getAttribute("normal")).toBeDefined();

            const posCount = geom.getAttribute("position").count;
            const colorCount = geom.getAttribute("color").count;
            expect(posCount).toBe(colorCount);
        });

        it("handles sun configuration properly", () => {
            const geom = createLowPolyPlanetGeometry({
                radius: 2.0,
                isSun: true,
                fallbackColor: "#ffaa00",
            });

            expect(geom.getAttribute("position")).toBeDefined();
            expect(geom.getAttribute("color")).toBeDefined();
        });
    });
});
