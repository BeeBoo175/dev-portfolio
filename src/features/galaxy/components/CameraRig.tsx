import { useRef } from "react";
import { useFrame, useThree } from "@react-three/fiber";
import * as THREE from "three";

const RADIAL_OFFSET = 6;
const HEIGHT_OFFSET = 3;
const ORBIT_DISTANCE = Math.hypot(RADIAL_OFFSET, HEIGHT_OFFSET);
const HOME_RADIAL = 52;
const HOME_HEIGHT = 30;
const HOME_DISTANCE = Math.hypot(HOME_RADIAL, HOME_HEIGHT);
const HOME_ORBIT_SPEED = -0.045;
const FIXED_POLAR_ANGLE = Math.PI / 2 - 0.35;
const TRANSITION_DURATION = 0.6;

function easeInOutCubic(t: number) {
    return t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2;
}

function shortestAngleDiff(from: number, to: number) {
    let diff = (to - from) % (Math.PI * 2);
    if (diff > Math.PI) diff -= Math.PI * 2;
    if (diff < -Math.PI) diff += Math.PI * 2;
    return diff;
}

export interface CameraRigProps {
    focusId: string;
    centralId: string;
    bodyRefs: React.RefObject<Record<string, THREE.Group | null>>;
}

export function CameraRig({ focusId, centralId, bodyRefs }: CameraRigProps) {
    const { camera } = useThree();
    const lastFocusId = useRef<string | null>(null);
    const currentTargetPos = useRef(new THREE.Vector3());
    const currentLookTarget = useRef(new THREE.Vector3());
    const desiredPos = useRef(new THREE.Vector3());
    const homeTheta = useRef(0);

    const isTransitioning = useRef(false);
    const transitionElapsed = useRef(0);
    const transitionStartTargetPos = useRef(new THREE.Vector3());
    const startSpherical = useRef(new THREE.Spherical());
    const endSpherical = useRef(new THREE.Spherical());
    const scratchOffset = useRef(new THREE.Vector3());
    const scratchSpherical = useRef(new THREE.Spherical());

    useFrame((_, frameDelta) => {
        const isHome = focusId === centralId;

        if (isHome) {
            currentTargetPos.current.set(0, 0, 0);
            homeTheta.current += HOME_ORBIT_SPEED * frameDelta;
        } else {
            const planetGroup = bodyRefs.current?.[focusId];
            if (planetGroup) {
                planetGroup.getWorldPosition(currentTargetPos.current);
            }
        }

        if (focusId !== lastFocusId.current) {
            lastFocusId.current = focusId;
            isTransitioning.current = true;
            transitionElapsed.current = 0;
            transitionStartTargetPos.current.copy(currentLookTarget.current);

            scratchOffset.current.subVectors(camera.position, currentLookTarget.current);
            startSpherical.current.setFromVector3(scratchOffset.current);
        }

        const distance = isHome ? HOME_DISTANCE : ORBIT_DISTANCE;
        const theta = isHome
            ? homeTheta.current
            : Math.atan2(currentTargetPos.current.x, currentTargetPos.current.z);

        desiredPos.current
            .set(
                distance * Math.sin(FIXED_POLAR_ANGLE) * Math.sin(theta),
                distance * Math.cos(FIXED_POLAR_ANGLE),
                distance * Math.sin(FIXED_POLAR_ANGLE) * Math.cos(theta)
            )
            .add(currentTargetPos.current);

        if (isTransitioning.current) {
            transitionElapsed.current += frameDelta;
            const t = Math.min(transitionElapsed.current / TRANSITION_DURATION, 1);
            const eased = easeInOutCubic(t);

            scratchOffset.current.subVectors(desiredPos.current, currentTargetPos.current);
            endSpherical.current.setFromVector3(scratchOffset.current);

            const radius = THREE.MathUtils.lerp(startSpherical.current.radius, endSpherical.current.radius, eased);
            const thetaDiff = shortestAngleDiff(startSpherical.current.theta, endSpherical.current.theta);
            const interpolatedTheta = startSpherical.current.theta + thetaDiff * eased;

            scratchSpherical.current.set(radius, FIXED_POLAR_ANGLE, interpolatedTheta).makeSafe();
            scratchOffset.current.setFromSpherical(scratchSpherical.current);

            currentLookTarget.current.lerpVectors(transitionStartTargetPos.current, currentTargetPos.current, eased);
            camera.position.copy(currentLookTarget.current).add(scratchOffset.current);

            if (t >= 1) {
                isTransitioning.current = false;
            }
        } else {
            camera.position.copy(desiredPos.current);
            currentLookTarget.current.copy(currentTargetPos.current);
        }

        camera.lookAt(currentLookTarget.current);
    });

    return null;
}

export default CameraRig;

