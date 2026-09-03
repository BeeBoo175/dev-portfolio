import { useMemo, useEffect, useRef, useState, memo } from "react";
import { useFrame } from "@react-three/fiber";
import * as THREE from "three";
import type { AsteroidBeltConfig } from "../types";
import { useTheme } from "../../theme";
import { getEffectiveAccentColor } from "../utils/colorUtils";

export interface AsteroidBeltProps {
    config: AsteroidBeltConfig;
    isEditorMode?: boolean;
    isSelected?: boolean;
    onSelect?: (id: string) => void;
}

function pseudoRandom(seed: number) {
    const x = Math.sin(seed) * 10000;
    return x - Math.floor(x);
}

export const AsteroidBelt = memo(function AsteroidBelt({ config, isEditorMode = false, isSelected = false, onSelect }: AsteroidBeltProps) {
    const { isLight } = useTheme();
    const groupRef = useRef<THREE.Group>(null);
    const meshRef = useRef<THREE.InstancedMesh>(null);
    const highlightMeshRef = useRef<THREE.Mesh>(null);
    const [isHovered, setIsHovered] = useState(false);

    const {
        enabled = true,
        innerRadius = 14.8,
        outerRadius = 17.3,
        count = 450,
        minSize = 0.05,
        maxSize = 0.16,
        orbitSpeed = 0.045,
        heightSpread = 0.6,
        inclination = 0.035,
        ascendingNode = 0,
        argument = 0,
        color = "#9ca3af",
        secondaryColor = "#57534e",
        seed = 101,
    } = config;

    const asteroidData = useMemo(() => {
        const data = [];
        const baseSeed = seed * 19.37;
        const colA = isLight ? getEffectiveAccentColor(color, true) : color;
        const colB = isLight ? getEffectiveAccentColor(secondaryColor, true) : secondaryColor;
        const colorA = new THREE.Color(colA);
        const colorB = new THREE.Color(colB);
        const interpolatedColor = new THREE.Color();

        for (let i = 0; i < count; i++) {
            const s1 = baseSeed + i * 7.13;
            const s2 = baseSeed + i * 13.37;
            const s3 = baseSeed + i * 23.91;
            const s4 = baseSeed + i * 37.77;
            const s5 = baseSeed + i * 49.19;

            const u = pseudoRandom(s1);
            const radius = Math.sqrt(
                u * (outerRadius * outerRadius - innerRadius * innerRadius) + innerRadius * innerRadius
            );

            const initialAngle = pseudoRandom(s2) * Math.PI * 2;
            const heightGaussian = (pseudoRandom(s3) + pseudoRandom(s3 + 1) - 1.0);
            const y = heightGaussian * heightSpread * 0.5;

            const sizeT = pseudoRandom(s4);
            const scaleBase = minSize + Math.pow(sizeT, 2.2) * (maxSize - minSize);
            const scaleX = scaleBase * (0.8 + pseudoRandom(s5) * 0.4);
            const scaleY = scaleBase * (0.8 + pseudoRandom(s5 + 1) * 0.4);
            const scaleZ = scaleBase * (0.8 + pseudoRandom(s5 + 2) * 0.4);

            const colorT = pseudoRandom(s5 + 3);
            interpolatedColor.copy(colorA).lerp(colorB, colorT);

            data.push({
                radius,
                initialAngle,
                y,
                scale: [scaleX, scaleY, scaleZ] as [number, number, number],
                rotation: [
                    pseudoRandom(s5 + 4) * Math.PI * 2,
                    pseudoRandom(s5 + 5) * Math.PI * 2,
                    pseudoRandom(s5 + 6) * Math.PI * 2,
                ] as [number, number, number],
                color: interpolatedColor.clone(),
            });
        }
        return data;
    }, [count, innerRadius, outerRadius, minSize, maxSize, heightSpread, color, secondaryColor, seed, isLight]);

    const geometry = useMemo(() => {
        const geom = new THREE.DodecahedronGeometry(1, 0);
        geom.boundingSphere = new THREE.Sphere(
            new THREE.Vector3(0, 0, 0),
            outerRadius + maxSize + heightSpread
        );
        return geom;
    }, [outerRadius, maxSize, heightSpread]);

    const hitGeometry = useMemo(() => {
        if (!isEditorMode) return null;
        return new THREE.RingGeometry(Math.max(0.1, innerRadius - 0.4), outerRadius + 0.4, 64);
    }, [innerRadius, isEditorMode, outerRadius]);

    useEffect(() => {
        const mesh = meshRef.current;
        if (!mesh || !enabled) return;

        const dummy = new THREE.Object3D();

        asteroidData.forEach((item, index) => {
            const x = Math.cos(item.initialAngle) * item.radius;
            const z = Math.sin(item.initialAngle) * item.radius;

            dummy.position.set(x, item.y, z);
            dummy.rotation.set(item.rotation[0], item.rotation[1], item.rotation[2]);
            dummy.scale.set(item.scale[0], item.scale[1], item.scale[2]);
            dummy.updateMatrix();

            mesh.setMatrixAt(index, dummy.matrix);
            mesh.setColorAt(index, item.color);
        });

        mesh.instanceMatrix.needsUpdate = true;
        if (mesh.instanceColor) mesh.instanceColor.needsUpdate = true;
    }, [asteroidData, enabled, geometry]);

    const innerBoundaryGeom = useMemo(() => {
        if (!isEditorMode) return null;
        const points: THREE.Vector3[] = [];
        const segments = 128;
        for (let i = 0; i <= segments; i++) {
            const theta = (i / segments) * Math.PI * 2;
            points.push(new THREE.Vector3(Math.cos(theta) * innerRadius, 0, Math.sin(theta) * innerRadius));
        }
        return new THREE.BufferGeometry().setFromPoints(points);
    }, [innerRadius, isEditorMode]);

    const outerBoundaryGeom = useMemo(() => {
        if (!isEditorMode) return null;
        const points: THREE.Vector3[] = [];
        const segments = 128;
        for (let i = 0; i <= segments; i++) {
            const theta = (i / segments) * Math.PI * 2;
            points.push(new THREE.Vector3(Math.cos(theta) * outerRadius, 0, Math.sin(theta) * outerRadius));
        }
        return new THREE.BufferGeometry().setFromPoints(points);
    }, [outerRadius, isEditorMode]);

    useEffect(() => {
        return () => {
            geometry.dispose();
            hitGeometry?.dispose();
            innerBoundaryGeom?.dispose();
            outerBoundaryGeom?.dispose();
        };
    }, [geometry, hitGeometry, innerBoundaryGeom, outerBoundaryGeom]);

    useFrame((state, delta) => {
        if (groupRef.current) {
            groupRef.current.rotation.y += orbitSpeed * delta;
        }

        if (highlightMeshRef.current && isEditorMode) {
            const targetOpacity = isSelected ? 0.8 : isHovered ? 0.45 : 0;
            highlightMeshRef.current.children.forEach((child) => {
                const line = child as THREE.Line;
                if (line.material) {
                    const mat = line.material as THREE.LineBasicMaterial;
                    mat.opacity = THREE.MathUtils.damp(mat.opacity, targetOpacity, 8, delta);
                    line.visible = mat.opacity > 0.01;
                }
            });

            if (isSelected) {
                const pulse = 1 + Math.sin(state.clock.getElapsedTime() * 3) * 0.005;
                highlightMeshRef.current.scale.set(pulse, 1, pulse);
            } else {
                highlightMeshRef.current.scale.set(1, 1, 1);
            }
        }
    });

    if (!enabled || count <= 0) return null;

    return (
        <group rotation={[inclination, ascendingNode, argument]}>
            <group ref={groupRef}>
                <instancedMesh
                    key={`belt-${seed}-${count}-${enabled ? "on" : "off"}-${isLight ? "light" : "dark"}`}
                    ref={meshRef}
                    args={[geometry, undefined, count]}
                    raycast={() => null}
                >
                    <meshStandardMaterial
                        roughness={isLight ? 0.6 : 0.88}
                        metalness={isLight ? 0.25 : 0.12}
                        wireframe={isLight}
                        flatShading
                    />
                </instancedMesh>

                {isEditorMode && hitGeometry && innerBoundaryGeom && outerBoundaryGeom && (
                    <>
                        <group ref={highlightMeshRef}>
                            <lineLoop geometry={innerBoundaryGeom}>
                                <lineBasicMaterial
                                    color="#38bdf8"
                                    transparent
                                    opacity={0}
                                    depthWrite={false}
                                />
                            </lineLoop>

                            <lineLoop geometry={outerBoundaryGeom}>
                                <lineBasicMaterial
                                    color="#38bdf8"
                                    transparent
                                    opacity={0}
                                    depthWrite={false}
                                />
                            </lineLoop>
                        </group>

                        <mesh
                            geometry={hitGeometry}
                            rotation={[-Math.PI / 2, 0, 0]}
                            onClick={(e) => {
                                e.stopPropagation();
                                onSelect?.("asteroid-belt");
                            }}
                            onPointerOver={() => {
                                setIsHovered(true);
                                document.body.style.cursor = "pointer";
                            }}
                            onPointerOut={() => {
                                setIsHovered(false);
                                document.body.style.cursor = "default";
                            }}
                        >
                            <meshBasicMaterial
                                visible={false}
                                side={THREE.DoubleSide}
                            />
                        </mesh>
                    </>
                )}
            </group>
        </group>
    );
});

AsteroidBelt.displayName = "AsteroidBelt";

export default AsteroidBelt;
