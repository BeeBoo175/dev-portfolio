import { useRef } from "react";
import { Canvas } from "@react-three/fiber";
import * as THREE from "three";
import CelestialBody from "./CelestialBody";
import CameraRig from "./CameraRig";
import { CENTRAL_BODY, ORBIT_LAYOUT } from "./data";
import { SECTION_MAP } from "../sections/data";
import type { SectionId } from "../sections/types";

interface GalaxySceneProps {
    focusId: SectionId;
    onSelect?: (id: string) => void;
}

function GalaxyScene({ focusId, onSelect }: GalaxySceneProps) {
    const bodyRefs = useRef<Record<string, THREE.Group | null>>({});

    return (
        <Canvas
            camera={{ position: [0, 20, 42], fov: 50, near: 0.1, far: 2000 }}
            style={{ touchAction: "pan-y" }}
        >
            <ambientLight intensity={0.3} />

            <CelestialBody
                body={CENTRAL_BODY}
                color={SECTION_MAP["home"]?.color}
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
                    color={SECTION_MAP[body.id]?.color}
                    onSelect={onSelect}
                />
            ))}

            <CameraRig
                focusId={focusId}
                centralId="home"
                bodyRefs={bodyRefs}
            />
        </Canvas>
    );
}

export default GalaxyScene;