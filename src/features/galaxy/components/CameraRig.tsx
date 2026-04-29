import { useEffect, useRef } from "react";
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
    allowManualOrbit?: boolean;
}

export function CameraRig({
    focusId,
    centralId,
    bodyRefs,
    allowManualOrbit = false,
}: CameraRigProps) {
    const { camera, gl } = useThree();
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

    const isDragging = useRef(false);
    const lastPointerPos = useRef({ x: 0, y: 0 });
    const userThetaOffset = useRef(0);
    const userPhiOffset = useRef(0);
    const targetThetaOffset = useRef(0);
    const targetPhiOffset = useRef(0);

    useEffect(() => {
        if (!allowManualOrbit) return;

        const domElement = gl.domElement;

        const handlePointerDown = (e: PointerEvent) => {
            if (e.button !== 0) return;
            isDragging.current = true;
            lastPointerPos.current = { x: e.clientX, y: e.clientY };
        };

        const handlePointerMove = (e: PointerEvent) => {
            if (!isDragging.current) return;
            const deltaX = e.clientX - lastPointerPos.current.x;
            const deltaY = e.clientY - lastPointerPos.current.y;
            lastPointerPos.current = { x: e.clientX, y: e.clientY };

            targetThetaOffset.current -= deltaX * 0.005;
            targetPhiOffset.current = THREE.MathUtils.clamp(
                targetPhiOffset.current - deltaY * 0.005,
                -FIXED_POLAR_ANGLE + 0.1,
                Math.PI - FIXED_POLAR_ANGLE - 0.1
            );
        };

        const handlePointerUp = () => {
            isDragging.current = false;
        };

        const handleContextMenu = (e: MouseEvent) => {
            e.preventDefault();
        };

        domElement.addEventListener("pointerdown", handlePointerDown);
        window.addEventListener("pointermove", handlePointerMove);
        window.addEventListener("pointerup", handlePointerUp);
        window.addEventListener("pointercancel", handlePointerUp);
        domElement.addEventListener("contextmenu", handleContextMenu);

        return () => {
            domElement.removeEventListener("pointerdown", handlePointerDown);
            window.removeEventListener("pointermove", handlePointerMove);
            window.removeEventListener("pointerup", handlePointerUp);
            window.removeEventListener("pointercancel", handlePointerUp);
            domElement.removeEventListener("contextmenu", handleContextMenu);
        };
    }, [allowManualOrbit, gl.domElement]);

    useFrame((_, frameDelta) => {
        const isHome = focusId === centralId || focusId === "sun";
        const isBelt = focusId === "asteroid-belt";

        if (isHome || isBelt) {
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

            targetThetaOffset.current = 0;
            targetPhiOffset.current = 0;
            userThetaOffset.current = 0;
            userPhiOffset.current = 0;

            scratchOffset.current.subVectors(camera.position, currentLookTarget.current);
            startSpherical.current.setFromVector3(scratchOffset.current);
        }

        if (allowManualOrbit) {
            userThetaOffset.current = THREE.MathUtils.damp(
                userThetaOffset.current,
                targetThetaOffset.current,
                12,
                frameDelta
            );
            userPhiOffset.current = THREE.MathUtils.damp(
                userPhiOffset.current,
                targetPhiOffset.current,
                12,
                frameDelta
            );
        }

        const distance = isBelt ? 36 : isHome ? HOME_DISTANCE : ORBIT_DISTANCE;
        const baseTheta = isHome || isBelt
            ? homeTheta.current
            : Math.atan2(currentTargetPos.current.x, currentTargetPos.current.z);

        const activeTheta = baseTheta + userThetaOffset.current;
        const activePhi = THREE.MathUtils.clamp(
            FIXED_POLAR_ANGLE + userPhiOffset.current,
            0.1,
            Math.PI - 0.1
        );

        desiredPos.current
            .set(
                distance * Math.sin(activePhi) * Math.sin(activeTheta),
                distance * Math.cos(activePhi),
                distance * Math.sin(activePhi) * Math.cos(activeTheta)
            )
            .add(currentTargetPos.current);

        if (isTransitioning.current) {
            transitionElapsed.current += frameDelta;
            const t = Math.min(transitionElapsed.current / TRANSITION_DURATION, 1);
            const eased = easeInOutCubic(t);

            scratchOffset.current.subVectors(desiredPos.current, currentTargetPos.current);
            endSpherical.current.setFromVector3(scratchOffset.current);

            const radius = THREE.MathUtils.lerp(
                startSpherical.current.radius,
                endSpherical.current.radius,
                eased
            );
            const thetaDiff = shortestAngleDiff(
                startSpherical.current.theta,
                endSpherical.current.theta
            );
            const interpolatedTheta = startSpherical.current.theta + thetaDiff * eased;

            scratchSpherical.current.set(radius, activePhi, interpolatedTheta).makeSafe();
            scratchOffset.current.setFromSpherical(scratchSpherical.current);

            currentLookTarget.current.lerpVectors(
                transitionStartTargetPos.current,
                currentTargetPos.current,
                eased
            );
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

