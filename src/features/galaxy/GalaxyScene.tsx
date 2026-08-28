import { useRef } from "react";
import { Canvas, useFrame, useThree } from "@react-three/fiber";
import * as THREE from "three";
import CelestialBody from "./CelestialBody";
import CameraRig from "./CameraRig";
import Spaceship from "./Spaceship";
import { CENTRAL_BODY, ORBIT_LAYOUT } from "./data";

export interface GalaxySceneProps {
    focusId: string;
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
        if (focusId !== "home") {
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

function GalaxyScene({ focusId, onSelect }: GalaxySceneProps) {
    const bodyRefs = useRef<Record<string, THREE.Group | null>>({});

    return (
        <Canvas
            camera={{ position: [0, 20, 42], fov: 50, near: 0.1, far: 2000 }}
            style={{ touchAction: "pan-y" }}
        >
            <ambientLight intensity={0.15} />
            <CameraFillLight focusId={focusId} bodyRefs={bodyRefs} />

            <CelestialBody
                body={CENTRAL_BODY}
                isSun
                onSelect={onSelect}
            />

            {ORBIT_LAYOUT.map((body) => (
                <CelestialBody
                    key={body.id}
                    ref={(instance) => {
                        bodyRefs.current[body.id] = instance;
                    }}
                    body={body}
                    onSelect={onSelect}
                />
            ))}

            <CameraRig
                focusId={focusId}
                centralId="home"
                bodyRefs={bodyRefs}
            />

            <Spaceship
                focusId={focusId}
                bodyRefs={bodyRefs}
            />
        </Canvas>
    );
}

export default GalaxyScene;