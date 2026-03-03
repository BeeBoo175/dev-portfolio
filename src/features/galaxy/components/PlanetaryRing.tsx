import { useRef, useEffect } from "react";
import * as THREE from "three";
import type { RingConfig } from "../types";

interface PlanetaryRingProps {
    ring: RingConfig;
}

export function PlanetaryRing({ ring }: PlanetaryRingProps) {
    const meshRef = useRef<THREE.Mesh>(null);
    const tilt = ring.tilt ?? [Math.PI / 2.8, 0, Math.PI / 7];

    useEffect(() => {
        const mesh = meshRef.current;
        return () => {
            if (mesh) {
                mesh.geometry.dispose();
                if (Array.isArray(mesh.material)) {
                    mesh.material.forEach((m) => m.dispose());
                } else {
                    mesh.material.dispose();
                }
            }
        };
    }, []);

    return (
        <group rotation={tilt}>
            <mesh ref={meshRef}>
                <ringGeometry args={[ring.innerRadius, ring.outerRadius, 64]} />
                <meshStandardMaterial
                    color={ring.color}
                    side={THREE.DoubleSide}
                    transparent
                    opacity={ring.opacity ?? 0.8}
                    roughness={0.4}
                    metalness={0.3}
                />
            </mesh>
        </group>
    );
}

export default PlanetaryRing;
