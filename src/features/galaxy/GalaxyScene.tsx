import { useState } from "react";
import { Canvas } from "@react-three/fiber";
import CosmicBackground from "./components/CosmicBackground";
import { RadarSweepVisual } from "../transition/components/RadarSweepVisual";
import CelestialBody from "./components/CelestialBody";
import CameraRig from "./components/CameraRig";
import Spaceship from "./components/Spaceship";
import AsteroidBelt from "./components/AsteroidBelt";
import CameraFillLight from "./components/CameraFillLight";
import CalloutTracker from "./components/CalloutTracker";
import CelestialGrid from "./components/CelestialGrid";
import SceneSettled from "./components/SceneSettled";
import ThemeToneMapping from "./components/ThemeToneMapping";
import QualityGovernor from "./components/QualityGovernor";
import { createBodyRegistry } from "./utils/bodyRegistry";
import { getDprSteps, getInitialStep, isLowEndDevice, judgeQuality, startQuality } from "./utils/renderQuality";
import { useGalaxyAsteroidBelt, useGalaxyPlanets, useGalaxySun, useGalaxyVisuals } from "./store";
import { useTheme } from "../theme";

export interface GalaxySceneProps {
    focusId: string;
    isEditorMode?: boolean;
    isCameraOrbitPaused?: boolean;
    allowManualOrbit?: boolean;
    selectedMoonId?: string;
    onSelect?: (id: string) => void;
    children?: React.ReactNode;
    calloutRef?: React.RefObject<SVGSVGElement | null>;
}

export function GalaxyScene({
    focusId,
    isEditorMode = false,
    isCameraOrbitPaused,
    allowManualOrbit = true,
    selectedMoonId,
    onSelect,
    children,
    calloutRef,
}: GalaxySceneProps) {
    const [registry] = useState(createBodyRegistry);
    const bodyRefs = registry.refs;
    const sun = useGalaxySun();
    const planets = useGalaxyPlanets();
    const asteroidBelt = useGalaxyAsteroidBelt();
    const visuals = useGalaxyVisuals();
    const { isLight } = useTheme();
    const [lowEnd] = useState(() => isLowEndDevice(navigator));
    const [dprSteps] = useState(() => getDprSteps(window.devicePixelRatio || 1));
    const [quality, setQuality] = useState(() => startQuality(getInitialStep(lowEnd, dprSteps)));
    const handleFrameSample = (typical: number) => {
        const next = judgeQuality(quality, typical, dprSteps.length);
        if (next !== quality) setQuality(next);
        return next.step !== quality.step;
    };

    const effectiveCameraOrbitPaused =
        isEditorMode
            ? (isCameraOrbitPaused !== undefined ? isCameraOrbitPaused : !!visuals.freezeCameraOrbit)
            : false;

    return (
        <Canvas
            camera={{ position: [0, 20, 42], fov: 50, near: 0.1, far: 2000 }}
            dpr={dprSteps[quality.step]}
            // reallocating the drawing buffer on every resize event is what makes window drags stutter
            resize={{ debounce: { resize: 200, scroll: 50 } }}
            style={{ touchAction: isEditorMode ? "none" : "pan-y" }}
        >
            <QualityGovernor onSample={handleFrameSample} />
            <SceneSettled />
            <ThemeToneMapping isLight={isLight} />
            <color attach="background" args={[isLight ? "#eaf1f8" : "#060a14"]} />
            <ambientLight intensity={isLight ? 0.85 : 0.15} />
            <CameraFillLight focusId={focusId} bodyRefs={bodyRefs} color={sun.color} />

            <CosmicBackground visible={visuals.showBackgroundPhenomena !== false} lite={lowEnd} />
            {isLight && visuals.showBackgroundPhenomena !== false && <CelestialGrid />}
            <RadarSweepVisual />
            {children}

            <CelestialBody
                ref={registry.callbackFor("home")}
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
                    ref={registry.callbackFor(body.id)}
                    body={body}
                    isEditorMode={isEditorMode}
                    isSelected={focusId === body.id}
                    selectedMoonId={focusId === body.id ? selectedMoonId : undefined}
                    onSelect={onSelect}
                />
            ))}


            <CameraRig
                focusId={focusId}
                centralId="home"
                bodyRefs={bodyRefs}
                allowManualOrbit={allowManualOrbit}
                allowZoom={isEditorMode}
                isEditorMode={isEditorMode}
                cameraOrbitSpeed={sun.cameraOrbitSpeed}
                isCameraOrbitPaused={effectiveCameraOrbitPaused}
                onFocusChange={onSelect}
            />

            <Spaceship
                focusId={focusId}
                bodyRefs={bodyRefs}
            />

            {calloutRef && (
                <CalloutTracker
                    focusId={focusId}
                    isEditorMode={isEditorMode}
                    bodyRefs={bodyRefs}
                    calloutRef={calloutRef}
                />
            )}
        </Canvas>
    );
}

export default GalaxyScene;