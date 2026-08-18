import { useMemo, useRef } from "react";
import { Canvas, useFrame, useThree } from "@react-three/fiber";
import * as THREE from "three";
import CosmicBackground from "./components/CosmicBackground";
import CelestialBody from "./components/CelestialBody";
import CameraRig from "./components/CameraRig";
import Spaceship from "./components/Spaceship";
import AsteroidBelt from "./components/AsteroidBelt";
import { useGalaxyAsteroidBelt, useGalaxyPlanets, useGalaxySun, useGalaxyVisuals } from "./store";

export interface GalaxySceneProps {
    focusId: string;
    isEditorMode?: boolean;
    isCameraOrbitPaused?: boolean;
    allowManualOrbit?: boolean;
    onSelect?: (id: string) => void;
}

interface CameraFillLightProps {
    focusId: string;
    bodyRefs: React.RefObject<Record<string, THREE.Group | null>>;
    maxIntensity?: number;
    color?: string;
}

function CameraFillLight({
    focusId,
    bodyRefs,
    maxIntensity = 3.2,
    color = "#ffffff",
}: CameraFillLightProps) {
    const { camera } = useThree();
    const lightRef = useRef<THREE.SpotLight>(null);
    const targetRef = useRef<THREE.Object3D>(null);
    const targetPos = useRef(new THREE.Vector3());
    const prevFocusId = useRef(focusId);
    const activeTargetId = useRef(focusId);
    const isTransitioning = useRef(false);
    const transitionElapsed = useRef(0);
    const transitionStartDist = useRef(0);

    useFrame((_, delta) => {
        if (!lightRef.current || !targetRef.current) return;

        lightRef.current.position.copy(camera.position);

        if (focusId !== prevFocusId.current) {
            prevFocusId.current = focusId;
            isTransitioning.current = true;
            transitionElapsed.current = 0;
            const newGroup = bodyRefs.current[focusId];
            if (newGroup && focusId !== "home" && focusId !== "sun") {
                newGroup.getWorldPosition(targetPos.current);
                transitionStartDist.current = camera.position.distanceTo(targetPos.current);
            } else {
                transitionStartDist.current = 0;
            }
        }

        const newTargetIsBody = focusId !== "home" && focusId !== "sun";
        const newGroup = bodyRefs.current[focusId];

        if (isTransitioning.current) {
            transitionElapsed.current += delta;
            const timeProgress = Math.min(transitionElapsed.current / 0.72, 1.0);

            if (activeTargetId.current !== focusId) {
                const oldGroup = bodyRefs.current[activeTargetId.current];
                if (oldGroup && activeTargetId.current !== "home" && activeTargetId.current !== "sun") {
                    oldGroup.getWorldPosition(targetPos.current);
                    targetRef.current.position.copy(targetPos.current);

                    const surfaceMesh = oldGroup.userData?.surfaceMesh as THREE.Mesh | undefined;
                    let bodyRadius = 2.0;
                    if (surfaceMesh?.geometry?.boundingSphere) {
                        bodyRadius = surfaceMesh.geometry.boundingSphere.radius;
                    }

                    const dist = camera.position.distanceTo(targetPos.current);
                    const angularRadius = Math.atan2(bodyRadius * 1.15, Math.max(dist, 0.1));
                    lightRef.current.angle = THREE.MathUtils.clamp(angularRadius, 0.05, Math.PI / 3);
                    lightRef.current.distance = dist + bodyRadius * 0.2;

                    lightRef.current.intensity = THREE.MathUtils.damp(
                        lightRef.current.intensity,
                        0,
                        12.0,
                        delta
                    );

                    if (lightRef.current.intensity < 0.02 || timeProgress > 0.3) {
                        activeTargetId.current = focusId;
                        lightRef.current.intensity = 0;
                    }
                } else {
                    activeTargetId.current = focusId;
                    lightRef.current.intensity = 0;
                }
            } else if (newGroup && newTargetIsBody) {
                newGroup.getWorldPosition(targetPos.current);
                targetRef.current.position.copy(targetPos.current);

                const surfaceMesh = newGroup.userData?.surfaceMesh as THREE.Mesh | undefined;
                let bodyRadius = 2.0;
                if (surfaceMesh?.geometry?.boundingSphere) {
                    bodyRadius = surfaceMesh.geometry.boundingSphere.radius;
                }

                const dist = camera.position.distanceTo(targetPos.current);
                const angularRadius = Math.atan2(bodyRadius * 1.15, Math.max(dist, 0.1));
                lightRef.current.angle = THREE.MathUtils.clamp(angularRadius, 0.05, Math.PI / 3);
                lightRef.current.distance = dist + bodyRadius * 0.2;

                const startDist = Math.max(transitionStartDist.current, 15);
                const focusDist = 9.5;
                const distProgress = THREE.MathUtils.clamp(
                    1 - (dist - focusDist) / Math.max(startDist - focusDist, 1),
                    0,
                    1
                );
                const progress = Math.max(distProgress, timeProgress);
                const easedProgress = progress * progress * (3 - 2 * progress);
                const targetIntensity = maxIntensity * easedProgress;

                lightRef.current.intensity = THREE.MathUtils.damp(
                    lightRef.current.intensity,
                    targetIntensity,
                    6.0,
                    delta
                );

                if (timeProgress >= 1.0) {
                    isTransitioning.current = false;
                }
            } else {
                isTransitioning.current = false;
            }
        } else if (newGroup && newTargetIsBody) {
            activeTargetId.current = focusId;
            newGroup.getWorldPosition(targetPos.current);
            targetRef.current.position.copy(targetPos.current);

            const surfaceMesh = newGroup.userData?.surfaceMesh as THREE.Mesh | undefined;
            let bodyRadius = 2.0;
            if (surfaceMesh?.geometry?.boundingSphere) {
                bodyRadius = surfaceMesh.geometry.boundingSphere.radius;
            }

            const dist = camera.position.distanceTo(targetPos.current);
            const angularRadius = Math.atan2(bodyRadius * 1.15, Math.max(dist, 0.1));
            lightRef.current.angle = THREE.MathUtils.clamp(angularRadius, 0.05, Math.PI / 3);
            lightRef.current.distance = dist + bodyRadius * 0.2;

            const baseDist = 9.5;
            const distanceCompFactor = Math.max(dist / baseDist, 0.2);
            lightRef.current.intensity = maxIntensity * (distanceCompFactor * distanceCompFactor);
        } else {
            activeTargetId.current = focusId;
            isTransitioning.current = false;
            lightRef.current.distance = 0;
            lightRef.current.intensity = THREE.MathUtils.damp(
                lightRef.current.intensity,
                0,
                8.0,
                delta
            );
        }
    });

    const effectiveColor = useMemo(() => {
        return new THREE.Color(color).lerp(new THREE.Color("#ffffff"), 0.55);
    }, [color]);

    return (
        <>
            <object3D ref={targetRef} />
            <spotLight
                ref={lightRef}
                target={targetRef.current ?? undefined}
                color={effectiveColor}
                intensity={0}
                distance={0}
                decay={0}
                penumbra={0.2}
                angle={Math.PI / 6}
            />
        </>
    );
}

