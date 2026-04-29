import { forwardRef, useImperativeHandle, useRef } from "react";
import { useFrame } from "@react-three/fiber";
import * as THREE from "three";
import type { OrbitConfig, SunConfig } from "../types";
import { useGalaxyVisuals } from "../store";
import LowPolyPlanet from "./LowPolyPlanet";
import OrbitPathLine from "./OrbitPathLine";
import OrbitalAxisLine from "./OrbitalAxisLine";
import SunGlow from "./SunGlow";

export interface CelestialBodyProps {
    body: OrbitConfig | SunConfig;
    color?: string;
    isSun?: boolean;
    onSelect?: (id: string) => void;
}

export const CelestialBody = forwardRef<THREE.Group, CelestialBodyProps>(
    ({ body, color, isSun, onSelect }, ref) => {
        const orbitRef = useRef<THREE.Group>(null);
        const positionRef = useRef<THREE.Group>(null);
        const bodyRef = useRef<THREE.Mesh>(null);
        const visuals = useGalaxyVisuals();
        const effectiveColor = color ?? body.color ?? "white";

        useImperativeHandle(ref, () => positionRef.current as THREE.Group);

        const orbitConfig = body as OrbitConfig;
        const sunConfig = body as SunConfig;

        useFrame((_, delta) => {
            if (orbitRef.current && orbitConfig.orbitSpeed) {
                orbitRef.current.rotation.y += orbitConfig.orbitSpeed * delta;
            }
            if (bodyRef.current) {
                bodyRef.current.rotation.y += body.rotationSpeed * delta;
            }
        });

        const hasOrbit = (orbitConfig.orbitRadius ?? 0) > 0;
        const orbitInclination = orbitConfig.orbitInclination ?? 0;
        const orbitAscendingNode = orbitConfig.orbitAscendingNode ?? 0;
        const orbitArgument = orbitConfig.orbitArgument ?? 0;
        const axialTilt = orbitConfig.axialTilt ?? 0;

        return (
            <group rotation={[orbitInclination, orbitAscendingNode, orbitArgument]}>
                {visuals.showOrbitPaths && hasOrbit && (
                    <OrbitPathLine
                        radius={orbitConfig.orbitRadius!}
                        color={effectiveColor}
                        opacity={0.25}
                    />
                )}

                <group ref={orbitRef} rotation={[0, orbitConfig.initialAngle ?? 0, 0]}>
                    <group ref={positionRef} position={[orbitConfig.orbitRadius ?? 0, 0, 0]}>
                        <group rotation={[axialTilt, 0, 0]}>
                            <LowPolyPlanet
                                ref={(meshInstance) => {
                                    bodyRef.current = meshInstance;
                                    if (positionRef.current) {
                                        positionRef.current.userData.surfaceMesh = meshInstance;
                                    }
                                }}
                                body={body as OrbitConfig}
                                isSun={isSun}
                                color={effectiveColor}
                                onClick={(e) => {
                                    e.stopPropagation();
                                    onSelect?.(body.id);
                                }}
                                onPointerOver={() => {
                                    document.body.style.cursor = "pointer";
                                }}
                                onPointerOut={() => {
                                    document.body.style.cursor = "default";
                                }}
                            />

                            {visuals.showOrbitalAxes && !isSun && (
                                <OrbitalAxisLine
                                    radius={body.radius}
                                    color={effectiveColor}
                                    opacity={0.6}
                                />
                            )}
                        </group>

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
                                />
                            </>
                        )}

                        {orbitConfig.children?.map((child) => (
                            <CelestialBody key={child.id} body={child} />
                        ))}
                    </group>
                </group>
            </group>
        );
    }
);

CelestialBody.displayName = "CelestialBody";

export default CelestialBody;
