import * as THREE from "three";
import type { RingConfig } from "../types";

interface PlanetaryRingProps {
    ring: RingConfig;
}

export function PlanetaryRing({ ring }: PlanetaryRingProps) {
    const tilt = ring.tilt ?? [Math.PI / 2.8, 0, Math.PI / 7];

    return (
        <group rotation={tilt}>
            <mesh>
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
