import { useRef } from "react";
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

const IN_FOCUS_DISTANCE = 6.8;
const FADE_START_DISTANCE = 14.0;

function CameraFillLight({
    focusId,
    bodyRefs,
    maxIntensity = 0.45,
    color = "#ffffff",
}: CameraFillLightProps) {
    const { camera } = useThree();
    const lightRef = useRef<THREE.PointLight>(null);
    const targetWorldPos = useRef(new THREE.Vector3());

    useFrame((_, delta) => {
        if (!lightRef.current) return;
        lightRef.current.position.copy(camera.position);

        let targetIntensity = 0;
        if (focusId !== "home" && focusId !== "sun") {
            const planetGroup = bodyRefs.current[focusId];
            if (planetGroup) {
                planetGroup.getWorldPosition(targetWorldPos.current);
                const distance = camera.position.distanceTo(targetWorldPos.current);
                const progress = THREE.MathUtils.clamp(
                    1 - (distance - IN_FOCUS_DISTANCE) / (FADE_START_DISTANCE - IN_FOCUS_DISTANCE),
                    0,
                    1
                );
                const eased = progress * progress * (3 - 2 * progress);
                targetIntensity = eased * maxIntensity;
            }
        }

        lightRef.current.intensity = THREE.MathUtils.damp(
            lightRef.current.intensity,
            targetIntensity,
            6,
            delta
        );
    });

    return (
        <pointLight
            ref={lightRef}
            color={color}
            intensity={0}
            distance={0}
            decay={0}
        />
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
            <CameraFillLight focusId={focusId} bodyRefs={bodyRefs} />

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