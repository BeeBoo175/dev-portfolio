import { useRef, useEffect } from "react";
import { useFrame } from "@react-three/fiber";
import * as THREE from "three";
import type { OrbitConfig } from "../types";
import { ORBIT_LAYOUT } from "../data";
import { useGalaxyPlanets, useGalaxyDefaultPlanetId } from "../store";

export interface SpaceshipProps {
    focusId: string;
    bodyRefs: React.RefObject<Record<string, THREE.Group | null>>;
}

const SUN_SAFE_RADIUS = 8.5;
const HOVER_ALTITUDE = 0.20;

const TAKEOFF_PHASE_END = 0.22;
const LANDING_PHASE_START = 0.78;
const CRUISE_PHASE_RANGE = LANDING_PHASE_START - TAKEOFF_PHASE_END;

function calculateCruiseControlPoint(
    start: THREE.Vector3,
    dest: THREE.Vector3
): THREE.Vector3 {
    const chord = new THREE.Vector3().subVectors(dest, start);
    const chordLen = chord.length();
    const mid = new THREE.Vector3().addVectors(start, dest).multiplyScalar(0.5);

    let arcHeight = Math.max(3.0, chordLen * 0.22);
    const midDistanceToSun = Math.hypot(mid.x, mid.z);

    const chordDir = chord.clone().normalize();
    const toStart = start.clone().negate();
    const proj = THREE.MathUtils.clamp(toStart.dot(chordDir), 0, chordLen);
    const closestPoint = start.clone().add(chordDir.clone().multiplyScalar(proj));
    const closestDistToSun = Math.hypot(closestPoint.x, closestPoint.z);

    let pushOutward = new THREE.Vector3();
    if (closestDistToSun < SUN_SAFE_RADIUS || midDistanceToSun < SUN_SAFE_RADIUS) {
        arcHeight = Math.max(arcHeight, 4.5);
        if (midDistanceToSun > 0.5) {
            pushOutward
                .set(mid.x, 0, mid.z)
                .normalize()
                .multiplyScalar(SUN_SAFE_RADIUS - midDistanceToSun + 4.5);
        } else {
            const perp = new THREE.Vector3(-chord.z, 0, chord.x).normalize();
            pushOutward = perp.multiplyScalar(SUN_SAFE_RADIUS + 4.5);
        }
    } else {
        pushOutward.set(mid.x, 0, mid.z).normalize().multiplyScalar(2.0);
    }

    const lift = new THREE.Vector3(0, arcHeight, 0);
    return new THREE.Vector3().addVectors(mid, lift).add(pushOutward);
}

function computeLandedLocalRotation(normal: THREE.Vector3): THREE.Quaternion {
    const up = normal.clone().normalize();
    return new THREE.Quaternion().setFromUnitVectors(new THREE.Vector3(0, 1, 0), up);
}

function computeForwardRotation(
    forward: THREE.Vector3,
    preferredUp = new THREE.Vector3(0, 1, 0)
): THREE.Quaternion {
    const f = forward.clone().normalize();
    if (f.lengthSq() < 0.001) return new THREE.Quaternion();

    const initialUp = preferredUp.clone().normalize();
    const up =
        Math.abs(f.dot(initialUp)) > 0.92
            ? Math.abs(f.dot(new THREE.Vector3(0, 0, 1))) > 0.92
                ? new THREE.Vector3(1, 0, 0)
                : new THREE.Vector3(0, 0, 1)
            : initialUp;

    const right = new THREE.Vector3().crossVectors(up, f).normalize();
    const correctedUp = new THREE.Vector3().crossVectors(f, right).normalize();

    const matrix = new THREE.Matrix4().makeBasis(right, correctedUp, f);
    return new THREE.Quaternion().setFromRotationMatrix(matrix);
}

function getPlanetRadius(planets: OrbitConfig[], id: string): number {
    return (
        planets.find((p) => p.id === id)?.radius ??
        ORBIT_LAYOUT.find((p) => p.id === id)?.radius ??
        1.0
    );
}

