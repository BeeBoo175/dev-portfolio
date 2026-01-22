import { useRef } from "react";
import { Canvas, useFrame } from "@react-three/fiber";
import * as THREE from "three";
import type { OrbitConfig } from "../../galaxy";
import { LowPolyPlanet } from "../../galaxy";

export interface PlanetPreviewCanvasProps {
    planet: OrbitConfig;
}

function RotatingPlanet({ planet }: { planet: OrbitConfig }) {
    const groupRef = useRef<THREE.Group>(null);

    useFrame((_, delta) => {
        if (groupRef.current) {
            groupRef.current.rotation.y += 0.4 * delta;
        }
    });

    return (
        <group ref={groupRef}>
            <LowPolyPlanet body={planet} />
        </group>
    );
}

export function PlanetPreviewCanvas({ planet }: PlanetPreviewCanvasProps) {
    const cameraDist = Math.max(3.2, (planet.radius ?? 1) * 3.4);

    return (
        <Canvas
            camera={{ position: [0, 1.2, cameraDist], fov: 45 }}
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
