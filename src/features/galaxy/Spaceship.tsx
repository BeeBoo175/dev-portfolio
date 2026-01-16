import { useRef, useEffect } from "react";
import { useFrame } from "@react-three/fiber";
import * as THREE from "three";
import { ORBIT_LAYOUT } from "./data";

interface SpaceshipProps {
    focusId: string;
    bodyRefs: React.RefObject<Record<string, THREE.Group | null>>;
}

const SUN_SAFE_RADIUS = 7.5;
const HOVER_ALTITUDE = 0.45;
const DEFAULT_PLANET_ID = "about";

const PLANET_RADIUS_MAP: Record<string, number> = Object.fromEntries(
    ORBIT_LAYOUT.map((p) => [p.id, p.radius])
);

const PLANET_ROTATION_MAP: Record<string, number> = Object.fromEntries(
    ORBIT_LAYOUT.map((p) => [p.id, p.rotationSpeed])
);

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

export function Spaceship({ focusId, bodyRefs }: SpaceshipProps) {
    const groupRef = useRef<THREE.Group>(null);

    const currentPlanetId = useRef<string>(DEFAULT_PLANET_ID);
    const targetPlanetId = useRef<string>(DEFAULT_PLANET_ID);
    const isFlying = useRef<boolean>(false);
    const flightElapsed = useRef<number>(0);
    const flightDuration = useRef<number>(1.2);

    const flightStartPos = useRef(new THREE.Vector3());
    const flightControlPoint = useRef(new THREE.Vector3());
    const lastShipPos = useRef(new THREE.Vector3());
    const currentVelocity = useRef(new THREE.Vector3(0, 0, 1));
    const targetQuat = useRef(new THREE.Quaternion());
    const lookMatrix = useRef(new THREE.Matrix4());
    const tempVecA = useRef(new THREE.Vector3());
    const tempVecB = useRef(new THREE.Vector3());
    const destWorldPos = useRef(new THREE.Vector3());
    const landedLocalOffset = useRef(new THREE.Vector3(0, 1, 0));
    const yAxis = useRef(new THREE.Vector3(0, 1, 0));
    const spinQuat = useRef(new THREE.Quaternion());

    const isInitialized = useRef<boolean>(false);

    useEffect(() => {
        if (focusId === "home") return;
        if (!PLANET_RADIUS_MAP[focusId]) return;

        if (focusId !== targetPlanetId.current) {
            const previousTarget = targetPlanetId.current;
            targetPlanetId.current = focusId;

            if (isFlying.current && groupRef.current) {
                flightStartPos.current.copy(groupRef.current.position);
                const destPlanet = bodyRefs.current?.[focusId];
                if (destPlanet) {
                    destPlanet.getWorldPosition(destWorldPos.current);
                    const planetRadius = PLANET_RADIUS_MAP[focusId] ?? 1.0;
                    destWorldPos.current.y += planetRadius + HOVER_ALTITUDE;
                    flightControlPoint.current = calculateControlPoint(
                        flightStartPos.current,
                        destWorldPos.current,
                        currentVelocity.current
                    );
                    const dist = flightStartPos.current.distanceTo(destWorldPos.current);
                    flightDuration.current = THREE.MathUtils.clamp(dist * 0.09 + 0.8, 1.0, 2.2);
                    flightElapsed.current = 0;
                    isFlying.current = true;
                }
            } else {
                const startPlanet = bodyRefs.current?.[previousTarget];
                const destPlanet = bodyRefs.current?.[focusId];
                if (startPlanet && destPlanet && groupRef.current) {
                    flightStartPos.current.copy(groupRef.current.position);
                    destPlanet.getWorldPosition(destWorldPos.current);
                    const planetRadius = PLANET_RADIUS_MAP[focusId] ?? 1.0;
                    destWorldPos.current.y += planetRadius + HOVER_ALTITUDE;
                    flightControlPoint.current = calculateControlPoint(
                        flightStartPos.current,
                        destWorldPos.current
                    );
                    const dist = flightStartPos.current.distanceTo(destWorldPos.current);
                    flightDuration.current = THREE.MathUtils.clamp(dist * 0.09 + 0.8, 1.0, 2.2);
                    flightElapsed.current = 0;
                    isFlying.current = true;
                }
            }
        }
    }, [focusId, bodyRefs]);

    useFrame((_, delta) => {
        if (!groupRef.current) return;

        if (!isInitialized.current) {
            const initialPlanet = bodyRefs.current?.[DEFAULT_PLANET_ID];
            if (initialPlanet) {
                initialPlanet.getWorldPosition(destWorldPos.current);
                const radius = PLANET_RADIUS_MAP[DEFAULT_PLANET_ID] ?? 1.0;
                landedLocalOffset.current.set(0, radius + HOVER_ALTITUDE, 0);
                groupRef.current.position.addVectors(destWorldPos.current, landedLocalOffset.current);
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

            const destPlanet = bodyRefs.current?.[targetPlanetId.current];
            if (destPlanet) {
                destPlanet.getWorldPosition(destWorldPos.current);
                const planetRadius = PLANET_RADIUS_MAP[targetPlanetId.current] ?? 1.0;
                destWorldPos.current.y += planetRadius + HOVER_ALTITUDE;
            }

            const oneMinusT = 1 - t;
            tempVecA.current.copy(flightStartPos.current).multiplyScalar(oneMinusT * oneMinusT);
            tempVecB.current.copy(flightControlPoint.current).multiplyScalar(2 * oneMinusT * t);
            const term3 = destWorldPos.current.clone().multiplyScalar(t * t);

            const newPos = tempVecA.current.add(tempVecB.current).add(term3);

            currentVelocity.current.subVectors(newPos, lastShipPos.current);
            if (currentVelocity.current.lengthSq() > 0.0001) {
                const forward = currentVelocity.current.clone().normalize();
                lookMatrix.current.lookAt(
                    new THREE.Vector3(0, 0, 0),
                    forward,
                    new THREE.Vector3(0, 1, 0)
                );
                targetQuat.current.setFromRotationMatrix(lookMatrix.current);
                groupRef.current.quaternion.slerp(targetQuat.current, Math.min(delta * 12, 1.0));
            }

            lastShipPos.current.copy(newPos);
            groupRef.current.position.copy(newPos);

            if (rawProgress >= 1.0) {
                isFlying.current = false;
                currentPlanetId.current = targetPlanetId.current;
                if (destPlanet) {
                    destPlanet.getWorldPosition(destWorldPos.current);
                    const planetRadius = PLANET_RADIUS_MAP[currentPlanetId.current] ?? 1.0;
                    landedLocalOffset.current.subVectors(newPos, destWorldPos.current);
                    if (landedLocalOffset.current.lengthSq() < 0.001) {
                        landedLocalOffset.current.set(0, planetRadius + HOVER_ALTITUDE, 0);
                    } else {
                        landedLocalOffset.current.setLength(planetRadius + HOVER_ALTITUDE);
                    }
                }
            }
        } else {
            const currentPlanet = bodyRefs.current?.[currentPlanetId.current];
            if (currentPlanet) {
                currentPlanet.getWorldPosition(destWorldPos.current);
                const rotationSpeed = PLANET_ROTATION_MAP[currentPlanetId.current] ?? 0;
                const spinAngle = rotationSpeed * delta;

                landedLocalOffset.current.applyAxisAngle(yAxis.current, spinAngle);
                groupRef.current.position.addVectors(destWorldPos.current, landedLocalOffset.current);

                spinQuat.current.setFromAxisAngle(yAxis.current, spinAngle);
                groupRef.current.quaternion.premultiply(spinQuat.current);
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
