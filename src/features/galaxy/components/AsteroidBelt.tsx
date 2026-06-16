import { useMemo, useEffect, useRef, useState } from "react";
import { useFrame } from "@react-three/fiber";
import * as THREE from "three";
import type { AsteroidBeltConfig } from "../types";

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

export function AsteroidBelt({ config, isEditorMode = false, isSelected = false, onSelect }: AsteroidBeltProps) {
    const groupRef = useRef<THREE.Group>(null);
    const meshRef = useRef<THREE.InstancedMesh>(null);
    const highlightMeshRef = useRef<THREE.Mesh>(null);
    const [isHovered, setIsHovered] = useState(false);

    const {
        enabled = true,
        innerRadius = 13.6,
        outerRadius = 16.2,
        count = 450,
        minSize = 0.05,
        maxSize = 0.16,
        orbitSpeed = 0.09,
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
        const colorA = new THREE.Color(color);
        const colorB = new THREE.Color(secondaryColor);
        const interpolatedColor = new THREE.Color();

        for (let i = 0; i < count; i++) {
            const r1 = pseudoRandom(baseSeed + i * 7.13);
            const r2 = pseudoRandom(baseSeed + i * 13.37);
            const r3 = pseudoRandom(baseSeed + i * 23.71);
            const r4 = pseudoRandom(baseSeed + i * 31.19);
            const r5 = pseudoRandom(baseSeed + i * 41.53);
            const r6 = pseudoRandom(baseSeed + i * 53.87);
            const r7 = pseudoRandom(baseSeed + i * 67.29);

            const radius = innerRadius + (outerRadius - innerRadius) * Math.sqrt(r1);
            const angle = r2 * Math.PI * 2;
            const y = (r3 - 0.5) * heightSpread * (1 - Math.abs(r1 - 0.5) * 0.5);

            const scaleVal = minSize + (maxSize - minSize) * Math.pow(r4, 1.8);
            const scaleX = scaleVal * (0.8 + r5 * 0.4);
            const scaleY = scaleVal * (0.7 + r6 * 0.6);
            const scaleZ = scaleVal * (0.8 + r7 * 0.4);

            const rotX = r3 * Math.PI * 2;
            const rotY = r4 * Math.PI * 2;
            const rotZ = r5 * Math.PI * 2;

            const tumbleSpeedX = (r1 - 0.5) * 1.5;
            const tumbleSpeedY = (r2 - 0.5) * 1.5;
            const tumbleSpeedZ = (r6 - 0.5) * 1.5;

            interpolatedColor.lerpColors(colorA, colorB, r7);

            data.push({
                radius,
                initialAngle: angle,
                y,
                scale: [scaleX, scaleY, scaleZ] as [number, number, number],
                rotation: [rotX, rotY, rotZ] as [number, number, number],
                tumble: [tumbleSpeedX, tumbleSpeedY, tumbleSpeedZ] as [number, number, number],
                color: interpolatedColor.clone(),
            });
        }
        return data;
    }, [count, innerRadius, outerRadius, minSize, maxSize, heightSpread, color, secondaryColor, seed]);

    const geometry = useMemo(() => {
        return new THREE.DodecahedronGeometry(1, 0);
    }, []);

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
    }, [asteroidData, enabled]);

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
                    mat.opacity = THREE.MathUtils.damp(mat.opacity, targetOpacity, 10, delta);
                    mat.visible = mat.opacity > 0.01;
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
                    key={`belt-${seed}-${count}-${enabled ? "on" : "off"}`}
                    ref={meshRef}
                    args={[geometry, undefined, count]}
                    raycast={() => null}
                >
                    <meshStandardMaterial
                        roughness={0.88}
                        metalness={0.12}
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
}

export default AsteroidBelt;
