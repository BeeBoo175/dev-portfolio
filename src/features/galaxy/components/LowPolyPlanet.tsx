import { useMemo, useEffect, useRef, useState, forwardRef, useImperativeHandle } from "react";
import { useFrame, type ThreeEvent } from "@react-three/fiber";
import * as THREE from "three";
import type { OrbitConfig } from "../types";
import { createMultiLODPlanetGeometries, createLowPolyPlanetGeometry } from "../utils/proceduralTerrain";
import {
    calculateProjectedDiameter,
    resolveLODLevel,
    LOD_LEVEL_HIGH,
    LOD_LEVEL_MEDIUM,
    LOD_LEVEL_SPARSE,
    LOD_LEVEL_SIMPLE,
    LOD_LEVEL_POINT,
} from "../utils/lodUtils";
import PlanetaryRing from "./PlanetaryRing";
import { useTheme } from "../../theme";

interface LowPolyPlanetProps {
    body: OrbitConfig;
    isSun?: boolean;
    isMoon?: boolean;
    color?: string;
    onClick?: (e: ThreeEvent<MouseEvent>) => void;
    onPointerOver?: (e: ThreeEvent<PointerEvent>) => void;
    onPointerOut?: (e: ThreeEvent<PointerEvent>) => void;
}

const _scratchWorldPos = new THREE.Vector3();

export const LowPolyPlanet = forwardRef<THREE.Mesh, LowPolyPlanetProps>(
    ({ body, isSun = false, isMoon = false, color, onClick, onPointerOver, onPointerOut }, ref) => {
        const { isLight } = useTheme();
        const effectiveColor = color ?? body.color ?? "#5da9ff";
        const meshInternalRef = useRef<THREE.Mesh>(null);
        const groupRef = useRef<THREE.Group>(null);
        const currentLodRef = useRef<number>(LOD_LEVEL_HIGH);
        const [activeLod, setActiveLod] = useState<number>(LOD_LEVEL_HIGH);
        const frameCounterRef = useRef<number>(0);

        useImperativeHandle(ref, () => meshInternalRef.current as THREE.Mesh);

        const darkModeGeometry = useMemo(() => {
            if (isLight) return null;
            return createLowPolyPlanetGeometry({
                radius: body.radius,
                terrain: body.terrain,
                palette: body.palette,
                fallbackColor: effectiveColor,
                isSun,
            });
        }, [isLight, body.radius, body.terrain, body.palette, effectiveColor, isSun]);

        const multiLODGeometries = useMemo(() => {
            if (!isLight) return null;
            return createMultiLODPlanetGeometries(
                {
                    radius: body.radius,
                    terrain: body.terrain,
                    palette: body.palette,
                    fallbackColor: effectiveColor,
                    isSun,
                },
                isMoon
            );
        }, [isLight, body.radius, body.terrain, body.palette, effectiveColor, isSun, isMoon]);

        useEffect(() => {
            return () => {
                darkModeGeometry?.dispose();
                if (multiLODGeometries) {
                    multiLODGeometries.high.dispose();
                    multiLODGeometries.medium.dispose();
                    multiLODGeometries.sparse.dispose();
                    multiLODGeometries.simple.dispose();
                }
            };
        }, [darkModeGeometry, multiLODGeometries]);

        const activeGeometry = useMemo(() => {
            if (!isLight) {
                return darkModeGeometry;
            }
            if (!multiLODGeometries) return null;

            switch (activeLod) {
                case LOD_LEVEL_HIGH:
                    return multiLODGeometries.high;
                case LOD_LEVEL_MEDIUM:
                    return multiLODGeometries.medium;
                case LOD_LEVEL_SPARSE:
                    return multiLODGeometries.sparse;
                case LOD_LEVEL_SIMPLE:
                case LOD_LEVEL_POINT:
                default:
                    return multiLODGeometries.simple;
            }
        }, [isLight, darkModeGeometry, activeLod, multiLODGeometries]);

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
            if (isLight && groupRef.current) {
                frameCounterRef.current += 1;
                if (frameCounterRef.current % 3 === 0) {
                    groupRef.current.getWorldPosition(_scratchWorldPos);
                    const screenHeight = state.size.height || 1080;
                    const diameterPx = calculateProjectedDiameter(
                        body.radius,
                        _scratchWorldPos,
                        state.camera,
                        screenHeight
                    );

                    const nextLod = resolveLODLevel(diameterPx, currentLodRef.current, isMoon);
                    if (nextLod !== currentLodRef.current) {
                        currentLodRef.current = nextLod;
                        if (meshInternalRef.current && multiLODGeometries) {
                            let geom = multiLODGeometries.simple;
                            if (nextLod === LOD_LEVEL_HIGH) geom = multiLODGeometries.high;
                            else if (nextLod === LOD_LEVEL_MEDIUM) geom = multiLODGeometries.medium;
                            else if (nextLod === LOD_LEVEL_SPARSE) geom = multiLODGeometries.sparse;
                            meshInternalRef.current.geometry = geom;
                        }
                        setActiveLod(nextLod);
                    }
                }
            }

            if (billboardGroupRef.current && isLight) {
                billboardGroupRef.current.lookAt(state.camera.position);
                _scratchWorldPos.subVectors(state.camera.position, billboardGroupRef.current.parent ? billboardGroupRef.current.parent.position : groupRef.current?.position || new THREE.Vector3());
                _scratchWorldPos.normalize().multiplyScalar(-0.05 * body.radius);
                billboardGroupRef.current.position.copy(_scratchWorldPos);
            }
        });

        const isPointMode = isLight && activeLod === LOD_LEVEL_POINT;

        return (
            <group ref={groupRef}>
                {!isPointMode && (
                    <mesh
                        ref={meshInternalRef}
                        geometry={activeGeometry ?? undefined}
                        onClick={onClick}
                        onPointerOver={onPointerOver}
                        onPointerOut={onPointerOut}
                    >
                        {isSun ? (
                            isLight ? (
                                <meshBasicMaterial vertexColors wireframe />
                            ) : (
                                <meshBasicMaterial vertexColors />
                            )
                        ) : isLight ? (
                            <meshBasicMaterial vertexColors wireframe />
                        ) : (
                            <meshStandardMaterial
                                vertexColors
                                flatShading
                                roughness={0.7}
                                metalness={0.1}
                            />
                        )}
                    </mesh>
                )}

                {isLight && blueprintCoreTexture && (
                    <group
                        ref={billboardGroupRef}
                        onClick={isPointMode ? onClick : undefined}
                        onPointerOver={isPointMode ? onPointerOver : undefined}
                        onPointerOut={isPointMode ? onPointerOut : undefined}
                    >
                        <mesh raycast={() => null}>
                            <circleGeometry args={[body.radius * 1.02, 48]} />
                            <meshBasicMaterial
                                color="#cad2dc"
                                side={THREE.DoubleSide}
                                depthWrite={false}
                            />
                        </mesh>

                        <mesh position={[0, 0, 0.01]} raycast={() => null}>
                            <circleGeometry args={[body.radius * 1.02, 48]} />
                            <meshBasicMaterial
                                map={blueprintCoreTexture}
                                transparent
                                side={THREE.DoubleSide}
                                depthWrite={false}
                            />
                        </mesh>

                        <mesh position={[0, 0, 0.015]} raycast={() => null}>
                            <ringGeometry args={[body.radius * 1.015, body.radius * 1.025, 64]} />
                            <meshBasicMaterial
                                color={isSun ? (body.palette?.peak ?? "#fffbeb") : effectiveColor}
                                wireframe
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
