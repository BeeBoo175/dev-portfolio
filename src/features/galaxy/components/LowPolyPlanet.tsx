import { useMemo, useEffect, useRef, forwardRef, useImperativeHandle, memo } from "react";
import { useFrame, type ThreeEvent } from "@react-three/fiber";
import * as THREE from "three";
import type { OrbitConfig } from "../types";
import {
    createLowPolyPlanetGeometry,
    createMultiLODPlanetGeometries,
    updatePlanetGeometryColors,
} from "../utils/proceduralTerrain";
import {
    calculateProjectedDiameter,
    resolveLODLevel,
    LOD_LEVEL_HIGH,
    LOD_LEVEL_MEDIUM,
    LOD_LEVEL_SPARSE,
    LOD_LEVEL_POINT,
} from "../utils/lodUtils";
import PlanetaryRing from "./PlanetaryRing";
import { useTheme } from "../../theme";
import { resolveCelestialBodyColor } from "../utils/colorUtils";

interface LowPolyPlanetProps {
    body: OrbitConfig;
    isSun?: boolean;
    isMoon?: boolean;
    color?: string;
    onClick?: (e: ThreeEvent<MouseEvent>) => void;
    onPointerOver?: (e: ThreeEvent<PointerEvent>) => void;
    onPointerOut?: (e: ThreeEvent<PointerEvent>) => void;
}

const _scratchParentWorldQuat = new THREE.Quaternion();
const _scratchCamQuat = new THREE.Quaternion();
const _scratchWorldPos = new THREE.Vector3();

let _blueprintRadialTexture: THREE.CanvasTexture | null = null;
function getBlueprintRadialTexture(): THREE.CanvasTexture {
    if (!_blueprintRadialTexture && typeof document !== "undefined") {
        const canvas = document.createElement("canvas");
        canvas.width = 128;
        canvas.height = 128;
        const ctx = canvas.getContext("2d");
        if (ctx) {
            const gradient = ctx.createRadialGradient(64, 64, 0, 64, 64, 64);
            gradient.addColorStop(0, "rgba(255, 255, 255, 0.7)");
            gradient.addColorStop(0.35, "rgba(255, 255, 255, 0.35)");
            gradient.addColorStop(0.75, "rgba(255, 255, 255, 0.08)");
            gradient.addColorStop(1, "rgba(255, 255, 255, 0)");
            ctx.fillStyle = gradient;
            ctx.fillRect(0, 0, 128, 128);
        }
        _blueprintRadialTexture = new THREE.CanvasTexture(canvas);
    }
    return _blueprintRadialTexture as THREE.CanvasTexture;
}

function buildBasePlanetGeometry(
    radius: number,
    terrain: OrbitConfig["terrain"],
    isSun: boolean,
    isMoon: boolean,
    isLight: boolean
): THREE.BufferGeometry {
    const detail = !isLight
        ? (radius > 1.2 ? 3 : 2)
        : (isMoon ? 1 : 2);

    return createLowPolyPlanetGeometry({
        radius,
        terrain,
        isSun,
        subdivisionDetail: detail,
    });
}

function buildBaseMultiLODGeometries(
    radius: number,
    terrain: OrbitConfig["terrain"],
    isSun: boolean,
    isMoon: boolean,
    isLight: boolean
): ReturnType<typeof createMultiLODPlanetGeometries> | null {
    if (!isLight) return null;
    return createMultiLODPlanetGeometries(
        {
            radius,
            terrain,
            isSun,
        },
        isMoon
    );
}

