import { useRef } from "react";
import { Canvas } from "@react-three/fiber";
import * as THREE from "three";
import CosmicBackground from "./components/CosmicBackground";
import CelestialBody from "./components/CelestialBody";
import CameraRig from "./components/CameraRig";
import Spaceship from "./components/Spaceship";
import AsteroidBelt from "./components/AsteroidBelt";
import CameraFillLight from "./components/CameraFillLight";
import { useGalaxyAsteroidBelt, useGalaxyPlanets, useGalaxySun, useGalaxyVisuals } from "./store";

export interface GalaxySceneProps {
    focusId: string;
    isEditorMode?: boolean;
    isCameraOrbitPaused?: boolean;
    allowManualOrbit?: boolean;
    onSelect?: (id: string) => void;
}

export function GalaxyScene({
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