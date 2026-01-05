import { forwardRef, useImperativeHandle, useRef } from "react";
import { useFrame } from "@react-three/fiber";
import * as THREE from "three";
import type { OrbitConfig } from "./types";

interface CelestialBodyProps {
    body: OrbitConfig;
    color?: string;
    isSun?: boolean;
    onSelect?: (id: string) => void;
}

const CelestialBody = forwardRef<THREE.Group, CelestialBodyProps>(
    ({ body, color, isSun, onSelect }, ref) => {
        const orbitRef = useRef<THREE.Group>(null);
        const positionRef = useRef<THREE.Group>(null);
        const bodyRef = useRef<THREE.Mesh>(null);

        useImperativeHandle(ref, () => positionRef.current as THREE.Group);

        useFrame((_, delta) => {
            if (orbitRef.current) {
                orbitRef.current.rotation.y += (body.orbitSpeed ?? 0) * delta;
            }
            if (bodyRef.current) {
                bodyRef.current.rotation.y += body.rotationSpeed * delta;
            }
        });

        return (
            <group ref={orbitRef} rotation={[0, body.initialAngle ?? 0, 0]}>
                <group ref={positionRef} position={[body.orbitRadius ?? 0, 0, 0]}>
                    <mesh
                        ref={bodyRef}
                        onClick={(e) => {
                            e.stopPropagation();
                            onSelect?.(body.id);
                        }}
                        onPointerOver={() => {
                            document.body.style.cursor = "pointer";
                        }}
                        onPointerOut={() => {
                            document.body.style.cursor = "default";
                        }}
                    >
                        <sphereGeometry args={[body.radius, 32, 32]} />
                        {isSun ? (
                            <meshBasicMaterial color={color ?? "white"} />
                        ) : (
                            <meshStandardMaterial color={color ?? "white"} />
                        )}
                    </mesh>

                    {isSun && (
                        <pointLight color={color ?? "white"} intensity={2} distance={40} />
                    )}

                    {body.children?.map((child) => (
                        <CelestialBody key={child.id} body={child} />
                    ))}
                </group>
            </group>
        );
    }
);

CelestialBody.displayName = "CelestialBody";

export default CelestialBody;