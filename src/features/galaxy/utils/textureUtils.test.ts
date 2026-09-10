import { describe, it, expect } from "vitest";
import * as THREE from "three";
import {
    createRadialGradientDataTexture,
    getBlueprintRadialTexture,
    getSunGlowDataTexture,
    getCircleDataTexture,
} from "./textureUtils";

describe("textureUtils", () => {
    it("generates a valid DataTexture with correct configuration", () => {
        const texture = createRadialGradientDataTexture(32, [
            { stop: 0, r: 1, g: 1, b: 1, a: 1 },
            { stop: 1, r: 1, g: 1, b: 1, a: 0 },
        ]);

        expect(texture).toBeInstanceOf(THREE.DataTexture);
        expect(texture.image.width).toBe(32);
        expect(texture.image.height).toBe(32);
        expect(texture.format).toBe(THREE.RGBAFormat);
        expect(texture.generateMipmaps).toBe(false);
        expect(texture.minFilter).toBe(THREE.LinearFilter);
        expect(texture.magFilter).toBe(THREE.LinearFilter);
        expect(texture.wrapS).toBe(THREE.ClampToEdgeWrapping);
        expect(texture.wrapT).toBe(THREE.ClampToEdgeWrapping);

        const data = texture.image.data;
        expect(data).toBeDefined();
        if (!data) throw new Error("Data should be defined");

        const centerIdx = (16 * 32 + 16) * 4;
        expect(data[centerIdx + 3]).toBeGreaterThan(200);

        const cornerIdx = 0;
        expect(data[cornerIdx + 3]).toBe(0);
    });

    it("caches singleton blueprint radial texture", () => {
        const tex1 = getBlueprintRadialTexture();
        const tex2 = getBlueprintRadialTexture();
        expect(tex1).toBe(tex2);
        expect(tex1.generateMipmaps).toBe(false);
    });

    it("caches sun glow textures for light and dark modes", () => {
        const light1 = getSunGlowDataTexture(true);
        const light2 = getSunGlowDataTexture(true);
        const dark1 = getSunGlowDataTexture(false);
        const dark2 = getSunGlowDataTexture(false);

        expect(light1).toBe(light2);
        expect(dark1).toBe(dark2);
        expect(light1).not.toBe(dark1);
    });

    it("caches circle particle texture", () => {
        const circle1 = getCircleDataTexture();
        const circle2 = getCircleDataTexture();
        expect(circle1).toBe(circle2);
        expect(circle1.image.width).toBe(64);
    });
});
