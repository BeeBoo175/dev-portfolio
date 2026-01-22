import { forwardRef, useImperativeHandle, useRef } from "react";
import { useFrame } from "@react-three/fiber";
import * as THREE from "three";
import type { OrbitConfig } from "../types";
import LowPolyPlanet from "./LowPolyPlanet";

export interface CelestialBodyProps {
    body: OrbitConfig;
    color?: string;
    isSun?: boolean;
    onSelect?: (id: string) => void;
}

export const CelestialBody = forwardRef<THREE.Group, CelestialBodyProps>(
    ({ body, color, isSun, onSelect }, ref) => {
        const orbitRef = useRef<THREE.Group>(null);
        const positionRef = useRef<THREE.Group>(null);
        const bodyRef = useRef<THREE.Mesh>(null);
        const effectiveColor = color ?? body.color ?? "white";

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
                    <LowPolyPlanet
                        ref={bodyRef}
                        body={body}
                        isSun={isSun}
                        color={effectiveColor}
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
                    />

                    {isSun && (
                        <pointLight
                            color={effectiveColor}
                            intensity={6}
                            distance={0}
                            decay={0}
                        />
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