function GalaxyScene({
    focusId,
    isEditorMode = false,
    isCameraOrbitPaused,
    allowManualOrbit = true,
    onSelect,
}: GalaxySceneProps) {
    const bodyRefs = useRef<Record<string, THREE.Group | null>>({});
    const sun = useGalaxySun();
    const planets = useGalaxyPlanets();
    const asteroidBelt = useGalaxyAsteroidBelt();
    const visuals = useGalaxyVisuals();

    const effectiveCameraOrbitPaused =
        isEditorMode
            ? (isCameraOrbitPaused !== undefined ? isCameraOrbitPaused : !!visuals.freezeCameraOrbit)
            : false;

    return (
        <Canvas
            camera={{ position: [0, 20, 42], fov: 50, near: 0.1, far: 2000 }}
            style={{ touchAction: isEditorMode ? "none" : "pan-y" }}
        >
            <ambientLight intensity={0.15} />
            <CameraFillLight focusId={focusId} bodyRefs={bodyRefs} color={sun.color} />

            <CosmicBackground visible={visuals.showBackgroundPhenomena !== false} />

            <CelestialBody
                ref={(instance) => {
                    bodyRefs.current.home = instance;
                    bodyRefs.current.sun = instance;
                }}
                body={sun}
                isSun
                isEditorMode={isEditorMode}
                isSelected={focusId === "home" || focusId === "sun"}
                onSelect={onSelect}
            />

            <AsteroidBelt
                config={asteroidBelt}
                isEditorMode={isEditorMode}
                isSelected={focusId === "asteroid-belt"}
                onSelect={onSelect}
            />

            {planets.map((body) => (
                <CelestialBody
                    key={body.id}
                    ref={(instance) => {
                        bodyRefs.current[body.id] = instance;
                    }}
                    body={body}
                    isEditorMode={isEditorMode}
                    isSelected={focusId === body.id}
                    onSelect={onSelect}
                />
            ))}

            <CameraRig
                focusId={focusId}
                centralId="home"
                bodyRefs={bodyRefs}
                allowManualOrbit={allowManualOrbit}
                allowZoom={isEditorMode}
                cameraOrbitSpeed={sun.cameraOrbitSpeed}
                isCameraOrbitPaused={effectiveCameraOrbitPaused}
                onFocusChange={onSelect}
            />

            <Spaceship
                focusId={focusId}
                bodyRefs={bodyRefs}
            />
        </Canvas>
    );
}

export default GalaxyScene;