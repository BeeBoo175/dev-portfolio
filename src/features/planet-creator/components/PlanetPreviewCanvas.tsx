import { useRef } from "react";
import { Canvas, useFrame } from "@react-three/fiber";
import * as THREE from "three";
import type { OrbitConfig } from "../../galaxy";
import { LowPolyPlanet, OrbitPathLine, OrbitalAxisLine, useGalaxyVisuals } from "../../galaxy";

export interface PlanetPreviewCanvasProps {
    planet: OrbitConfig;
}

function RotatingMoon({ moon }: { moon: OrbitConfig }) {
    const orbitRef = useRef<THREE.Group>(null);
    const bodyRef = useRef<THREE.Mesh>(null);
    const visuals = useGalaxyVisuals();

    useFrame((_, delta) => {
        if (orbitRef.current) {
            orbitRef.current.rotation.y += (moon.orbitSpeed ?? 0.8) * delta;
        }
        if (bodyRef.current) {
            bodyRef.current.rotation.y += (moon.rotationSpeed ?? 0.5) * delta;
        }
    });

    const orbitRadius = moon.orbitRadius ?? 2.0;
    const orbitInclination = moon.orbitInclination ?? 0;
    const axialTilt = moon.axialTilt ?? 0;

    return (
        <group rotation={[orbitInclination, 0, 0]}>
            {visuals.showOrbitPaths && (
                <OrbitPathLine
                    radius={orbitRadius}
                    color={moon.color ?? "#94a3b8"}
                    opacity={0.35}
                />
            )}
            <group ref={orbitRef}>
                <group position={[orbitRadius, 0, 0]}>
                    <group rotation={[axialTilt, 0, 0]}>
                        <LowPolyPlanet ref={bodyRef} body={moon} />
                        {visuals.showOrbitalAxes && (
                            <OrbitalAxisLine
                                radius={moon.radius}
                                color={moon.color ?? "#94a3b8"}
                                opacity={0.5}
                            />
                        )}
                    </group>
                </group>
            </group>
        </group>
    );
}

function RotatingPlanet({ planet }: { planet: OrbitConfig }) {
    const groupRef = useRef<THREE.Group>(null);
    const visuals = useGalaxyVisuals();

    useFrame((_, delta) => {
        if (groupRef.current) {
            groupRef.current.rotation.y += (planet.rotationSpeed ?? 0.3) * delta;
        }
    });

    const axialTilt = planet.axialTilt ?? 0;

    return (
        <group ref={groupRef}>
            <group rotation={[axialTilt, 0, 0]}>
                <LowPolyPlanet body={planet} />
                {visuals.showOrbitalAxes && (
                    <OrbitalAxisLine
                        radius={planet.radius}
                        color={planet.color ?? "#38bdf8"}
                        opacity={0.6}
                    />
                )}
            </group>
            {planet.children?.map((child) => (
                <RotatingMoon key={child.id} moon={child} />
            ))}
        </group>
    );
}

export function PlanetPreviewCanvas({ planet }: PlanetPreviewCanvasProps) {
    const maxChildOrbit = (planet.children ?? []).reduce(
        (acc, c) => Math.max(acc, (c.orbitRadius ?? 0) + c.radius),
        0
    );
    const maxRingOrbit = planet.ring?.outerRadius ?? 0;
    const effectiveBound = Math.max(planet.radius ?? 1, maxChildOrbit * 0.72, maxRingOrbit * 0.65);
    const cameraDist = Math.max(3.6, effectiveBound * 2.8);

    return (
        <Canvas
            camera={{ position: [0, 1.4, cameraDist], fov: 45 }}
            style={{ width: "100%", height: "100%", borderRadius: "16px" }}
        >
            <ambientLight intensity={0.25} />
            <directionalLight position={[6, 8, 5]} intensity={3.0} />
            <directionalLight position={[-6, -4, -5]} intensity={0.4} color="#93c5fd" />
            <RotatingPlanet planet={planet} />
        </Canvas>
    );
}

export default PlanetPreviewCanvas;
