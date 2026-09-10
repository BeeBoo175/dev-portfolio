import { useRef } from "react";
import { useFrame, useThree } from "@react-three/fiber";
import * as THREE from "three";
import { getCameraDistanceConfig, type CameraDistanceConfig } from "../cameraConfig";
import { useCameraRigControls, FIXED_POLAR_ANGLE } from "../hooks/useCameraRigControls";

const HOME_ORBIT_SPEED = -0.045;
const TRANSITION_DURATION = 0.72;

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
    allowZoom?: boolean;
    isEditorMode?: boolean;
    cameraOrbitSpeed?: number;
    isCameraOrbitPaused?: boolean;
    customDistanceConfig?: Partial<CameraDistanceConfig>;
    onFocusChange?: (id: string) => void;
}

export function CameraRig({
    focusId,
    centralId,
    bodyRefs,
    allowManualOrbit = false,
    allowZoom = false,
    isEditorMode = false,
    cameraOrbitSpeed = HOME_ORBIT_SPEED,
    isCameraOrbitPaused = false,
    customDistanceConfig,
    onFocusChange,
}: CameraRigProps) {
    const { camera, gl } = useThree();
    const lastFocusId = useRef<string | null>(null);
    const lastEditorMode = useRef(isEditorMode);
    const currentTargetPos = useRef(new THREE.Vector3());
    const currentLookTarget = useRef(new THREE.Vector3());
    const desiredPos = useRef(new THREE.Vector3());
    const homeTheta = useRef(0);

    const isTransitioning = useRef(false);
    const transitionElapsed = useRef(0);
    const transitionStartLookTarget = useRef(new THREE.Vector3());
    const transitionStartSpherical = useRef(new THREE.Spherical());
    const transitionEndSpherical = useRef(new THREE.Spherical());
    const scratchOffset = useRef(new THREE.Vector3());
    const scratchSpherical = useRef(new THREE.Spherical());

    const {
        userThetaOffsetRef,
        userPhiOffsetRef,
        userZoomOffsetRef,
        resetOffsets,
        updateManualOrbit,
    } = useCameraRigControls({
        gl,
        focusId,
        centralId,
        allowManualOrbit,
        allowZoom,
        onFocusChange,
    });

    useFrame((_, frameDelta) => {
        const isHome = focusId === centralId || focusId === "sun";
        const isBelt = focusId === "asteroid-belt";

        if (isHome || isBelt) {
            currentTargetPos.current.set(0, 0, 0);
            if (!isCameraOrbitPaused) {
                homeTheta.current += cameraOrbitSpeed * frameDelta;
            }
        } else {
            const planetGroup = bodyRefs.current?.[focusId];
            if (planetGroup) {
                planetGroup.getWorldPosition(currentTargetPos.current);
            }
        }

        updateManualOrbit(frameDelta);

        const isMobile = typeof window !== "undefined" && window.innerWidth <= 1280;
        const config = {
            ...getCameraDistanceConfig(isMobile),
            ...customDistanceConfig,
        };

        const homeBaseDist = Math.hypot(config.homeRadial, config.homeHeight);
        const orbitBaseDist = Math.hypot(config.orbitRadial, config.orbitHeight);
        const baseDistance = isBelt ? config.beltDistance : isHome ? homeBaseDist : orbitBaseDist;
        const distance = Math.max(1.5, baseDistance + userZoomOffsetRef.current);

        const baseTheta = isHome || isBelt
            ? homeTheta.current
            : Math.atan2(currentTargetPos.current.x, currentTargetPos.current.z);

        const activeTheta = baseTheta + userThetaOffsetRef.current;
        const activePhi = THREE.MathUtils.clamp(
            FIXED_POLAR_ANGLE + userPhiOffsetRef.current,
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

        const isExitingEditor = lastEditorMode.current && !isEditorMode;
        lastEditorMode.current = isEditorMode;

        if (focusId !== lastFocusId.current || isExitingEditor) {
            const isInitial = lastFocusId.current === null;
            lastFocusId.current = focusId;
            resetOffsets();

            if (isInitial) {
                camera.position.copy(desiredPos.current);
                currentLookTarget.current.copy(currentTargetPos.current);
                camera.lookAt(currentLookTarget.current);
                isTransitioning.current = false;
            } else {
                isTransitioning.current = true;
                transitionElapsed.current = 0;
                transitionStartLookTarget.current.copy(currentLookTarget.current);

                scratchOffset.current.subVectors(camera.position, currentTargetPos.current);
                transitionStartSpherical.current.setFromVector3(scratchOffset.current).makeSafe();
            }
        }

        if (isTransitioning.current) {
            transitionElapsed.current += frameDelta;
            const t = Math.min(transitionElapsed.current / TRANSITION_DURATION, 1);
            const eased = easeInOutCubic(t);

            scratchOffset.current.subVectors(desiredPos.current, currentTargetPos.current);
            transitionEndSpherical.current.setFromVector3(scratchOffset.current).makeSafe();

            const baseRadius = THREE.MathUtils.lerp(
                transitionStartSpherical.current.radius,
                transitionEndSpherical.current.radius,
                eased
            );
            const arch = Math.sin(t * Math.PI) * Math.min(baseRadius * 0.08, 3.0);
            const radius = baseRadius + arch;

            const phi = THREE.MathUtils.lerp(
                transitionStartSpherical.current.phi,
                transitionEndSpherical.current.phi,
                eased
            );
            const thetaDiff = shortestAngleDiff(
                transitionStartSpherical.current.theta,
                transitionEndSpherical.current.theta
            );
            const theta = transitionStartSpherical.current.theta + thetaDiff * eased;

            scratchSpherical.current.set(radius, phi, theta).makeSafe();
            scratchOffset.current.setFromSpherical(scratchSpherical.current);

            currentLookTarget.current.lerpVectors(
                transitionStartLookTarget.current,
                currentTargetPos.current,
                eased
            );

            camera.position.copy(currentTargetPos.current).add(scratchOffset.current);

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
