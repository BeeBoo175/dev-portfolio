import { useMemo, useEffect, forwardRef } from "react";
import type { ThreeEvent } from "@react-three/fiber";
import * as THREE from "three";
import type { OrbitConfig } from "../types";
import { createLowPolyPlanetGeometry } from "../utils/proceduralTerrain";
import PlanetaryRing from "./PlanetaryRing";

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
        const geometry = useMemo(() => {
            return createLowPolyPlanetGeometry({
                radius: body.radius,
                terrain: body.terrain,
                palette: body.palette,
                fallbackColor: color ?? body.color ?? "#5da9ff",
                isSun,
            });
        }, [body.radius, body.terrain, body.palette, color, body.color, isSun]);

        useEffect(() => {
            return () => {
                geometry.dispose();
            };
        }, [geometry]);

        return (
            <group>
                <mesh
                    ref={ref}
                    geometry={geometry}
                    onClick={onClick}
                    onPointerOver={onPointerOver}
                    onPointerOut={onPointerOut}
                >
                    {isSun ? (
                        <meshBasicMaterial vertexColors />
                    ) : (
                        <meshStandardMaterial
                            vertexColors
                            flatShading
                            roughness={0.7}
                            metalness={0.1}
                        />
                    )}
                </mesh>

                {body.ring && <PlanetaryRing ring={body.ring} />}
            </group>
        );
    }
);

LowPolyPlanet.displayName = "LowPolyPlanet";

export default LowPolyPlanet;
