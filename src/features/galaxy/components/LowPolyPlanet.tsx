import { useMemo, useEffect, useRef, forwardRef, useImperativeHandle } from "react";
import { useFrame, type ThreeEvent } from "@react-three/fiber";
import * as THREE from "three";
import type { OrbitConfig } from "../types";
import { createLowPolyPlanetGeometry } from "../utils/proceduralTerrain";
import PlanetaryRing from "./PlanetaryRing";
import { useTheme } from "../../theme";

interface LowPolyPlanetProps {
    body: OrbitConfig;
    isSun?: boolean;
    color?: string;
    onClick?: (e: ThreeEvent<MouseEvent>) => void;
    onPointerOver?: (e: ThreeEvent<PointerEvent>) => void;
    onPointerOut?: (e: ThreeEvent<PointerEvent>) => void;
}

export const LowPolyPlanet = forwardRef<THREE.Mesh, LowPolyPlanetProps>(
    ({ body, isSun = false, color, onClick, onPointerOver, onPointerOut }, ref) => {
        const { isLight } = useTheme();
        const effectiveColor = color ?? body.color ?? "#5da9ff";
        const meshInternalRef = useRef<THREE.Mesh>(null);

        useImperativeHandle(ref, () => meshInternalRef.current as THREE.Mesh);

        const geometry = useMemo(() => {
            return createLowPolyPlanetGeometry({
                radius: body.radius,
                terrain: body.terrain,
                palette: body.palette,
                fallbackColor: effectiveColor,
                isSun,
            });
        }, [body.radius, body.terrain, body.palette, effectiveColor, isSun]);

        useEffect(() => {
            return () => {
                geometry.dispose();
            };
        }, [geometry]);

        const billboardGroupRef = useRef<THREE.Group>(null);

        const blueprintCoreTexture = useMemo(() => {
            if (!isLight) return null;
            const canvas = document.createElement("canvas");
            canvas.width = 128;
            canvas.height = 128;
            const ctx = canvas.getContext("2d");
            if (ctx) {
                const gradient = ctx.createRadialGradient(64, 64, 0, 64, 64, 64);
                gradient.addColorStop(0, "rgba(2, 132, 199, 0.7)");
                gradient.addColorStop(0.35, "rgba(3, 105, 161, 0.45)");
                gradient.addColorStop(0.7, "rgba(7, 89, 133, 0.15)");
                gradient.addColorStop(1, "rgba(7, 89, 133, 0)");

                ctx.fillStyle = gradient;
                ctx.fillRect(0, 0, 128, 128);
            }
            return new THREE.CanvasTexture(canvas);
        }, [isLight]);

        useEffect(() => {
            return () => {
                blueprintCoreTexture?.dispose();
            };
        }, [blueprintCoreTexture]);

        useFrame((state) => {
            if (billboardGroupRef.current && isLight) {
                billboardGroupRef.current.lookAt(state.camera.position);
            }
        });

        return (
            <group>
                <mesh
                    ref={meshInternalRef}
                    geometry={geometry}
                    onClick={onClick}
                    onPointerOver={onPointerOver}
                    onPointerOut={onPointerOut}
                >
                    {isSun ? (
                        isLight ? (
                            <meshBasicMaterial
                                vertexColors
                                wireframe
                            />
                        ) : (
                            <meshBasicMaterial vertexColors />
                        )
                    ) : isLight ? (
                        <meshBasicMaterial
                            vertexColors
                            wireframe
                        />
                    ) : (
                        <meshStandardMaterial
                            vertexColors
                            flatShading
                            roughness={0.7}
                            metalness={0.1}
                        />
                    )}
                </mesh>

                {isLight && blueprintCoreTexture && (
                    <group ref={billboardGroupRef}>
                        <mesh raycast={() => null}>
                            <circleGeometry args={[body.radius * 1.02, 32]} />
                            <meshBasicMaterial
                                color="#dbe4ee"
                                side={THREE.DoubleSide}
                                depthWrite={false}
                            />
                        </mesh>

                        <mesh position={[0, 0, 0.01]} raycast={() => null}>
                            <circleGeometry args={[body.radius * 1.02, 32]} />
                            <meshBasicMaterial
                                map={blueprintCoreTexture}
                                transparent
                                side={THREE.DoubleSide}
                                depthWrite={false}
                            />
                        </mesh>
                    </group>
                )}

                {body.ring && <PlanetaryRing ring={body.ring} />}
            </group>
        );
    }
);

LowPolyPlanet.displayName = "LowPolyPlanet";

export default LowPolyPlanet;
