import { useMemo, useEffect } from "react";
import * as THREE from "three";
import type { RingConfig } from "../types";
import { useTheme } from "../../theme";
import { getEffectiveAccentColor } from "../utils/colorUtils";

interface PlanetaryRingProps {
    ring: RingConfig;
}

function createRingTexture(
    gapPosition = 0.615,
    gapWidth = 0.07,
    seed = 42
): THREE.CanvasTexture {
    const canvas = document.createElement("canvas");
    canvas.width = 512;
    canvas.height = 1;
    const ctx = canvas.getContext("2d");
    if (!ctx) return new THREE.CanvasTexture(canvas);

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

        let alpha = 0.7;
        if (u < 0.08) {
            alpha = (u / 0.08) * alpha;
        } else if (u > 0.92) {
            alpha = ((1 - u) / 0.08) * alpha;
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
        const val = Math.min(255, Math.round(255 * brightnessFactor));

        const index = i * 4;
        data[index] = val;
        data[index + 1] = val;
        data[index + 2] = val;
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

function createRingBufferGeometry(
    innerRadius: number,
    outerRadius: number,
    thetaSegments: number
): THREE.BufferGeometry {
    const geom = new THREE.RingGeometry(innerRadius, outerRadius, thetaSegments, 1);
    const pos = geom.attributes.position;
    const uvs = new Float32Array(pos.count * 2);

    for (let i = 0; i < pos.count; i++) {
        const x = pos.getX(i);
        const y = pos.getY(i);
        const r = Math.sqrt(x * x + y * y);
        const u = (r - innerRadius) / (outerRadius - innerRadius);
        uvs[i * 2] = THREE.MathUtils.clamp(u, 0, 1);
        uvs[i * 2 + 1] = 0.5;
    }

    geom.setAttribute("uv", new THREE.BufferAttribute(uvs, 2));
    return geom;
}

function createCassiniTracksGeometry(
    innerRadius: number,
    outerRadius: number,
    gapPosition: number,
    gapWidth: number,
    segments = 64
): THREE.BufferGeometry {
    const points: THREE.Vector3[] = [];
    const span = outerRadius - innerRadius;
    const halfGap = gapWidth / 2;
    const gapMin = innerRadius + span * Math.max(0.02, gapPosition - halfGap);
    const gapMax = innerRadius + span * Math.min(0.98, gapPosition + halfGap);

    const radii = [innerRadius, gapMin, gapMax, outerRadius];

    for (const r of radii) {
        for (let i = 0; i < segments; i++) {
            const theta1 = (i / segments) * Math.PI * 2;
            const theta2 = ((i + 1) / segments) * Math.PI * 2;
            points.push(new THREE.Vector3(Math.cos(theta1) * r, Math.sin(theta1) * r, 0));
            points.push(new THREE.Vector3(Math.cos(theta2) * r, Math.sin(theta2) * r, 0));
        }
    }

    return new THREE.BufferGeometry().setFromPoints(points);
}

export function PlanetaryRing({ ring }: PlanetaryRingProps) {
    const { isLight } = useTheme();
    const tilt = ring.tilt ?? [Math.PI / 2.8, 0, Math.PI / 7];
    const gapPos = ring.gapPosition ?? 0.615;
    const gapW = ring.gapWidth ?? 0.07;
    const emissiveInt = ring.emissiveIntensity ?? 0.15;
    const seed = ring.seed ?? 42;

    const effectiveColor = useMemo(() => {
        return getEffectiveAccentColor(ring.color, isLight);
    }, [ring.color, isLight]);

    const ringTexture = useMemo(() => {
        return createRingTexture(gapPos, gapW, seed);
    }, [gapPos, gapW, seed]);

    useEffect(() => {
        return () => {
            ringTexture.dispose();
        };
    }, [ringTexture]);

    const diskGeometry = useMemo(() => {
        return createRingBufferGeometry(ring.innerRadius, ring.outerRadius, 64);
    }, [ring.innerRadius, ring.outerRadius]);

    const tracksGeometry = useMemo(() => {
        return createCassiniTracksGeometry(ring.innerRadius, ring.outerRadius, gapPos, gapW, 64);
    }, [ring.innerRadius, ring.outerRadius, gapPos, gapW]);

    useEffect(() => {
        return () => {
            diskGeometry.dispose();
            tracksGeometry.dispose();
        };
    }, [diskGeometry, tracksGeometry]);

    const solidMaterial = useMemo(() => {
        return new THREE.MeshStandardMaterial({
            map: ringTexture,
            color: new THREE.Color(effectiveColor),
            emissive: new THREE.Color(effectiveColor),
            emissiveIntensity: emissiveInt,
            side: THREE.DoubleSide,
            transparent: true,
            opacity: ring.opacity ?? 0.75,
            roughness: 0.7,
            metalness: 0.15,
            depthWrite: false,
        });
    }, [ringTexture, effectiveColor, emissiveInt, ring.opacity]);

    const blueprintVeilMaterial = useMemo(() => {
        return new THREE.MeshBasicMaterial({
            map: ringTexture,
            color: new THREE.Color(effectiveColor),
            side: THREE.DoubleSide,
            transparent: true,
            opacity: 0.3,
            depthWrite: false,
        });
    }, [ringTexture, effectiveColor]);

    const tracksMaterial = useMemo(() => {
        return new THREE.LineBasicMaterial({
            color: new THREE.Color(effectiveColor),
            transparent: true,
            opacity: 0.7,
            depthWrite: false,
        });
    }, [effectiveColor]);

    useEffect(() => {
        return () => {
            solidMaterial.dispose();
            blueprintVeilMaterial.dispose();
            tracksMaterial.dispose();
        };
    }, [solidMaterial, blueprintVeilMaterial, tracksMaterial]);

    return (
        <group rotation={tilt}>
            {!isLight ? (
                <mesh geometry={diskGeometry} material={solidMaterial} />
            ) : (
                <>
                    <mesh geometry={diskGeometry} material={blueprintVeilMaterial} />
                    <lineSegments geometry={tracksGeometry} material={tracksMaterial} />
                </>
            )}
        </group>
    );
}

export default PlanetaryRing;
