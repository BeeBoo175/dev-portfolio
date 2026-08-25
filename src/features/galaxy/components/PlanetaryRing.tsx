import { useMemo, useRef, useEffect } from "react";
import * as THREE from "three";
import type { RingConfig } from "../types";

interface PlanetaryRingProps {
    ring: RingConfig;
}

function createRingTexture(
    baseColorHex: string,
    gapPosition = 0.615,
    gapWidth = 0.07,
    seed = 42
): THREE.CanvasTexture {
    const canvas = document.createElement("canvas");
    canvas.width = 512;
    canvas.height = 1;
    const ctx = canvas.getContext("2d");
    if (!ctx) return new THREE.CanvasTexture(canvas);

    const baseCol = new THREE.Color(baseColorHex);
    const r = Math.round(baseCol.r * 255);
    const g = Math.round(baseCol.g * 255);
    const b = Math.round(baseCol.b * 255);

    const imgData = ctx.createImageData(512, 1);
    const data = imgData.data;

    const halfGap = gapWidth / 2;
    const gapMin = gapPosition - halfGap;
    const gapMax = gapPosition + halfGap;

    const s = Math.abs(seed) || 1;
    const f1 = 50 + (s % 60);
    const f2 = 120 + ((s * 7) % 110);
    const f3 = 260 + ((s * 13) % 150);
    const phase1 = ((s * 17) % 100) / 15.9;
    const phase2 = ((s * 31) % 100) / 15.9;
    const phase3 = ((s * 47) % 100) / 15.9;

    for (let i = 0; i < 512; i++) {
        const u = i / 511;

        let alpha = 0.65;
        if (u < 0.08) {
            alpha = (u / 0.08) * 0.65;
        } else if (u > 0.92) {
            alpha = ((1 - u) / 0.08) * 0.65;
        }

        const bandNoise =
            Math.sin(u * f1 + phase1) * 0.12 +
            Math.sin(u * f2 + phase2) * 0.10 +
            Math.sin(u * f3 + phase3) * 0.06;

        if (gapWidth > 0 && u >= gapMin && u <= gapMax && halfGap > 0) {
            const gapDist = Math.abs(u - gapPosition) / halfGap;
            alpha *= gapDist * 0.15;
        }

        const brightnessFactor = THREE.MathUtils.clamp(1.0 + bandNoise, 0.5, 1.25);

        const index = i * 4;
        data[index] = Math.min(255, Math.round(r * brightnessFactor));
        data[index + 1] = Math.min(255, Math.round(g * brightnessFactor));
        data[index + 2] = Math.min(255, Math.round(b * brightnessFactor));
        data[index + 3] = Math.round(alpha * 255);
    }

    ctx.putImageData(imgData, 0, 0);

    const texture = new THREE.CanvasTexture(canvas);
    texture.wrapS = THREE.ClampToEdgeWrapping;
    texture.wrapT = THREE.ClampToEdgeWrapping;
    texture.generateMipmaps = true;
    texture.minFilter = THREE.LinearMipmapLinearFilter;
    texture.magFilter = THREE.LinearFilter;
    texture.needsUpdate = true;
    return texture;
}

export function PlanetaryRing({ ring }: PlanetaryRingProps) {
    const meshRef = useRef<THREE.Mesh>(null);
    const tilt = ring.tilt ?? [Math.PI / 2.8, 0, Math.PI / 7];
    const gapPos = ring.gapPosition ?? 0.615;
    const gapW = ring.gapWidth ?? 0.07;
    const emissiveInt = ring.emissiveIntensity ?? 0.15;
    const seed = ring.seed ?? 42;

    const ringTexture = useMemo(() => {
        return createRingTexture(ring.color, gapPos, gapW, seed);
    }, [ring.color, gapPos, gapW, seed]);

    useEffect(() => {
        return () => {
            ringTexture.dispose();
        };
    }, [ringTexture]);

    useEffect(() => {
        const mesh = meshRef.current;
        return () => {
            if (mesh) {
                mesh.geometry.dispose();
                if (Array.isArray(mesh.material)) {
                    mesh.material.forEach((m) => m.dispose());
                } else {
                    mesh.material.dispose();
                }
            }
        };
    }, []);

    const geometry = useMemo(() => {
        const geom = new THREE.RingGeometry(ring.innerRadius, ring.outerRadius, 96);
        const pos = geom.attributes.position;
        const uvs = new Float32Array(pos.count * 2);

        for (let i = 0; i < pos.count; i++) {
            const x = pos.getX(i);
            const y = pos.getY(i);
            const r = Math.sqrt(x * x + y * y);
            const u = (r - ring.innerRadius) / (ring.outerRadius - ring.innerRadius);
            uvs[i * 2] = THREE.MathUtils.clamp(u, 0, 1);
            uvs[i * 2 + 1] = 0.5;
        }

        geom.setAttribute("uv", new THREE.BufferAttribute(uvs, 2));
        return geom;
    }, [ring.innerRadius, ring.outerRadius]);

    useEffect(() => {
        return () => {
            geometry.dispose();
        };
    }, [geometry]);

    return (
        <group rotation={tilt}>
            <mesh ref={meshRef} geometry={geometry}>
                <meshStandardMaterial
                    map={ringTexture}
                    color={ring.color}
                    emissive={ring.color}
                    emissiveIntensity={emissiveInt}
                    side={THREE.DoubleSide}
                    transparent
                    opacity={ring.opacity ?? 0.75}
                    roughness={0.7}
                    metalness={0.15}
                    depthWrite={false}
                />
            </mesh>
        </group>
    );
}

export default PlanetaryRing;
