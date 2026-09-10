import * as THREE from "three";

export interface ColorStop {
    stop: number;
    r: number;
    g: number;
    b: number;
    a: number;
}

export function createRadialGradientDataTexture(
    size: number,
    stops: ColorStop[]
): THREE.DataTexture {
    const data = new Uint8Array(size * size * 4);
    const center = (size - 1) / 2;
    const maxRadius = center;

    const sortedStops = [...stops].sort((a, b) => a.stop - b.stop);

    for (let y = 0; y < size; y++) {
        for (let x = 0; x < size; x++) {
            const dx = x - center;
            const dy = y - center;
            const dist = Math.hypot(dx, dy) / maxRadius;
            const t = Math.min(Math.max(dist, 0), 1);

            let r = 0;
            let g = 0;
            let b = 0;
            let a = 0;

            if (t <= sortedStops[0].stop) {
                r = sortedStops[0].r;
                g = sortedStops[0].g;
                b = sortedStops[0].b;
                a = sortedStops[0].a;
            } else if (t >= sortedStops[sortedStops.length - 1].stop) {
                const last = sortedStops[sortedStops.length - 1];
                r = last.r;
                g = last.g;
                b = last.b;
                a = last.a;
            } else {
                for (let i = 0; i < sortedStops.length - 1; i++) {
                    const s0 = sortedStops[i];
                    const s1 = sortedStops[i + 1];
                    if (t >= s0.stop && t <= s1.stop) {
                        const span = s1.stop - s0.stop;
                        const factor = span > 0 ? (t - s0.stop) / span : 0;
                        r = s0.r + (s1.r - s0.r) * factor;
                        g = s0.g + (s1.g - s0.g) * factor;
                        b = s0.b + (s1.b - s0.b) * factor;
                        a = s0.a + (s1.a - s0.a) * factor;
                        break;
                    }
                }
            }

            if (dist > 1) {
                a = 0;
            }

            const idx = (y * size + x) * 4;
            data[idx] = Math.round(r * 255);
            data[idx + 1] = Math.round(g * 255);
            data[idx + 2] = Math.round(b * 255);
            data[idx + 3] = Math.round(a * 255);
        }
    }

    const texture = new THREE.DataTexture(data, size, size, THREE.RGBAFormat);
    texture.generateMipmaps = false;
    texture.minFilter = THREE.LinearFilter;
    texture.magFilter = THREE.LinearFilter;
    texture.wrapS = THREE.ClampToEdgeWrapping;
    texture.wrapT = THREE.ClampToEdgeWrapping;
    texture.needsUpdate = true;
    return texture;
}

let _cachedBlueprintRadialTexture: THREE.DataTexture | null = null;

export function getBlueprintRadialTexture(): THREE.DataTexture {
    if (_cachedBlueprintRadialTexture) {
        return _cachedBlueprintRadialTexture;
    }

    _cachedBlueprintRadialTexture = createRadialGradientDataTexture(128, [
        { stop: 0, r: 1, g: 1, b: 1, a: 0.7 },
        { stop: 0.35, r: 1, g: 1, b: 1, a: 0.35 },
        { stop: 0.75, r: 1, g: 1, b: 1, a: 0.08 },
        { stop: 1, r: 1, g: 1, b: 1, a: 0 },
    ]);

    return _cachedBlueprintRadialTexture;
}

const _sunGlowDataTextureCache = new Map<string, THREE.DataTexture>();

export function getSunGlowDataTexture(isLight: boolean): THREE.DataTexture {
    const key = isLight ? "light" : "dark";
    const cached = _sunGlowDataTextureCache.get(key);
    if (cached) {
        return cached;
    }

    const texture = isLight
        ? createRadialGradientDataTexture(128, [
            { stop: 0, r: 2 / 255, g: 132 / 255, b: 199 / 255, a: 0.2 },
            { stop: 0.35, r: 2 / 255, g: 132 / 255, b: 199 / 255, a: 0.12 },
            { stop: 0.65, r: 3 / 255, g: 105 / 255, b: 161 / 255, a: 0.05 },
            { stop: 0.85, r: 3 / 255, g: 105 / 255, b: 161 / 255, a: 0.02 },
            { stop: 1, r: 3 / 255, g: 105 / 255, b: 161 / 255, a: 0 },
        ])
        : createRadialGradientDataTexture(128, [
            { stop: 0, r: 1, g: 1, b: 1, a: 1 },
            { stop: 0.25, r: 1, g: 251 / 255, b: 235 / 255, a: 0.85 },
            { stop: 0.55, r: 1, g: 215 / 255, b: 107 / 255, a: 0.35 },
            { stop: 0.8, r: 245 / 255, g: 158 / 255, b: 11 / 255, a: 0.12 },
            { stop: 1, r: 245 / 255, g: 158 / 255, b: 11 / 255, a: 0 },
        ]);

    _sunGlowDataTextureCache.set(key, texture);
    return texture;
}

let _cachedCircleDataTexture: THREE.DataTexture | null = null;

export function getCircleDataTexture(): THREE.DataTexture {
    if (_cachedCircleDataTexture) {
        return _cachedCircleDataTexture;
    }

    _cachedCircleDataTexture = createRadialGradientDataTexture(64, [
        { stop: 0, r: 1, g: 1, b: 1, a: 1 },
        { stop: 0.2, r: 1, g: 1, b: 1, a: 0.9 },
        { stop: 0.5, r: 1, g: 1, b: 1, a: 0.35 },
        { stop: 0.8, r: 1, g: 1, b: 1, a: 0.08 },
        { stop: 1, r: 1, g: 1, b: 1, a: 0 },
    ]);

    return _cachedCircleDataTexture;
}
