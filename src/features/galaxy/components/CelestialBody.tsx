import { forwardRef, memo, useImperativeHandle, useRef, useState } from "react";
import { useFrame } from "@react-three/fiber";
import * as THREE from "three";
import type { OrbitConfig, SunConfig } from "../types";
import { useGalaxyVisuals } from "../store";
import LowPolyPlanet from "./LowPolyPlanet";
import OrbitPathLine from "./OrbitPathLine";
import OrbitalAxisLine from "./OrbitalAxisLine";
import SunGlow from "./SunGlow";
import SelectionGlow from "./SelectionGlow";
import { useTheme } from "../../theme";
import { resolveCelestialBodyColor } from "../utils/colorUtils";
import { useRadarTransition } from "../../transition";

export interface CelestialBodyProps {
    body: OrbitConfig | SunConfig;
    color?: string;
    isSun?: boolean;
    isMoon?: boolean;
    parentOrbitRadius?: number;
    isSelected?: boolean;
    selectedMoonId?: string;
    isEditorMode?: boolean;
    onSelect?: (id: string) => void;
}

export const CelestialBody = memo(forwardRef<THREE.Group, CelestialBodyProps>(
    ({ body, color, isSun, isMoon = false, parentOrbitRadius, isSelected = false, selectedMoonId, isEditorMode = false, onSelect }, ref) => {

        const orbitRef = useRef<THREE.Group>(null);
        const positionRef = useRef<THREE.Group>(null);
        const bodyRef = useRef<THREE.Mesh>(null);
        const bodyScaleGroupRef = useRef<THREE.Group>(null);
        const orbitPathGroupRef = useRef<THREE.Group>(null);
        const isRevealedRef = useRef(false);
        const { radarStateRef } = useRadarTransition();
        const { isLight } = useTheme();
        const [isHovered, setIsHovered] = useState(false);
        const visuals = useGalaxyVisuals();
        const effectiveColor = resolveCelestialBodyColor(body, color, "white");

        useImperativeHandle(ref, () => {
            if (positionRef.current && bodyRef.current) {
                positionRef.current.userData.surfaceMesh = bodyRef.current;
            }
            return positionRef.current as THREE.Group;
        });

        const orbitConfig = body as OrbitConfig;
        const sunConfig = body as SunConfig;

        useFrame((_, delta) => {
            if (positionRef.current && bodyRef.current && !positionRef.current.userData.surfaceMesh) {
                positionRef.current.userData.surfaceMesh = bodyRef.current;
            }
            if (orbitRef.current && orbitConfig.orbitSpeed) {
                orbitRef.current.rotation.y += orbitConfig.orbitSpeed * delta;
            }
            if (bodyRef.current) {
                bodyRef.current.rotation.y += body.rotationSpeed * delta;
            }

            const radarState = radarStateRef.current;
            if (radarState) {
                if (radarState.isComplete) {
                    if (!isRevealedRef.current) {
                        if (bodyScaleGroupRef.current) {
                            bodyScaleGroupRef.current.scale.set(1, 1, 1);
                            bodyScaleGroupRef.current.visible = true;
                        }
                        if (orbitPathGroupRef.current) {
                            orbitPathGroupRef.current.visible = true;
                        }
                        isRevealedRef.current = true;
                    }
                } else {
                    const dist = isSun
                        ? 0
                        : isMoon
                            ? (parentOrbitRadius ?? 0) + 0.8
                            : (orbitConfig.orbitRadius ?? 0);
                    const deltaR = radarState.currentRadius - dist;
                    if (orbitPathGroupRef.current) {
                        orbitPathGroupRef.current.visible = deltaR >= 0;
                    }
                    if (bodyScaleGroupRef.current) {
                        if (deltaR < 0) {
                            bodyScaleGroupRef.current.visible = false;
                            bodyScaleGroupRef.current.scale.set(0.001, 0.001, 0.001);
                        } else {
                            bodyScaleGroupRef.current.visible = true;
                            const progress = Math.min(1, deltaR / 3.0);
                            const p = progress - 1;
                            const scale = 1 + 2.70158 * Math.pow(p, 3) + 1.70158 * Math.pow(p, 2);
                            const clampedScale = Math.max(0.001, Math.min(1.15, scale));
                            bodyScaleGroupRef.current.scale.set(clampedScale, clampedScale, clampedScale);
                        }
                    }
                }
            }
        });

        const hasOrbit = (orbitConfig.orbitRadius ?? 0) > 0;
        const orbitInclination = orbitConfig.orbitInclination ?? 0;
        const orbitAscendingNode = orbitConfig.orbitAscendingNode ?? 0;
        const orbitArgument = orbitConfig.orbitArgument ?? 0;
        const axialTilt = orbitConfig.axialTilt ?? sunConfig.axialTilt ?? 0;

        const labelText = isSun ? "SUN" : (body.id.charAt(0).toUpperCase() + body.id.slice(1));

        return (
            <group rotation={[orbitInclination, orbitAscendingNode, orbitArgument]}>
                {visuals.showOrbitPaths && hasOrbit && (
                    <group ref={orbitPathGroupRef}>
                        <OrbitPathLine
                            radius={orbitConfig.orbitRadius!}
                            color={effectiveColor}
                            opacity={0.25}
                        />
                    </group>
                )}

                <group ref={orbitRef} rotation={[0, orbitConfig.initialAngle ?? 0, 0]}>
                    <group
                        ref={(groupInstance) => {
                            positionRef.current = groupInstance;
                            if (groupInstance && bodyRef.current) {
                                groupInstance.userData.surfaceMesh = bodyRef.current;
                            }
                        }}
                        position={[orbitConfig.orbitRadius ?? 0, 0, 0]}
                    >
                        <group ref={bodyScaleGroupRef} rotation={[axialTilt, 0, 0]}>
                            <LowPolyPlanet
                                ref={(meshInstance) => {
                                    bodyRef.current = meshInstance;
                                    if (positionRef.current) {
                                        positionRef.current.userData.surfaceMesh = meshInstance;
                                    }
                                }}
                                body={body as OrbitConfig}
                                isSun={isSun}
                                isMoon={isMoon}
                                color={effectiveColor}
                                onClick={(e) => {
                                    if (isMoon && !isEditorMode) return;
                                    e.stopPropagation();
                                    onSelect?.(body.id);
                                }}
                                onPointerOver={(e) => {
                                    if (isMoon && !isEditorMode) return;
                                    e.stopPropagation();
                                    setIsHovered(true);
                                    document.body.style.cursor = "pointer";
                                }}
                                onPointerOut={() => {
                                    if (isMoon && !isEditorMode) return;
                                    setIsHovered(false);
                                    document.body.style.cursor = "default";
                                }}
                            />

                            <mesh
                                visible={false}
                                onClick={(e) => {
                                    if (isMoon && !isEditorMode) return;
                                    e.stopPropagation();
                                    onSelect?.(body.id);
                                }}
                                onPointerOver={(e) => {
                                    if (isMoon && !isEditorMode) return;
                                    e.stopPropagation();
                                    setIsHovered(true);
                                    document.body.style.cursor = "pointer";
                                }}
                                onPointerOut={() => {
                                    if (isMoon && !isEditorMode) return;
                                    setIsHovered(false);
                                    document.body.style.cursor = "default";
                                }}
                            >
                                <sphereGeometry
                                    args={[
                                        isSun
                                            ? body.radius * 1.15
                                            : isMoon
                                                ? Math.max(body.radius * 1.8, body.radius + 0.3)
                                                : Math.max(body.radius * 1.4, body.radius + 0.5),
                                        12,
                                        12,
                                    ]}
                                />
                                <meshBasicMaterial transparent opacity={0} />
                            </mesh>

                            <SelectionGlow
                                radius={body.radius}
                                color={effectiveColor}
                                label={isSun ? (isEditorMode ? "SUN" : undefined) : (!isMoon && hasOrbit ? labelText : undefined)}
                                isSelected={isSun ? (isEditorMode && isSelected) : (isMoon ? (isEditorMode && isSelected) : isSelected)}
                                isHovered={isSun ? (isEditorMode && isHovered) : (isMoon ? (isEditorMode && isHovered) : isHovered)}
                            />


                            {visuals.showOrbitalAxes && (
                                <OrbitalAxisLine
                                    radius={body.radius}
                                    color={effectiveColor}
                                    opacity={0.6}
                                />
                            )}

                            {isSun && (
                                <>
                                    <pointLight
                                        color={effectiveColor}
                                        intensity={sunConfig.lightIntensity ?? 6}
                                        distance={0}
                                        decay={0}
                                    />
                                    <SunGlow
                                        radius={body.radius}
                                        color={effectiveColor}
                                        glowIntensity={sunConfig.glowIntensity ?? 1.0}
                                        visible={!isLight}
                                    />
                                </>
                            )}
                        </group>

                        {orbitConfig.children?.map((child) => (
                            <CelestialBody
                                key={child.id}
                                body={child}
                                isMoon={true}
                                parentOrbitRadius={orbitConfig.orbitRadius ?? 0}
                                isEditorMode={isEditorMode}
                                isSelected={selectedMoonId === child.id}
                                onSelect={onSelect}
                            />
                        ))}

                    </group>
                </group>
            </group>
        );
    }
));

CelestialBody.displayName = "CelestialBody";

export default CelestialBody;