export const LowPolyPlanet = memo(forwardRef<THREE.Mesh, LowPolyPlanetProps>(
    ({ body, isSun = false, isMoon = false, color, onClick, onPointerOver, onPointerOut }, ref) => {
        const { isLight } = useTheme();
        const effectiveColor = resolveCelestialBodyColor(body, color, "#5da9ff");
        const meshInternalRef = useRef<THREE.Mesh>(null);
        const groupRef = useRef<THREE.Group>(null);
        const billboardGroupRef = useRef<THREE.Group>(null);
        const currentLodRef = useRef<number>(LOD_LEVEL_HIGH);
        const frameCounterRef = useRef<number>(0);

        useImperativeHandle(ref, () => meshInternalRef.current as THREE.Mesh);

        const singleGeometry = useMemo(() => {
            if (isLight) return null;
            return buildBasePlanetGeometry(body.radius, body.terrain, isSun, isMoon, false);
        }, [isLight, body.radius, body.terrain, isSun, isMoon]);

        const multiLODGeometries = useMemo(() => {
            return buildBaseMultiLODGeometries(body.radius, body.terrain, isSun, isMoon, isLight);
        }, [body.radius, body.terrain, isSun, isMoon, isLight]);

        useEffect(() => {
            return () => {
                singleGeometry?.dispose();
                if (multiLODGeometries) {
                    multiLODGeometries.high.dispose();
                    multiLODGeometries.medium.dispose();
                    multiLODGeometries.sparse.dispose();
                    multiLODGeometries.simple.dispose();
                }
            };
        }, [singleGeometry, multiLODGeometries]);

        useEffect(() => {
            if (multiLODGeometries) {
                updatePlanetGeometryColors(multiLODGeometries.high, body.palette, effectiveColor, isSun);
                updatePlanetGeometryColors(multiLODGeometries.medium, body.palette, effectiveColor, isSun);
                updatePlanetGeometryColors(multiLODGeometries.sparse, body.palette, effectiveColor, isSun);
                updatePlanetGeometryColors(multiLODGeometries.simple, body.palette, effectiveColor, isSun);
            } else if (singleGeometry) {
                updatePlanetGeometryColors(singleGeometry, body.palette, effectiveColor, isSun);
            }
        }, [singleGeometry, multiLODGeometries, body.palette, effectiveColor, isSun]);

        const outerBorderColor = isSun ? (body.palette?.peak ?? "#fffbeb") : effectiveColor;

        const billboardGeometries = useMemo(() => {
            if (!isLight) return null;
            return {
                mask: new THREE.CircleGeometry(body.radius * 0.995, 48),
                glow: new THREE.CircleGeometry(body.radius * 1.02, 48),
                ring: new THREE.RingGeometry(body.radius * 1.015, body.radius * 1.025, 64),
            };
        }, [isLight, body.radius]);

        useEffect(() => {
            return () => {
                if (billboardGeometries) {
                    billboardGeometries.mask.dispose();
                    billboardGeometries.glow.dispose();
                    billboardGeometries.ring.dispose();
                }
            };
        }, [billboardGeometries]);

        useFrame((state) => {
            if (isLight && groupRef.current && multiLODGeometries) {
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
                        if (meshInternalRef.current) {
                            if (nextLod === LOD_LEVEL_POINT) {
                                meshInternalRef.current.visible = false;
                            } else {
                                meshInternalRef.current.visible = true;
                                let targetGeom = multiLODGeometries.simple;
                                if (nextLod === LOD_LEVEL_HIGH) targetGeom = multiLODGeometries.high;
                                else if (nextLod === LOD_LEVEL_MEDIUM) targetGeom = multiLODGeometries.medium;
                                else if (nextLod === LOD_LEVEL_SPARSE) targetGeom = multiLODGeometries.sparse;
                                meshInternalRef.current.geometry = targetGeom;
                            }
                        }
                    }
                }
            }

            if (billboardGroupRef.current && isLight && groupRef.current) {
                groupRef.current.getWorldQuaternion(_scratchParentWorldQuat);
                _scratchCamQuat.copy(state.camera.quaternion);
                billboardGroupRef.current.quaternion.copy(_scratchParentWorldQuat).invert().multiply(_scratchCamQuat);
            }
        });

        const glowMatRef = useRef<THREE.MeshBasicMaterial>(null);
        const ringMatRef = useRef<THREE.MeshBasicMaterial>(null);

        useEffect(() => {
            if (glowMatRef.current) {
                glowMatRef.current.color.set(effectiveColor);
            }
        }, [effectiveColor]);

        useEffect(() => {
            if (ringMatRef.current) {
                ringMatRef.current.color.set(outerBorderColor);
            }
        }, [outerBorderColor]);

        const radialTexture = isLight ? getBlueprintRadialTexture() : null;

        const initialGeometry = multiLODGeometries ? multiLODGeometries.high : (singleGeometry ?? undefined);

        return (
            <group ref={groupRef}>
                {isLight && billboardGeometries && radialTexture && (
                    <group
                        ref={billboardGroupRef}
                        renderOrder={1}
                        onClick={onClick}
                        onPointerOver={onPointerOver}
                        onPointerOut={onPointerOut}
                    >
                        <mesh geometry={billboardGeometries.mask} raycast={() => null}>
                            <meshBasicMaterial
                                color="#cad2dc"
                                side={THREE.DoubleSide}
                                depthWrite={true}
                            />
                        </mesh>

                        <mesh
                            position={[0, 0, 0.01]}
                            geometry={billboardGeometries.glow}
                            raycast={() => null}
                        >
                            <meshBasicMaterial
                                ref={glowMatRef}
                                map={radialTexture}
                                color={effectiveColor}
                                transparent
                                opacity={0.75}
                                side={THREE.DoubleSide}
                                depthWrite={false}
                            />
                        </mesh>

                        <mesh
                            position={[0, 0, 0.015]}
                            geometry={billboardGeometries.ring}
                            raycast={() => null}
                        >
                            <meshBasicMaterial
                                ref={ringMatRef}
                                color={outerBorderColor}
                                wireframe
                                side={THREE.DoubleSide}
                                depthWrite={false}
                            />
                        </mesh>
                    </group>
                )}

                <mesh
                    ref={meshInternalRef}
                    geometry={initialGeometry}
                    renderOrder={2}
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

                {body.ring && <PlanetaryRing ring={body.ring} />}
            </group>
        );
    }
));

LowPolyPlanet.displayName = "LowPolyPlanet";

export default LowPolyPlanet;
