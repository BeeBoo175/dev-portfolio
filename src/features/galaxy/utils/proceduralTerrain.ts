import * as THREE from "three";
import type { PaletteConfig, PlanetTerrainConfig } from "../types";

const PERM_TABLE = new Uint8Array(512);
const P = [
    151, 160, 137, 91, 90, 15, 131, 13, 201, 95, 96, 53, 194, 233, 7, 225, 140, 36, 103, 30, 69, 142, 8, 99, 37, 240, 21, 10, 23, 190, 6, 148,
    247, 120, 234, 75, 0, 26, 197, 62, 94, 252, 219, 203, 117, 35, 11, 32, 57, 177, 33, 88, 237, 149, 56, 87, 174, 20, 125, 136, 171, 168, 68, 175,
    74, 165, 71, 134, 139, 48, 27, 166, 77, 146, 158, 231, 83, 111, 229, 122, 60, 211, 133, 230, 220, 105, 92, 41, 55, 46, 245, 40, 244, 102, 143, 54,
    65, 25, 63, 161, 1, 216, 80, 73, 209, 76, 132, 187, 208, 89, 18, 169, 200, 196, 135, 130, 116, 188, 159, 86, 164, 100, 109, 198, 173, 186, 3, 64,
    52, 217, 226, 250, 124, 123, 5, 202, 38, 147, 118, 126, 255, 82, 85, 212, 207, 206, 59, 227, 47, 16, 58, 17, 182, 189, 28, 42, 223, 183, 170, 213,
    119, 248, 152, 2, 44, 154, 163, 70, 221, 153, 101, 155, 167, 43, 172, 9, 129, 22, 39, 253, 19, 98, 108, 110, 79, 113, 224, 232, 178, 185, 112, 104,
    218, 246, 97, 228, 251, 34, 242, 193, 238, 210, 144, 12, 191, 179, 162, 241, 81, 51, 145, 235, 249, 14, 239, 107, 49, 192, 214, 31, 181, 199, 106,
    157, 184, 84, 204, 176, 115, 121, 50, 45, 127, 4, 150, 254, 138, 236, 205, 93, 222, 114, 67, 29, 24, 72, 243, 141, 128, 195, 78, 66, 215, 61, 156, 180
];

for (let i = 0; i < 256; i++) {
    PERM_TABLE[i] = P[i];
    PERM_TABLE[256 + i] = P[i];
}

function fade(t: number): number {
    return t * t * t * (t * (t * 6 - 15) + 10);
}

function lerp(t: number, a: number, b: number): number {
    return a + t * (b - a);
}

function grad(hash: number, x: number, y: number, z: number): number {
    const h = hash & 15;
    const u = h < 8 ? x : y;
    const v = h < 4 ? y : h === 12 || h === 14 ? x : z;
    return ((h & 1) === 0 ? u : -u) + ((h & 2) === 0 ? v : -v);
}

export function perlin3D(x: number, y: number, z: number): number {
    const X = Math.floor(x) & 255;
    const Y = Math.floor(y) & 255;
    const Z = Math.floor(z) & 255;

    const xf = x - Math.floor(x);
    const yf = y - Math.floor(y);
    const zf = z - Math.floor(z);

    const u = fade(xf);
    const v = fade(yf);
    const w = fade(zf);

    const A = PERM_TABLE[X] + Y;
    const AA = PERM_TABLE[A] + Z;
    const AB = PERM_TABLE[A + 1] + Z;
    const B = PERM_TABLE[X + 1] + Y;
    const BA = PERM_TABLE[B] + Z;
    const BB = PERM_TABLE[B + 1] + Z;

    return lerp(
        w,
        lerp(
            v,
            lerp(u, grad(PERM_TABLE[AA], xf, yf, zf), grad(PERM_TABLE[BA], xf - 1, yf, zf)),
            lerp(u, grad(PERM_TABLE[AB], xf, yf - 1, zf), grad(PERM_TABLE[BB], xf - 1, yf - 1, zf))
        ),
        lerp(
            v,
            lerp(u, grad(PERM_TABLE[AA + 1], xf, yf, zf - 1), grad(PERM_TABLE[BA + 1], xf - 1, yf, zf - 1)),
            lerp(u, grad(PERM_TABLE[AB + 1], xf, yf - 1, zf - 1), grad(PERM_TABLE[BB + 1], xf - 1, yf - 1, zf - 1))
        )
    );
}

