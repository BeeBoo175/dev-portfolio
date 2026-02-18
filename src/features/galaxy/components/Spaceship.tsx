import { useRef, useEffect } from "react";
import { useFrame } from "@react-three/fiber";
import * as THREE from "three";
import { ORBIT_LAYOUT } from "../data";
import { useGalaxyPlanets } from "../store";

export interface SpaceshipProps {
    focusId: string;
    bodyRefs: React.RefObject<Record<string, THREE.Group | null>>;
}

const SUN_SAFE_RADIUS = 7.5;
const HOVER_ALTITUDE = 0.20;
const DEFAULT_PLANET_ID = "about";

function calculateControlPoint(
    start: THREE.Vector3,
    dest: THREE.Vector3,
    initialForward?: THREE.Vector3
): THREE.Vector3 {
    const chord = new THREE.Vector3().subVectors(dest, start);
    const chordLen = chord.length();
    const mid = new THREE.Vector3().addVectors(start, dest).multiplyScalar(0.5);

    const arcHeight = Math.max(2.0, chordLen * 0.18);
    const lift = new THREE.Vector3(0, arcHeight, 0);
    const midDistanceToSun = Math.hypot(mid.x, mid.z);

    let pushOutward = new THREE.Vector3();
    if (midDistanceToSun < SUN_SAFE_RADIUS) {
        if (midDistanceToSun > 0.1) {
            pushOutward.set(mid.x, 0, mid.z).normalize().multiplyScalar(SUN_SAFE_RADIUS - midDistanceToSun + 2.5);
        } else {
            const perp = new THREE.Vector3(-chord.z, 0, chord.x).normalize();
            pushOutward = perp.multiplyScalar(SUN_SAFE_RADIUS + 2.0);
        }
    } else {
        pushOutward.set(mid.x, 0, mid.z).normalize().multiplyScalar(2.0);
    }

    const controlPoint = new THREE.Vector3().addVectors(mid, lift).add(pushOutward);

    if (initialForward && initialForward.lengthSq() > 0.01) {
        const forwardBias = initialForward.clone().normalize().multiplyScalar(Math.min(chordLen * 0.4, 4.0));
        controlPoint.add(forwardBias.multiplyScalar(0.5));
    }

    return controlPoint;
}

function computeLandedLocalRotation(normal: THREE.Vector3): THREE.Quaternion {
    const up = normal.clone().normalize();
    return new THREE.Quaternion().setFromUnitVectors(new THREE.Vector3(0, 1, 0), up);
}

