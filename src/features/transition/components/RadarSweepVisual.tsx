import { useEffect, useMemo, useRef } from "react";
import { useFrame } from "@react-three/fiber";
import * as THREE from "three";
import { useRadarTransition } from "../hooks/useRadarTransition";
import { useTheme } from "../../theme";
import { useGalaxyPlanets } from "../../galaxy/store";

const _radarWaveTextureCache = new Map<string, THREE.CanvasTexture>();

function getRadarWaveTexture(isLight: boolean): THREE.CanvasTexture {
    const key = isLight ? "light" : "dark";
    const cached = _radarWaveTextureCache.get(key);
    if (cached) return cached;

    const size = 512;
    const canvas = document.createElement("canvas");
    canvas.width = size;
    canvas.height = size;
    const ctx = canvas.getContext("2d");
    if (ctx) {
        const center = size / 2;

        const gradient = ctx.createRadialGradient(center, center, center * 0.76, center, center, center * 0.995);
        if (isLight) {
            gradient.addColorStop(0, "rgba(2, 132, 199, 0)");
            gradient.addColorStop(0.35, "rgba(2, 132, 199, 0.08)");
            gradient.addColorStop(0.70, "rgba(2, 132, 199, 0.25)");
            gradient.addColorStop(0.88, "rgba(14, 165, 233, 0.65)");
            gradient.addColorStop(0.97, "rgba(2, 132, 199, 0.92)");
            gradient.addColorStop(1, "rgba(2, 132, 199, 0)");
        } else {
            gradient.addColorStop(0, "rgba(14, 165, 233, 0)");
            gradient.addColorStop(0.30, "rgba(14, 165, 233, 0.06)");
            gradient.addColorStop(0.65, "rgba(2, 132, 199, 0.22)");
            gradient.addColorStop(0.85, "rgba(56, 189, 248, 0.55)");
            gradient.addColorStop(0.97, "rgba(255, 255, 255, 0.95)");
            gradient.addColorStop(1, "rgba(56, 189, 248, 0)");
        }
        ctx.fillStyle = gradient;
        ctx.fillRect(0, 0, size, size);
    }
    const tex = new THREE.CanvasTexture(canvas);
    tex.minFilter = THREE.LinearFilter;
    tex.magFilter = THREE.LinearFilter;
    _radarWaveTextureCache.set(key, tex);
    return tex;
}

export function RadarSweepVisual() {
    const { radarStateRef, notifyComplete, isRadarComplete } = useRadarTransition();
    const { isLight } = useTheme();
    const planets = useGalaxyPlanets();
    const groupRef = useRef<THREE.Group>(null);
    const planeMeshRef = useRef<THREE.Mesh>(null);
    const coreRingRef = useRef<THREE.Mesh>(null);

    const waveMatRef = useRef<THREE.MeshBasicMaterial>(null);
    const coreMatRef = useRef<THREE.MeshBasicMaterial>(null);
    const elapsedTimeRef = useRef(0);

    const waveTexture = useMemo(() => getRadarWaveTexture(isLight), [isLight]);
    const accentCore = isLight ? "#0284c7" : "#38bdf8";
    const coreBaseOpacity = isLight ? 0.95 : 0.98;

    const prevCompleteRef = useRef(isRadarComplete);
    useEffect(() => {
        if (prevCompleteRef.current && !isRadarComplete) {
            elapsedTimeRef.current = 0;
        }
        prevCompleteRef.current = isRadarComplete;
    }, [isRadarComplete]);

    useEffect(() => {
        if (coreMatRef.current) {
            coreMatRef.current.color.set(accentCore);
        }
    }, [accentCore]);

    const galaxySize = useMemo(() => {
        let max = 34.6;
        for (const p of planets) {
            let reach = p.orbitRadius ?? 0;
            if (p.children && p.children.length > 0) {
                for (const child of p.children) {
                    reach = Math.max(reach, (p.orbitRadius ?? 0) + (child.orbitRadius ?? 0));
                }
            }
            if (reach > max) max = reach;
        }
        return max;
    }, [planets]);

    const targetMaxRadius = galaxySize * 1.32;

    useFrame((_, delta) => {
        if (!groupRef.current) return;
        const state = radarStateRef.current;
        if (!state || state.isComplete) {
            groupRef.current.visible = false;
            return;
        }

        if (state.maxRadius !== targetMaxRadius) {
            state.maxRadius = targetMaxRadius;
        }

        if (state.currentRadius === 0 && elapsedTimeRef.current > 0) {
            elapsedTimeRef.current = 0;
        }

        groupRef.current.visible = true;
        elapsedTimeRef.current += delta;
        const progress = Math.min(1, elapsedTimeRef.current / state.duration);
        const eased = 1 - Math.pow(1 - progress, 2.6);
        state.currentRadius = eased * state.maxRadius;

        const outerSpan = Math.max(0.1, state.maxRadius - galaxySize);
        const outerProgress = Math.min(1, Math.max(0, (state.currentRadius - galaxySize) / outerSpan));
        const fadeFactor = state.currentRadius <= galaxySize
            ? 1.0
            : Math.pow(1 - outerProgress, 1.3);

        if (waveMatRef.current) {
            waveMatRef.current.opacity = fadeFactor;
        }
        if (coreMatRef.current) {
            coreMatRef.current.opacity = coreBaseOpacity * fadeFactor;
        }

        if (progress >= 1) {
            state.currentRadius = state.maxRadius;
            state.isComplete = true;
            groupRef.current.visible = false;
            notifyComplete();
            return;
        }

        const r = Math.max(0.001, state.currentRadius);
        if (planeMeshRef.current) {
            planeMeshRef.current.scale.set(r, r, 1);
        }
        if (coreRingRef.current) {
            coreRingRef.current.scale.set(r, r, 1);
        }
    });

    if (isRadarComplete) return null;

    const blendingMode = isLight ? THREE.NormalBlending : THREE.AdditiveBlending;

    return (
        <group ref={groupRef} position={[0, 0.06, 0]} rotation={[-Math.PI / 2, 0, 0]}>
            <mesh ref={planeMeshRef} renderOrder={98}>
                <planeGeometry args={[2, 2]} />
                <meshBasicMaterial
                    ref={waveMatRef}
                    map={waveTexture}
                    transparent
                    opacity={1}
                    blending={blendingMode}
                    side={THREE.DoubleSide}
                    depthWrite={false}
                />
            </mesh>

            <mesh ref={coreRingRef} renderOrder={99}>
                <ringGeometry args={[0.99, 1.0, 128]} />
                <meshBasicMaterial
                    ref={coreMatRef}
                    color={accentCore}
                    transparent
                    opacity={coreBaseOpacity}
                    blending={blendingMode}
                    side={THREE.DoubleSide}
                    depthWrite={false}
                />
            </mesh>
        </group>
    );
}

export default RadarSweepVisual;