export function fbm3D(
    x: number,
    y: number,
    z: number,
    octaves = 3,
    lacunarity = 2.0,
    gain = 0.5
): number {
    let sum = 0;
    let freq = 1.0;
    let amp = 1.0;
    let max = 0;

    for (let i = 0; i < octaves; i++) {
        sum += perlin3D(x * freq, y * freq, z * freq) * amp;
        max += amp;
        freq *= lacunarity;
        amp *= gain;
    }

    return sum / max;
}

export interface LowPolyOptions {
    radius: number;
    terrain?: PlanetTerrainConfig;
    palette?: PaletteConfig;
    fallbackColor?: string;
    isSun?: boolean;
}

export function createLowPolyPlanetGeometry(options: LowPolyOptions): THREE.BufferGeometry {
    const {
        radius,
        terrain = {},
        palette,
        fallbackColor = "#5da9ff",
        isSun = false,
    } = options;

    const detail = terrain.detail ?? (radius > 1.2 ? 3 : 2);
    const noiseScale = terrain.noiseScale ?? 1.2;
    const roughness = terrain.roughness ?? 0.18;
    const waterLevel = terrain.waterLevel ?? 0.0;
    const seed = (terrain.seed ?? 42) * 17.13;

    let baseGeom: THREE.BufferGeometry = new THREE.IcosahedronGeometry(radius, detail);
    if (baseGeom.index) {
        baseGeom = baseGeom.toNonIndexed();
    }

    const posAttr = baseGeom.getAttribute("position");
    const count = posAttr.count;

    const colors = new Float32Array(count * 3);

    const cWater = new THREE.Color(palette?.water ?? fallbackColor);
    const cCoast = new THREE.Color(palette?.coast ?? palette?.land ?? fallbackColor);
    const cLand = new THREE.Color(palette?.land ?? fallbackColor);
    const cMountain = new THREE.Color(palette?.mountain ?? palette?.land ?? fallbackColor);
    const cPeak = new THREE.Color(palette?.peak ?? "#ffffff");

    const tempVec = new THREE.Vector3();
    const tempColor = new THREE.Color();

    for (let i = 0; i < count; i++) {
        tempVec.fromBufferAttribute(posAttr, i);
        const unit = tempVec.clone().normalize();

        const nx = unit.x * noiseScale + seed;
        const ny = unit.y * noiseScale + seed * 1.31;
        const nz = unit.z * noiseScale + seed * 0.77;

        if (!isSun) {
            const rawNoise = fbm3D(nx, ny, nz, 3, 2.1, 0.5);
            const normalizedNoise = (rawNoise + 1) * 0.5;

            const elevation = normalizedNoise < waterLevel
                ? 0
                : Math.pow((normalizedNoise - waterLevel) / (1 - waterLevel), 1.3) * roughness * radius;

            const newRadius = radius + elevation;
            tempVec.copy(unit).multiplyScalar(newRadius);
            posAttr.setXYZ(i, tempVec.x, tempVec.y, tempVec.z);

            const heightRatio = elevation / (roughness * radius || 1);

            if (normalizedNoise < waterLevel + 0.04) {
                tempColor.copy(cWater);
            } else if (heightRatio < 0.15) {
                tempColor.copy(cCoast);
            } else if (heightRatio < 0.55) {
                tempColor.lerpColors(cLand, cMountain, (heightRatio - 0.15) / 0.4);
            } else {
                tempColor.lerpColors(cMountain, cPeak, (heightRatio - 0.55) / 0.45);
            }
        } else {
            const sunNoise = fbm3D(nx * 0.8, ny * 0.8, nz * 0.8, 2, 2.0, 0.5);
            tempColor.lerpColors(cWater, cPeak, (sunNoise + 1) * 0.5);
        }

        colors[i * 3] = tempColor.r;
        colors[i * 3 + 1] = tempColor.g;
        colors[i * 3 + 2] = tempColor.b;
    }

    baseGeom.setAttribute("color", new THREE.BufferAttribute(colors, 3));
    baseGeom.computeVertexNormals();

    return baseGeom;
}