export function Spaceship({ focusId, bodyRefs }: SpaceshipProps) {
    const groupRef = useRef<THREE.Group>(null);
    const planets = useGalaxyPlanets();

    const currentPlanetId = useRef<string>(DEFAULT_PLANET_ID);
    const targetPlanetId = useRef<string>(DEFAULT_PLANET_ID);
    const isFlying = useRef<boolean>(false);
    const flightElapsed = useRef<number>(0);
    const flightDuration = useRef<number>(1.5);

    const flightStartPos = useRef(new THREE.Vector3());
    const flightControlPoint = useRef(new THREE.Vector3());
    const lastShipPos = useRef(new THREE.Vector3());
    const currentVelocity = useRef(new THREE.Vector3(0, 0, 1));
    const flightLookQuat = useRef(new THREE.Quaternion());
    const lookMatrix = useRef(new THREE.Matrix4());
    const tempVecA = useRef(new THREE.Vector3());
    const tempVecB = useRef(new THREE.Vector3());
    const destInstantWorldPos = useRef(new THREE.Vector3());
    const destPlanetWorldQuat = useRef(new THREE.Quaternion());
    const destLandedWorldQuat = useRef(new THREE.Quaternion());

    const landedLocalPos = useRef(new THREE.Vector3(0, 1, 0));
    const landedLocalQuat = useRef(new THREE.Quaternion());
    const targetLocalPos = useRef(new THREE.Vector3(0, 1, 0));
    const targetLocalQuat = useRef(new THREE.Quaternion());

    const isInitialized = useRef<boolean>(false);

    const getPlanetRadius = (id: string) => {
        return planets.find((p) => p.id === id)?.radius ?? ORBIT_LAYOUT.find((p) => p.id === id)?.radius ?? 1.0;
    };

    const getSurfaceMesh = (id: string): THREE.Object3D | null => {
        const group = bodyRefs.current?.[id];
        if (!group) return null;
        return (group.userData?.surfaceMesh as THREE.Object3D) ?? group;
    };

    useEffect(() => {
        if (focusId === "home") return;
        const targetPlanet = planets.find((p) => p.id === focusId) ?? ORBIT_LAYOUT.find((p) => p.id === focusId);
        if (!targetPlanet) return;

        if (focusId !== targetPlanetId.current) {
            targetPlanetId.current = focusId;

            const destSurface = getSurfaceMesh(focusId);
            if (destSurface && groupRef.current) {
                flightStartPos.current.copy(groupRef.current.position);

                destSurface.updateWorldMatrix(true, false);
                const destCenter = new THREE.Vector3();
                destSurface.getWorldPosition(destCenter);

                // Compute camera-facing direction so the landing spot is visible to the user
                const theta = Math.atan2(destCenter.x, destCenter.z);
                const cameraFacingDirWorld = new THREE.Vector3(
                    Math.sin(theta) * 0.85,
                    0.45,
                    Math.cos(theta) * 0.85
                ).normalize();

                const invDestMatrix = destSurface.matrixWorld.clone().invert();
                const localNormal = cameraFacingDirWorld.clone().transformDirection(invDestMatrix).normalize();
                const radius = getPlanetRadius(focusId);

                targetLocalPos.current.copy(localNormal).multiplyScalar(radius + HOVER_ALTITUDE);
                targetLocalQuat.current.copy(computeLandedLocalRotation(localNormal));

                destInstantWorldPos.current.copy(targetLocalPos.current).applyMatrix4(destSurface.matrixWorld);

                flightControlPoint.current = calculateControlPoint(
                    flightStartPos.current,
                    destInstantWorldPos.current,
                    currentVelocity.current
                );

                const dist = flightStartPos.current.distanceTo(destInstantWorldPos.current);
                flightDuration.current = THREE.MathUtils.clamp(dist * 0.09 + 0.8, 1.0, 2.2);
                flightElapsed.current = 0;
                isFlying.current = true;
            }
        }
    }, [focusId, planets, bodyRefs]);

    useFrame((_, delta) => {
        if (!groupRef.current) return;

        if (!isInitialized.current) {
            const initialSurface = getSurfaceMesh(DEFAULT_PLANET_ID);
            if (initialSurface) {
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
                const initialNormal = cameraFacingDirWorld.transformDirection(invInitialMatrix).normalize();
                const radius = getPlanetRadius(DEFAULT_PLANET_ID);

                landedLocalPos.current.copy(initialNormal).multiplyScalar(radius + HOVER_ALTITUDE);
                landedLocalQuat.current.copy(computeLandedLocalRotation(initialNormal));

                groupRef.current.position.copy(landedLocalPos.current).applyMatrix4(initialSurface.matrixWorld);
                initialSurface.getWorldQuaternion(destPlanetWorldQuat.current);
                groupRef.current.quaternion.multiplyQuaternions(destPlanetWorldQuat.current, landedLocalQuat.current);

                lastShipPos.current.copy(groupRef.current.position);
                isInitialized.current = true;
            }
            return;
        }

        if (isFlying.current) {
            flightElapsed.current += delta;
            const rawProgress = Math.min(flightElapsed.current / flightDuration.current, 1.0);

            const t = rawProgress < 0.5
                ? 4 * rawProgress * rawProgress * rawProgress
                : 1 - Math.pow(-2 * rawProgress + 2, 3) / 2;

            const destSurface = getSurfaceMesh(targetPlanetId.current);
            if (destSurface) {
                destSurface.updateWorldMatrix(true, false);
                destInstantWorldPos.current.copy(targetLocalPos.current).applyMatrix4(destSurface.matrixWorld);
                destSurface.getWorldQuaternion(destPlanetWorldQuat.current);
                destLandedWorldQuat.current.multiplyQuaternions(
                    destPlanetWorldQuat.current,
                    targetLocalQuat.current
                );
            }

            const oneMinusT = 1 - t;
            tempVecA.current.copy(flightStartPos.current).multiplyScalar(oneMinusT * oneMinusT);
            tempVecB.current.copy(flightControlPoint.current).multiplyScalar(2 * oneMinusT * t);
            const term3 = destInstantWorldPos.current.clone().multiplyScalar(t * t);

            const newPos = tempVecA.current.add(tempVecB.current).add(term3);

            currentVelocity.current.subVectors(newPos, lastShipPos.current);
            if (currentVelocity.current.lengthSq() > 0.0001) {
                const forward = currentVelocity.current.clone().normalize();
                lookMatrix.current.lookAt(
                    forward,
                    new THREE.Vector3(0, 0, 0),
                    new THREE.Vector3(0, 1, 0)
                );
                flightLookQuat.current.setFromRotationMatrix(lookMatrix.current);
            }

            if (t < 0.6) {
                groupRef.current.quaternion.slerp(flightLookQuat.current, Math.min(delta * 14, 1.0));
            } else {
                const orientBlend = (t - 0.6) / 0.4;
                const blendEased = orientBlend * orientBlend * (3 - 2 * orientBlend);
                const blendedQuat = flightLookQuat.current.clone().slerp(destLandedWorldQuat.current, blendEased);
                groupRef.current.quaternion.copy(blendedQuat);
            }

            lastShipPos.current.copy(newPos);
            groupRef.current.position.copy(newPos);

            if (rawProgress >= 1.0) {
                isFlying.current = false;
                currentPlanetId.current = targetPlanetId.current;
                landedLocalPos.current.copy(targetLocalPos.current);
                landedLocalQuat.current.copy(targetLocalQuat.current);
            }
        } else {
            const currentSurface = getSurfaceMesh(currentPlanetId.current);
            if (currentSurface) {
                currentSurface.updateWorldMatrix(true, false);

                const currentRadius = getPlanetRadius(currentPlanetId.current);
                landedLocalPos.current.setLength(currentRadius + HOVER_ALTITUDE);

                groupRef.current.position.copy(landedLocalPos.current).applyMatrix4(currentSurface.matrixWorld);
                currentSurface.getWorldQuaternion(destPlanetWorldQuat.current);
                groupRef.current.quaternion.multiplyQuaternions(
                    destPlanetWorldQuat.current,
                    landedLocalQuat.current
                );
            }
        }
    });

    return (
        <group ref={groupRef}>
            <mesh castShadow receiveShadow>
                <boxGeometry args={[0.32, 0.16, 0.65]} />
                <meshStandardMaterial
                    color="#e0e7ff"
                    roughness={0.3}
                    metalness={0.85}
                />
            </mesh>

            <mesh position={[0, 0.07, 0.1]}>
                <boxGeometry args={[0.22, 0.09, 0.32]} />
                <meshStandardMaterial
                    color="#0284c7"
                    roughness={0.1}
                    metalness={0.9}
                />
            </mesh>

            <mesh position={[-0.24, -0.01, -0.08]} rotation={[0, 0, -0.2]}>
                <boxGeometry args={[0.18, 0.04, 0.38]} />
                <meshStandardMaterial
                    color="#38bdf8"
                    roughness={0.4}
                    metalness={0.7}
                />
            </mesh>
            <mesh position={[0.24, -0.01, -0.08]} rotation={[0, 0, 0.2]}>
                <boxGeometry args={[0.18, 0.04, 0.38]} />
                <meshStandardMaterial
                    color="#38bdf8"
                    roughness={0.4}
                    metalness={0.7}
                />
            </mesh>

            <mesh position={[0, 0, -0.34]}>
                <boxGeometry args={[0.16, 0.08, 0.04]} />
                <meshBasicMaterial color="#38bdf8" />
            </mesh>

            <pointLight
                position={[0, 0, -0.4]}
                color="#38bdf8"
                intensity={1.2}
                distance={2.5}
                decay={2}
            />
        </group>
    );
}

export default Spaceship;

