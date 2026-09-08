import { useEffect, useMemo, useRef } from "react";
import { useFrame } from "@react-three/fiber";
import * as THREE from "three";
import { useRadarTransition } from "../hooks/useRadarTransition";
import { useTheme } from "../../theme";
import { useGalaxyPlanets } from "../../galaxy/store";

export function RadarSweepVisual() {
    const { radarStateRef, notifyComplete, isRadarComplete } = useRadarTransition();
    const { isLight } = useTheme();
    const planets = useGalaxyPlanets();
    const groupRef = useRef<THREE.Group>(null);
    const primaryRingRef = useRef<THREE.Mesh>(null);
    const trailingWaveRef = useRef<THREE.Mesh>(null);

    const primaryMatRef = useRef<THREE.MeshBasicMaterial>(null);
    const trailingMatRef = useRef<THREE.MeshBasicMaterial>(null);
    const elapsedTimeRef = useRef(0);

    const accentPrimary = isLight ? "#1d4ed8" : "#38bdf8";
    const accentTrailing = isLight ? "#06b6d4" : "#0284c7";
    const primaryBaseOpacity = isLight ? 0.98 : 0.92;
    const trailingBaseOpacity = isLight ? 0.48 : 0.40;

    useEffect(() => {
        if (primaryMatRef.current) {
            primaryMatRef.current.color.set(accentPrimary);
        }
        if (trailingMatRef.current) {
            trailingMatRef.current.color.set(accentTrailing);
        }
    }, [accentPrimary, accentTrailing]);

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

    const targetMaxRadius = galaxySize * 1.28;

    useFrame((_, delta) => {
        if (!groupRef.current) return;
        const state = radarStateRef.current;
        if (!state || state.isComplete) {
            groupRef.current.visible = false;
            return;
        }

        if (state.maxRadius < targetMaxRadius) {
            state.maxRadius = targetMaxRadius;
        }

        if (state.currentRadius === 0 && elapsedTimeRef.current > 0) {
            elapsedTimeRef.current = 0;
        }

        groupRef.current.visible = true;
        elapsedTimeRef.current += delta;
        const progress = Math.min(1, elapsedTimeRef.current / state.duration);
        const eased = 1 - Math.pow(1 - progress, 2.8);
        state.currentRadius = eased * state.maxRadius;

        const outerSpan = Math.max(0.1, state.maxRadius - galaxySize);
        const outerProgress = Math.min(1, Math.max(0, (state.currentRadius - galaxySize) / outerSpan));
        const fadeFactor = state.currentRadius <= galaxySize
            ? 1.0 - (state.currentRadius / galaxySize) * 0.06
            : 0.94 * Math.pow(1 - outerProgress, 1.2);

        if (primaryMatRef.current) {
            primaryMatRef.current.opacity = primaryBaseOpacity * fadeFactor;
        }
        if (trailingMatRef.current) {
            trailingMatRef.current.opacity = trailingBaseOpacity * fadeFactor;
        }

        if (progress >= 1) {
            state.currentRadius = state.maxRadius;
            state.isComplete = true;
            groupRef.current.visible = false;
            notifyComplete();
            return;
        }

        const r = Math.max(0.001, state.currentRadius);
        if (primaryRingRef.current) {
            primaryRingRef.current.scale.set(r, r, 1);
        }
        if (trailingWaveRef.current) {
            trailingWaveRef.current.scale.set(r, r, 1);
        }
    });

    if (isRadarComplete) return null;

    return (
        <group ref={groupRef} position={[0, 0.05, 0]} rotation={[-Math.PI / 2, 0, 0]}>
            <mesh ref={primaryRingRef} renderOrder={99}>
                <ringGeometry args={[0.988, 1.0, 96]} />
                <meshBasicMaterial
                    ref={primaryMatRef}
                    color={accentPrimary}
                    transparent
                    opacity={primaryBaseOpacity}
                    side={THREE.DoubleSide}
                    depthWrite={false}
                />
            </mesh>

            <mesh ref={trailingWaveRef} renderOrder={98}>
                <ringGeometry args={[0.92, 0.988, 96]} />
                <meshBasicMaterial
                    ref={trailingMatRef}
                    color={accentTrailing}
                    transparent
                    opacity={trailingBaseOpacity}
                    side={THREE.DoubleSide}
                    depthWrite={false}
                />
            </mesh>
        </group>
    );
}

export default RadarSweepVisual;