function getSurfaceMesh(
    bodyRefs: React.RefObject<Record<string, THREE.Group | null>>,
    id: string
): THREE.Object3D | null {
    const group = bodyRefs.current?.[id];
    if (!group) return null;
    return (group.userData?.surfaceMesh as THREE.Object3D) ?? null;
}

export function Spaceship({ focusId, bodyRefs }: SpaceshipProps) {
    const groupRef = useRef<THREE.Group>(null);
    const planets = useGalaxyPlanets();
    const defaultPlanetId = useGalaxyDefaultPlanetId();

    const originPlanetId = useRef<string>(defaultPlanetId);
    const currentPlanetId = useRef<string>(defaultPlanetId);
    const targetPlanetId = useRef<string>(defaultPlanetId);
    const isFlying = useRef<boolean>(false);
    const isMidFlightRedirect = useRef<boolean>(false);
    const flightElapsed = useRef<number>(0);
    const flightDuration = useRef<number>(1.2);

    const flightStartPos = useRef(new THREE.Vector3());
    const midFlightStartPos = useRef(new THREE.Vector3());
    const midFlightStartQuat = useRef(new THREE.Quaternion());

    const originLocalPos = useRef(new THREE.Vector3(0, 1, 0));
    const originLocalQuat = useRef(new THREE.Quaternion());
    const targetLocalPos = useRef(new THREE.Vector3(0, 1, 0));
    const targetLocalQuat = useRef(new THREE.Quaternion());
    const landedLocalPos = useRef(new THREE.Vector3(0, 1, 0));
    const landedLocalQuat = useRef(new THREE.Quaternion());

    const isInitialized = useRef<boolean>(false);

    useEffect(() => {
        const activeTargetId = focusId === "home" ? defaultPlanetId : focusId;
        const targetPlanet =
            planets.find((p) => p.id === activeTargetId) ??
            ORBIT_LAYOUT.find((p) => p.id === activeTargetId);
        if (!targetPlanet) return;

        if (activeTargetId !== targetPlanetId.current) {
            const wasAlreadyFlying = isFlying.current;
            targetPlanetId.current = activeTargetId;

            const destSurface = getSurfaceMesh(bodyRefs, activeTargetId);
            if (destSurface && groupRef.current) {
                if (wasAlreadyFlying) {
                    isMidFlightRedirect.current = true;
                    midFlightStartPos.current.copy(groupRef.current.position);
                    midFlightStartQuat.current.copy(groupRef.current.quaternion);
                } else {
                    isMidFlightRedirect.current = false;
                    originPlanetId.current = currentPlanetId.current;
                    originLocalPos.current.copy(landedLocalPos.current);
                    originLocalQuat.current.copy(landedLocalQuat.current);
                    flightStartPos.current.copy(groupRef.current.position);
                }

                destSurface.updateWorldMatrix(true, false);
                const destCenter = new THREE.Vector3();
                destSurface.getWorldPosition(destCenter);

                const theta = Math.atan2(destCenter.x, destCenter.z);
                const cameraFacingDirWorld = new THREE.Vector3(
                    Math.sin(theta) * 0.85,
                    0.45,
                    Math.cos(theta) * 0.85
                ).normalize();

                const invDestMatrix = destSurface.matrixWorld.clone().invert();
                const localNormal = cameraFacingDirWorld
                    .clone()
                    .transformDirection(invDestMatrix)
                    .normalize();
                const radius = getPlanetRadius(planets, activeTargetId);

                targetLocalPos.current
                    .copy(localNormal)
                    .multiplyScalar(radius + HOVER_ALTITUDE);
                targetLocalQuat.current.copy(computeLandedLocalRotation(localNormal));

                const destInitialWorldPos = targetLocalPos.current
                    .clone()
                    .applyMatrix4(destSurface.matrixWorld);

                const startPoint = wasAlreadyFlying
                    ? midFlightStartPos.current
                    : flightStartPos.current;
                const dist = startPoint.distanceTo(destInitialWorldPos);

                flightDuration.current = THREE.MathUtils.clamp(
                    dist * 0.04 + (wasAlreadyFlying ? 0.5 : 0.75),
                    0.85,
                    1.75
                );
                flightElapsed.current = 0;
                isFlying.current = true;
            }
        }
    }, [focusId, defaultPlanetId, planets, bodyRefs]);

    const vtolLeftRef = useRef<THREE.Group>(null);
    const vtolRightRef = useRef<THREE.Group>(null);
    const beaconMeshRef = useRef<THREE.Mesh>(null);
    const beaconHaloRef = useRef<THREE.Mesh>(null);

    useFrame((state, delta) => {
        if (!groupRef.current) return;

        if (beaconMeshRef.current) {
            const isLit = Math.sin(state.clock.elapsedTime * 6) > 0;
            (beaconMeshRef.current.material as THREE.MeshBasicMaterial).color.set(
                isLit ? "#ff4d4d" : "#450a0a"
            );
            if (beaconHaloRef.current) {
                (beaconHaloRef.current.material as THREE.MeshBasicMaterial).opacity = isLit ? 0.35 : 0.0;
            }
        }

        if (vtolLeftRef.current && vtolRightRef.current) {
            const targetVtolAngle = isFlying.current ? Math.PI / 2 : 0;
            const currentRotX = vtolLeftRef.current.rotation.x;
            const nextRotX = THREE.MathUtils.damp(currentRotX, targetVtolAngle, 8, delta);
            vtolLeftRef.current.rotation.x = nextRotX;
            vtolRightRef.current.rotation.x = nextRotX;
        }

        if (!isInitialized.current) {
            const initialPlanetId = defaultPlanetId;
            const initialSurface = getSurfaceMesh(bodyRefs, initialPlanetId);
            if (initialSurface) {
                currentPlanetId.current = initialPlanetId;
                targetPlanetId.current = initialPlanetId;
                originPlanetId.current = initialPlanetId;

                initialSurface.updateWorldMatrix(true, false);
                const initialCenter = new THREE.Vector3();
                initialSurface.getWorldPosition(initialCenter);

                const theta = Math.atan2(initialCenter.x, initialCenter.z);
                const cameraFacingDirWorld = new THREE.Vector3(
                    Math.sin(theta) * 0.85,
                    0.45,
                    Math.cos(theta) * 0.85
                ).normalize();

                const invInitialMatrix = initialSurface.matrixWorld.clone().invert();
                const initialNormal = cameraFacingDirWorld
                    .transformDirection(invInitialMatrix)
                    .normalize();
                const radius = getPlanetRadius(planets, initialPlanetId);

                originLocalPos.current
                    .copy(initialNormal)
                    .multiplyScalar(radius + HOVER_ALTITUDE);
                originLocalQuat.current.copy(computeLandedLocalRotation(initialNormal));
                targetLocalPos.current.copy(originLocalPos.current);
                targetLocalQuat.current.copy(originLocalQuat.current);
                landedLocalPos.current.copy(originLocalPos.current);
                landedLocalQuat.current.copy(originLocalQuat.current);

                groupRef.current.position
                    .copy(originLocalPos.current)
                    .applyMatrix4(initialSurface.matrixWorld);
                const initQuat = new THREE.Quaternion();
                initialSurface.getWorldQuaternion(initQuat);
                groupRef.current.quaternion.multiplyQuaternions(
                    initQuat,
                    originLocalQuat.current
                );

                isInitialized.current = true;
            }
            return;
        }

        if (isFlying.current) {
            flightElapsed.current += delta;
            const p = Math.min(flightElapsed.current / flightDuration.current, 1.0);

            const destSurface = getSurfaceMesh(bodyRefs, targetPlanetId.current);
            if (!destSurface) return;

            const destRadius = getPlanetRadius(planets, targetPlanetId.current);
            const destLiftDist = THREE.MathUtils.clamp(
                destRadius * 0.8 + 0.8,
                1.4,
                2.4
            );

            const destNormal = targetLocalPos.current.clone().normalize();
            const destApexPos = destNormal
                .clone()
                .multiplyScalar(destRadius + HOVER_ALTITUDE + destLiftDist);
            const destSurfacePos = destNormal
                .clone()
                .multiplyScalar(destRadius + HOVER_ALTITUDE);

            destSurface.updateWorldMatrix(true, false);
            const destApexWorld = destApexPos
                .clone()
                .applyMatrix4(destSurface.matrixWorld);
            const destQuat = new THREE.Quaternion();
            destSurface.getWorldQuaternion(destQuat);
            const destLandedWorldQuat = new THREE.Quaternion().multiplyQuaternions(
                destQuat,
                targetLocalQuat.current
            );

            const newPos = new THREE.Vector3();
            const desiredQuat = new THREE.Quaternion();

            if (isMidFlightRedirect.current) {
                const startPt = midFlightStartPos.current;
                const cp = calculateCruiseControlPoint(startPt, destApexWorld);

                if (p < LANDING_PHASE_START) {
                    const u = p / LANDING_PHASE_START;
                    const s = u * u * (3 - 2 * u);

                    const oneMinusS = 1 - s;
                    const term1 = startPt.clone().multiplyScalar(oneMinusS * oneMinusS);
                    const term2 = cp.clone().multiplyScalar(2 * oneMinusS * s);
                    const term3 = destApexWorld.clone().multiplyScalar(s * s);

                    newPos.copy(term1).add(term2).add(term3);

                    const tangent = new THREE.Vector3()
                        .subVectors(cp, startPt)
                        .multiplyScalar(oneMinusS)
                        .add(
                            new THREE.Vector3()
                                .subVectors(destApexWorld, cp)
                                .multiplyScalar(s)
                        )
                        .normalize();

                    const cruiseQuat = computeForwardRotation(tangent);

                    if (u < 0.25) {
                        const blend = u / 0.25;
                        desiredQuat
                            .copy(midFlightStartQuat.current)
                            .slerp(cruiseQuat, blend * blend * (3 - 2 * blend));
                    } else if (u < 0.7) {
                        desiredQuat.copy(cruiseQuat);
                    } else {
                        const blend = (u - 0.7) / 0.3;
                        const blendEased = blend * blend * (3 - 2 * blend);
                        desiredQuat.copy(cruiseQuat).slerp(destLandedWorldQuat, blendEased);
                    }
                } else {
                    const subP = (p - LANDING_PHASE_START) / (1 - LANDING_PHASE_START);
                    const eased = subP * subP * (3 - 2 * subP);

                    const localPos = new THREE.Vector3().lerpVectors(
                        destApexPos,
                        destSurfacePos,
                        eased
                    );
                    newPos.copy(localPos).applyMatrix4(destSurface.matrixWorld);
                    desiredQuat.copy(destLandedWorldQuat);
                }
            } else {
                const originSurface = getSurfaceMesh(bodyRefs, originPlanetId.current);
                const originRadius = getPlanetRadius(planets, originPlanetId.current);
                const originLiftDist = THREE.MathUtils.clamp(
                    originRadius * 0.8 + 0.8,
                    1.4,
                    2.4
                );

                const originNormal = originLocalPos.current.clone().normalize();
                const originSurfacePos = originNormal
                    .clone()
                    .multiplyScalar(originRadius + HOVER_ALTITUDE);
                const originApexPos = originNormal
                    .clone()
                    .multiplyScalar(originRadius + HOVER_ALTITUDE + originLiftDist);

                const originApexWorld = new THREE.Vector3();
                const originLandedWorldQuat = new THREE.Quaternion();
                if (originSurface) {
                    originSurface.updateWorldMatrix(true, false);
                    originApexWorld.copy(originApexPos).applyMatrix4(originSurface.matrixWorld);
                    const originQuat = new THREE.Quaternion();
                    originSurface.getWorldQuaternion(originQuat);
                    originLandedWorldQuat.multiplyQuaternions(
                        originQuat,
                        originLocalQuat.current
                    );
                } else {
                    originApexWorld.copy(flightStartPos.current);
                }

                const cp = calculateCruiseControlPoint(originApexWorld, destApexWorld);
                const departureTangent = new THREE.Vector3()
                    .subVectors(cp, originApexWorld)
                    .normalize();
                const departureQuat = computeForwardRotation(departureTangent);

                if (p < TAKEOFF_PHASE_END) {
                    const subP = p / TAKEOFF_PHASE_END;
                    const eased = subP * subP * (3 - 2 * subP);

                    if (originSurface) {
                        const localPos = new THREE.Vector3().lerpVectors(
                            originSurfacePos,
                            originApexPos,
                            eased
                        );
                        newPos.copy(localPos).applyMatrix4(originSurface.matrixWorld);
                    } else {
                        newPos.lerpVectors(flightStartPos.current, originApexWorld, eased);
                    }

                    if (subP < 0.5) {
                        desiredQuat.copy(originLandedWorldQuat);
                    } else {
                        const turnBlend = (subP - 0.5) / 0.5;
                        const turnEased = turnBlend * turnBlend * (3 - 2 * turnBlend);
                        desiredQuat.copy(originLandedWorldQuat).slerp(departureQuat, turnEased);
                    }
                } else if (p > LANDING_PHASE_START) {
                    const subP = (p - LANDING_PHASE_START) / (1 - LANDING_PHASE_START);
                    const eased = subP * subP * (3 - 2 * subP);

                    const localPos = new THREE.Vector3().lerpVectors(
                        destApexPos,
                        destSurfacePos,
                        eased
                    );
                    newPos.copy(localPos).applyMatrix4(destSurface.matrixWorld);
                    desiredQuat.copy(destLandedWorldQuat);
                } else {
                    const u = (p - TAKEOFF_PHASE_END) / CRUISE_PHASE_RANGE;
                    const s = u * u * (3 - 2 * u);

                    const oneMinusS = 1 - s;
                    const term1 = originApexWorld.clone().multiplyScalar(oneMinusS * oneMinusS);
                    const term2 = cp.clone().multiplyScalar(2 * oneMinusS * s);
                    const term3 = destApexWorld.clone().multiplyScalar(s * s);

                    newPos.copy(term1).add(term2).add(term3);

                    const tangent = new THREE.Vector3()
                        .subVectors(cp, originApexWorld)
                        .multiplyScalar(oneMinusS)
                        .add(
                            new THREE.Vector3()
                                .subVectors(destApexWorld, cp)
                                .multiplyScalar(s)
                        )
                        .normalize();

                    const cruiseQuat = computeForwardRotation(tangent);

                    if (u < 0.7) {
                        desiredQuat.copy(cruiseQuat);
                    } else {
                        const blend = (u - 0.7) / 0.3;
                        const blendEased = blend * blend * (3 - 2 * blend);
                        desiredQuat.copy(cruiseQuat).slerp(destLandedWorldQuat, blendEased);
                    }
                }
            }

            groupRef.current.position.copy(newPos);
            groupRef.current.quaternion.copy(desiredQuat);

            if (p >= 1.0) {
                isFlying.current = false;
                isMidFlightRedirect.current = false;
                currentPlanetId.current = targetPlanetId.current;
                originPlanetId.current = targetPlanetId.current;
                originLocalPos.current.copy(targetLocalPos.current);
                originLocalQuat.current.copy(targetLocalQuat.current);
                landedLocalPos.current.copy(targetLocalPos.current);
                landedLocalQuat.current.copy(targetLocalQuat.current);
            }
        } else {
            const currentSurface = getSurfaceMesh(bodyRefs, currentPlanetId.current);
            if (currentSurface) {
                currentSurface.updateWorldMatrix(true, false);

                const currentRadius = getPlanetRadius(planets, currentPlanetId.current);
                landedLocalPos.current.setLength(currentRadius + HOVER_ALTITUDE);

                groupRef.current.position
                    .copy(landedLocalPos.current)
                    .applyMatrix4(currentSurface.matrixWorld);
                const currentPlanetQuat = new THREE.Quaternion();
                currentSurface.getWorldQuaternion(currentPlanetQuat);
                groupRef.current.quaternion.multiplyQuaternions(
                    currentPlanetQuat,
                    landedLocalQuat.current
                );
            }
        }
    });

    return (
        <group ref={groupRef}>
            <mesh
                castShadow
                receiveShadow
                position={[0, 0, 0]}
                rotation={[Math.PI / 2, 0, 0]}
            >
                <cylinderGeometry args={[0.13, 0.13, 0.32, 24]} />
                <meshStandardMaterial
                    color="#b45309"
                    roughness={0.75}
                    metalness={0.15}
                />
            </mesh>

            <mesh position={[0, 0, 0.16]} rotation={[Math.PI / 2, 0, 0]}>
                <sphereGeometry args={[0.13, 20, 16, 0, Math.PI * 2, 0, Math.PI / 2]} />
                <meshPhysicalMaterial
                    color="#67e8f9"
                    emissive="#0284c7"
                    emissiveIntensity={0.22}
                    roughness={0.15}
                    metalness={0.05}
                    transmission={0.65}
                    thickness={0.25}
                    ior={1.4}
                />
            </mesh>

            <mesh position={[0, 0, 0.16]}>
                <torusGeometry args={[0.13, 0.007, 8, 24]} />
                <meshStandardMaterial
                    color="#334155"
                    roughness={0.4}
                    metalness={0.85}
                />
            </mesh>

            <group position={[-0.08, -0.11, 0.07]}>
                <mesh position={[-0.03, -0.04, 0.02]} rotation={[-0.35, 0, -0.55]}>
                    <cylinderGeometry args={[0.007, 0.007, 0.11, 6]} />
                    <meshStandardMaterial color="#475569" roughness={0.4} metalness={0.8} />
                </mesh>
                <mesh position={[-0.055, -0.08, 0.035]}>
                    <boxGeometry args={[0.045, 0.008, 0.045]} />
                    <meshStandardMaterial color="#1e293b" roughness={0.6} metalness={0.9} />
                </mesh>
            </group>

            <group position={[0.08, -0.11, 0.07]}>
                <mesh position={[0.03, -0.04, 0.02]} rotation={[-0.35, 0, 0.55]}>
                    <cylinderGeometry args={[0.007, 0.007, 0.11, 6]} />
                    <meshStandardMaterial color="#475569" roughness={0.4} metalness={0.8} />
                </mesh>
                <mesh position={[0.055, -0.08, 0.035]}>
                    <boxGeometry args={[0.045, 0.008, 0.045]} />
                    <meshStandardMaterial color="#1e293b" roughness={0.6} metalness={0.9} />
                </mesh>
            </group>

            <group position={[0, -0.11, -0.08]}>
                <mesh position={[0, -0.04, -0.03]} rotation={[0.6, 0, 0]}>
                    <cylinderGeometry args={[0.007, 0.007, 0.11, 6]} />
                    <meshStandardMaterial color="#475569" roughness={0.4} metalness={0.8} />
                </mesh>
                <mesh position={[0, -0.08, -0.055]}>
                    <boxGeometry args={[0.045, 0.008, 0.045]} />
                    <meshStandardMaterial color="#1e293b" roughness={0.6} metalness={0.9} />
                </mesh>
            </group>

            <group position={[0, 0.13, -0.02]}>
                <mesh position={[0, 0.02, 0]}>
                    <cylinderGeometry args={[0.02, 0.03, 0.04, 8]} />
                    <meshStandardMaterial color="#475569" roughness={0.5} metalness={0.8} />
                </mesh>
                <mesh position={[0, 0.07, 0]} rotation={[0.4, 0, 0]}>
                    <cylinderGeometry args={[0.08, 0.015, 0.03, 12, 1, true]} />
                    <meshStandardMaterial color="#94a3b8" roughness={0.3} metalness={0.9} side={THREE.DoubleSide} />
                </mesh>
                <mesh position={[0, 0.07, 0]} rotation={[0.4, 0, 0]}>
                    <sphereGeometry args={[0.02, 8, 8]} />
                    <meshStandardMaterial color="#e2e8f0" roughness={0.4} metalness={0.7} />
                </mesh>
                <mesh position={[0, 0.09, 0.01]} rotation={[0.4, 0, 0]}>
                    <cylinderGeometry args={[0.004, 0.004, 0.05, 4]} />
                    <meshStandardMaterial color="#f59e0b" roughness={0.3} metalness={0.9} />
                </mesh>

                <mesh ref={beaconMeshRef} position={[0, 0.12, 0.02]}>
                    <sphereGeometry args={[0.007, 8, 8]} />
                    <meshBasicMaterial color="#ff4d4d" />
                </mesh>
                <mesh ref={beaconHaloRef} position={[0, 0.12, 0.02]}>
                    <sphereGeometry args={[0.015, 12, 12]} />
                    <meshBasicMaterial
                        color="#ff3333"
                        transparent
                        opacity={0.35}
                        depthWrite={false}
                    />
                </mesh>
            </group>

            <mesh position={[0, 0, 0]}>
                <boxGeometry args={[0.52, 0.028, 0.09]} />
                <meshStandardMaterial
                    color="#1e293b"
                    roughness={0.6}
                    metalness={0.85}
                />
            </mesh>

            <group ref={vtolLeftRef} position={[-0.26, 0, 0]}>
                <mesh>
                    <cylinderGeometry args={[0.055, 0.075, 0.18, 16]} />
                    <meshStandardMaterial
                        color="#475569"
                        roughness={0.5}
                        metalness={0.8}
                    />
                </mesh>
                <mesh position={[0, 0, 0]}>
                    <torusGeometry args={[0.06, 0.01, 6, 16]} />
                    <meshStandardMaterial
                        color="#f59e0b"
                        roughness={0.4}
                        metalness={0.7}
                    />
                </mesh>
                <mesh position={[0, -0.09, 0]}>
                    <sphereGeometry args={[0.038, 10, 10]} />
                    <meshBasicMaterial color="#38bdf8" />
                </mesh>
                <pointLight
                    position={[0, -0.12, 0]}
                    color="#38bdf8"
                    intensity={0.4}
                    distance={0.8}
                    decay={2}
                />
            </group>

            <group ref={vtolRightRef} position={[0.26, 0, 0]}>
                <mesh>
                    <cylinderGeometry args={[0.055, 0.075, 0.18, 16]} />
                    <meshStandardMaterial
                        color="#475569"
                        roughness={0.5}
                        metalness={0.8}
                    />
                </mesh>
                <mesh position={[0, 0, 0]}>
                    <torusGeometry args={[0.06, 0.01, 6, 16]} />
                    <meshStandardMaterial
                        color="#f59e0b"
                        roughness={0.4}
                        metalness={0.7}
                    />
                </mesh>
                <mesh position={[0, -0.09, 0]}>
                    <sphereGeometry args={[0.038, 10, 10]} />
                    <meshBasicMaterial color="#38bdf8" />
                </mesh>
                <pointLight
                    position={[0, -0.12, 0]}
                    color="#38bdf8"
                    intensity={0.4}
                    distance={0.8}
                    decay={2}
                />
            </group>

            <mesh position={[0, 0, -0.17]} rotation={[Math.PI / 2, 0, 0]}>
                <cylinderGeometry args={[0.065, 0.08, 0.08, 12]} />
                <meshStandardMaterial
                    color="#334155"
                    roughness={0.5}
                    metalness={0.9}
                />
            </mesh>
            <mesh position={[0, 0, -0.22]}>
                <sphereGeometry args={[0.045, 10, 10]} />
                <meshBasicMaterial color="#38bdf8" />
            </mesh>
            <pointLight
                position={[0, 0, -0.26]}
                color="#38bdf8"
                intensity={0.5}
                distance={0.9}
                decay={2}
            />
        </group>
    );
}

export default Spaceship;
