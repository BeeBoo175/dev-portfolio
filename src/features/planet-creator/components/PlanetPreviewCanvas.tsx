import { useState, useRef, useEffect, useLayoutEffect } from "react";
import { Canvas, useFrame, useThree } from "@react-three/fiber";
import * as THREE from "three";
import { OrbitControls } from "three/addons/controls/OrbitControls.js";
import type { OrbitConfig } from "../../galaxy";
import { LowPolyPlanet, OrbitPathLine, OrbitalAxisLine, useGalaxyVisuals } from "../../galaxy";

export interface PlanetPreviewCanvasProps {
    planet: OrbitConfig;
    resetNonce?: number;
}

const DEFAULT_PITCH = 0.28;
const MIN_ZOOM = 0.35;
const MAX_ZOOM = 3.2;

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

function setDefaultOrbitView(camera: THREE.Camera, controls: OrbitControls, distance: number) {
    camera.position.set(
        0,
        distance * Math.sin(DEFAULT_PITCH),
        distance * Math.cos(DEFAULT_PITCH)
    );
    controls.target.set(0, 0, 0);
    controls.minDistance = distance * MIN_ZOOM;
    controls.maxDistance = distance * MAX_ZOOM;
    controls.update();
    controls.saveState();
}

function PreviewOrbitControls({
    baseDistance,
    resetNonce,
    controlsRef,
}: {
    baseDistance: number;
    resetNonce: number;
    controlsRef: React.MutableRefObject<OrbitControls | null>;
}) {
    const { camera, gl } = useThree();
    const baseDistanceRef = useRef(baseDistance);

    useLayoutEffect(() => {
        const controls = new OrbitControls(camera, gl.domElement);
        controls.enableDamping = true;
        controls.dampingFactor = 0.12;
        controls.enablePan = false;
        controls.minPolarAngle = Math.PI / 2 - 1.4;
        controls.maxPolarAngle = Math.PI / 2 + 1.4;
        setDefaultOrbitView(camera, controls, baseDistanceRef.current);
        controlsRef.current = controls;

        return () => {
            controls.dispose();
            if (controlsRef.current === controls) {
                controlsRef.current = null;
            }
        };
    }, [camera, gl, controlsRef]);

    useEffect(() => {
        const controls = controlsRef.current;
        if (!controls) return;

        const previous = baseDistanceRef.current;
        if (previous > 0 && previous !== baseDistance) {
            camera.position.multiplyScalar(baseDistance / previous);
        }
        baseDistanceRef.current = baseDistance;
        controls.minDistance = baseDistance * MIN_ZOOM;
        controls.maxDistance = baseDistance * MAX_ZOOM;
        controls.update();
    }, [baseDistance, camera, controlsRef]);

    useEffect(() => {
        const controls = controlsRef.current;
        if (!controls || resetNonce === 0) return;
        setDefaultOrbitView(camera, controls, baseDistanceRef.current);
    }, [resetNonce, camera, controlsRef]);

    useFrame(() => {
        controlsRef.current?.update();
    });

    return null;
}

function dollyPreview(controls: OrbitControls | null, factor: number) {
    if (!controls) return;
    const camera = controls.object;
    const offset = camera.position.clone().sub(controls.target);
    const nextLength = THREE.MathUtils.clamp(
        offset.length() * factor,
        controls.minDistance,
        controls.maxDistance
    );
    offset.setLength(nextLength);
    camera.position.copy(controls.target).add(offset);
    controls.update();
}

export function PlanetPreviewCanvas({ planet, resetNonce = 0 }: PlanetPreviewCanvasProps) {
    const [internalResetNonce, setInternalResetNonce] = useState(0);
    const controlsRef = useRef<OrbitControls | null>(null);

    const effectiveResetNonce = resetNonce + internalResetNonce;

    const maxChildOrbit = (planet.children ?? []).reduce(
        (acc, c) => Math.max(acc, (c.orbitRadius ?? 0) + c.radius),
        0
    );
    const maxRingOrbit = planet.ring?.outerRadius ?? 0;
    const effectiveBound = Math.max(planet.radius ?? 1, maxChildOrbit * 0.72, maxRingOrbit * 0.65);
    const baseDistance = Math.max(3.6, effectiveBound * 2.8);

    return (
        <div
            className="planet-studio__preview-canvas"
            onWheel={(e) => e.stopPropagation()}
        >
            <Canvas
                camera={{
                    position: [0, baseDistance * Math.sin(DEFAULT_PITCH), baseDistance * Math.cos(DEFAULT_PITCH)],
                    fov: 45,
                }}
                style={{ width: "100%", height: "100%", borderRadius: "var(--radius-md)" }}
            >
                <ambientLight intensity={0.25} />
                <directionalLight position={[6, 8, 5]} intensity={3.0} />
                <directionalLight position={[-6, -4, -5]} intensity={0.4} color="#93c5fd" />
                <PreviewOrbitControls
                    baseDistance={baseDistance}
                    resetNonce={effectiveResetNonce}
                    controlsRef={controlsRef}
                />
                <RotatingPlanet planet={planet} />
            </Canvas>

            <div className="planet-studio__zoom-overlay">
                <button
                    className="planet-studio__zoom-btn"
                    onClick={(e) => {
                        e.stopPropagation();
                        dollyPreview(controlsRef.current, 0.82);
                    }}
                    title="Zoom In"
                >
                    +
                </button>
                <button
                    className="planet-studio__zoom-btn"
                    onClick={(e) => {
                        e.stopPropagation();
                        dollyPreview(controlsRef.current, 1.22);
                    }}
                    title="Zoom Out"
                >
                    &minus;
                </button>
                <button
                    className="planet-studio__zoom-btn"
                    onClick={(e) => {
                        e.stopPropagation();
                        setInternalResetNonce((n) => n + 1);
                    }}
                    title="Reset Camera View"
                >
                    &#8635;
                </button>
            </div>
        </div>
    );
}

export default PlanetPreviewCanvas;