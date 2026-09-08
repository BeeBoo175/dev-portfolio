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
    isMoon: boolean
): THREE.BufferGeometry {
    const detail = radius > 1.2 ? 3 : 2;

    return createLowPolyPlanetGeometry({
        radius,
        terrain,
        isSun,
        subdivisionDetail: isMoon ? 1 : detail,
    });
}

function buildBaseMultiLODGeometries(
    radius: number,
    terrain: OrbitConfig["terrain"],
    isSun: boolean,
    isMoon: boolean
): ReturnType<typeof createMultiLODPlanetGeometries> {
    return createMultiLODPlanetGeometries(
        {
            radius,
            terrain,
            isSun,
        },
        isMoon
    );
}

function getTargetLODGeometry(
    geometries: ReturnType<typeof createMultiLODPlanetGeometries> | null,
    lodLevel: number
): THREE.BufferGeometry | null {
    if (!geometries || lodLevel === LOD_LEVEL_POINT) return null;
    if (lodLevel === LOD_LEVEL_HIGH) return geometries.high;
    if (lodLevel === LOD_LEVEL_MEDIUM) return geometries.medium;
    if (lodLevel === LOD_LEVEL_SPARSE) return geometries.sparse;
    return geometries.simple;
}

export const LowPolyPlanet = memo(forwardRef<THREE.Mesh, LowPolyPlanetProps>(
    ({ body, isSun = false, isMoon = false, color, onClick, onPointerOver, onPointerOut }, ref) => {
        const { isLight } = useTheme();
        const effectiveColor = resolveCelestialBodyColor(body, color, "#5da9ff");
        const meshInternalRef = useRef<THREE.Mesh>(null);
        const groupRef = useRef<THREE.Group>(null);
        const billboardGroupRef = useRef<THREE.Group>(null);
        const currentLodRef = useRef<number>(-1);
        const frameCounterRef = useRef<number>(0);
        const prevGeometriesRef = useRef<ReturnType<typeof createMultiLODPlanetGeometries> | null>(null);

        useImperativeHandle(ref, () => meshInternalRef.current as THREE.Mesh);

        const singleGeometry = useMemo(() => {
            return buildBasePlanetGeometry(body.radius, body.terrain, isSun, isMoon);
        }, [body.radius, body.terrain, isSun, isMoon]);

        const multiLODGeometries = useMemo(() => {
            return buildBaseMultiLODGeometries(body.radius, body.terrain, isSun, isMoon);
        }, [body.radius, body.terrain, isSun, isMoon]);

        useEffect(() => {
            return () => {
                singleGeometry.dispose();
                const toDispose = new Set<THREE.BufferGeometry>([
                    multiLODGeometries.high,
                    multiLODGeometries.medium,
                    multiLODGeometries.sparse,
                    multiLODGeometries.simple,
                ]);
                toDispose.forEach((g) => g.dispose());
            };
        }, [singleGeometry, multiLODGeometries]);

        useEffect(() => {
            const toUpdate = new Set<THREE.BufferGeometry>([
                multiLODGeometries.high,
                multiLODGeometries.medium,
                multiLODGeometries.sparse,
                multiLODGeometries.simple,
                singleGeometry,
            ]);
            toUpdate.forEach((g) => updatePlanetGeometryColors(g, body.palette, effectiveColor, isSun));
        }, [singleGeometry, multiLODGeometries, body.palette, effectiveColor, isSun]);

        const outerBorderColor = isSun ? (body.palette?.peak ?? "#fffbeb") : effectiveColor;

        const billboardGeometries = useMemo(() => {
            return {
                mask: new THREE.CircleGeometry(body.radius * 0.995, 48),
                glow: new THREE.CircleGeometry(body.radius * 1.02, 48),
                ring: new THREE.RingGeometry(body.radius * 1.015, body.radius * 1.025, 64),
            };
        }, [body.radius]);

        useEffect(() => {
            return () => {
                billboardGeometries.mask.dispose();
                billboardGeometries.glow.dispose();
                billboardGeometries.ring.dispose();
            };
        }, [billboardGeometries]);

        const solidMaterial = useMemo(() => {
            if (isSun) {
                return new THREE.MeshBasicMaterial({ vertexColors: true });
            }
            return new THREE.MeshStandardMaterial({
                vertexColors: true,
                flatShading: true,
                roughness: 0.7,
                metalness: 0.1,
            });
        }, [isSun]);

        const wireframeMaterial = useMemo(() => {
            return new THREE.MeshBasicMaterial({ vertexColors: true, wireframe: true });
        }, []);

        useEffect(() => {
            return () => {
                solidMaterial.dispose();
                wireframeMaterial.dispose();
            };
        }, [solidMaterial, wireframeMaterial]);

        useEffect(() => {
            if (!isLight) {
                currentLodRef.current = -1;
                prevGeometriesRef.current = null;
                if (meshInternalRef.current) {
                    meshInternalRef.current.geometry = singleGeometry;
                    meshInternalRef.current.material = solidMaterial;
                    meshInternalRef.current.visible = true;
                }
            } else {
                currentLodRef.current = -1;
                prevGeometriesRef.current = null;
                if (meshInternalRef.current) {
                    meshInternalRef.current.material = wireframeMaterial;
                }
            }
        }, [isLight, singleGeometry, solidMaterial, wireframeMaterial]);

        useFrame((state) => {
            if (isLight && groupRef.current && meshInternalRef.current) {
                const geomSetChanged = prevGeometriesRef.current !== multiLODGeometries;
                if (geomSetChanged) {
                    prevGeometriesRef.current = multiLODGeometries;
                }

                frameCounterRef.current += 1;
                const isUninitialized = currentLodRef.current === -1;
                if (isUninitialized || geomSetChanged || frameCounterRef.current % 3 === 0) {
                    groupRef.current.getWorldPosition(_scratchWorldPos);
                    const screenHeight = state.size.height || 1080;
                    const diameterPx = calculateProjectedDiameter(
                        body.radius,
                        _scratchWorldPos,
                        state.camera,
                        screenHeight
                    );

                    const nextLod = resolveLODLevel(diameterPx, currentLodRef.current, isMoon);
                    const targetGeom = getTargetLODGeometry(multiLODGeometries, nextLod);
                    const geomMismatch = targetGeom !== null && meshInternalRef.current.geometry !== targetGeom;

                    if (isUninitialized || nextLod !== currentLodRef.current || geomMismatch) {
                        currentLodRef.current = nextLod;
                        if (nextLod === LOD_LEVEL_POINT) {
                            meshInternalRef.current.visible = false;
                        } else {
                            meshInternalRef.current.visible = true;
                            if (targetGeom && meshInternalRef.current.geometry !== targetGeom) {
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

        const initialGeometry = isLight ? multiLODGeometries.high : singleGeometry;

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
                    material={isLight ? wireframeMaterial : solidMaterial}
                    renderOrder={2}
                    onClick={onClick}
                    onPointerOver={onPointerOver}
                    onPointerOut={onPointerOut}
                />

                {body.ring && <PlanetaryRing ring={body.ring} />}
            </group>
        );
    }
));

LowPolyPlanet.displayName = "LowPolyPlanet";

export default LowPolyPlanet;
