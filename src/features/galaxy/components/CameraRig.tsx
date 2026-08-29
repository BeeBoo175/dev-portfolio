import { useEffect, useRef } from "react";
import { useFrame, useThree } from "@react-three/fiber";
import * as THREE from "three";
import { getCameraDistanceConfig, type CameraDistanceConfig } from "../cameraConfig";

const HOME_ORBIT_SPEED = -0.045;
const FIXED_POLAR_ANGLE = Math.PI / 2 - 0.35;
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
    cameraOrbitSpeed?: number;
    isCameraOrbitPaused?: boolean;
    customDistanceConfig?: Partial<CameraDistanceConfig>;
    onFocusChange?: (id: string) => void;
}

function useCameraRigControls(
    gl: THREE.WebGLRenderer,
    focusId: string,
    centralId: string,
    allowManualOrbit: boolean,
    allowZoom: boolean,
    onFocusChange?: (id: string) => void
) {
    const isDraggingRef = useRef(false);
    const lastPointerPosRef = useRef({ x: 0, y: 0 });
    const userThetaOffsetRef = useRef(0);
    const userPhiOffsetRef = useRef(0);
    const targetThetaOffsetRef = useRef(0);
    const targetPhiOffsetRef = useRef(0);

    const userZoomOffsetRef = useRef(0);
    const targetZoomOffsetRef = useRef(0);

    const activePointersRef = useRef<Map<number, { x: number; y: number }>>(new Map());
    const lastPinchDistanceRef = useRef<number | null>(null);
    const dragStartPosRef = useRef({ x: 0, y: 0 });
    const gestureAxisRef = useRef<"horizontal" | "vertical" | null>(null);

    useEffect(() => {
        const handleZoomButtonEvent = (e: CustomEvent<{ delta: number }>) => {
            const isHome = focusId === centralId || focusId === "sun";
            const minZoom = isHome ? -30 : -4.5;
            const maxZoom = isHome ? 80 : 35;

            targetZoomOffsetRef.current = THREE.MathUtils.clamp(
                targetZoomOffsetRef.current + e.detail.delta,
                minZoom,
                maxZoom
            );
        };

        window.addEventListener("portfolio:camera-zoom", handleZoomButtonEvent as EventListener);
        return () => {
            window.removeEventListener("portfolio:camera-zoom", handleZoomButtonEvent as EventListener);
        };
    }, [centralId, focusId]);

    useEffect(() => {
        if (!allowManualOrbit) return;

        const domElement = gl.domElement;

        const applyZoomDelta = (zoomDelta: number) => {
            if (!allowZoom) return;
            const isHome = focusId === centralId || focusId === "sun";
            const minZoom = isHome ? -30 : -4.5;
            const maxZoom = isHome ? 80 : 35;

            const nextZoom = THREE.MathUtils.clamp(
                targetZoomOffsetRef.current + zoomDelta,
                minZoom,
                maxZoom
            );
            targetZoomOffsetRef.current = nextZoom;

            if (!isHome && nextZoom >= 22 && onFocusChange) {
                targetZoomOffsetRef.current = 0;
                onFocusChange("home");
            }
        };

        const handlePointerDown = (e: PointerEvent) => {
            activePointersRef.current.set(e.pointerId, { x: e.clientX, y: e.clientY });

            if (activePointersRef.current.size === 1 && e.button === 0) {
                isDraggingRef.current = true;
                lastPointerPosRef.current = { x: e.clientX, y: e.clientY };
                dragStartPosRef.current = { x: e.clientX, y: e.clientY };
                gestureAxisRef.current = allowZoom ? "horizontal" : null;
            } else if (activePointersRef.current.size === 2 && allowZoom) {
                isDraggingRef.current = false;
                const points = Array.from(activePointersRef.current.values());
                lastPinchDistanceRef.current = Math.hypot(
                    points[0].x - points[1].x,
                    points[0].y - points[1].y
                );
            }
        };

        const handlePointerMove = (e: PointerEvent) => {
            if (activePointersRef.current.has(e.pointerId)) {
                activePointersRef.current.set(e.pointerId, { x: e.clientX, y: e.clientY });
            }

            if (activePointersRef.current.size === 2 && lastPinchDistanceRef.current !== null && allowZoom) {
                const points = Array.from(activePointersRef.current.values());
                const currentDistance = Math.hypot(
                    points[0].x - points[1].x,
                    points[0].y - points[1].y
                );
                const diff = lastPinchDistanceRef.current - currentDistance;
                lastPinchDistanceRef.current = currentDistance;

                applyZoomDelta(diff * 0.08);
                return;
            }

            if (!isDraggingRef.current) return;

            if (e.pointerType === "touch" && !allowZoom && gestureAxisRef.current === null) {
                const totalDx = Math.abs(e.clientX - dragStartPosRef.current.x);
                const totalDy = Math.abs(e.clientY - dragStartPosRef.current.y);

                if (totalDx > 6 || totalDy > 6) {
                    if (totalDy > totalDx) {
                        gestureAxisRef.current = "vertical";
                        isDraggingRef.current = false;
                        return;
                    }
                    gestureAxisRef.current = "horizontal";
                } else {
                    return;
                }
            }

            if (gestureAxisRef.current === "vertical") return;

            const deltaX = e.clientX - lastPointerPosRef.current.x;
            const deltaY = e.clientY - lastPointerPosRef.current.y;
            lastPointerPosRef.current = { x: e.clientX, y: e.clientY };

            targetThetaOffsetRef.current -= deltaX * 0.005;

            if (allowZoom || e.pointerType !== "touch") {
                targetPhiOffsetRef.current = THREE.MathUtils.clamp(
                    targetPhiOffsetRef.current - deltaY * 0.005,
                    -FIXED_POLAR_ANGLE + 0.1,
                    Math.PI - FIXED_POLAR_ANGLE - 0.1
                );
            }
        };

        const handlePointerUp = (e: PointerEvent) => {
            activePointersRef.current.delete(e.pointerId);

            if (activePointersRef.current.size === 0) {
                isDraggingRef.current = false;
                gestureAxisRef.current = null;
                lastPinchDistanceRef.current = null;
            } else if (activePointersRef.current.size === 1) {
                lastPinchDistanceRef.current = null;
                const remaining = Array.from(activePointersRef.current.values())[0];
                lastPointerPosRef.current = { x: remaining.x, y: remaining.y };
                isDraggingRef.current = true;
            }
        };

        const handleContextMenu = (e: MouseEvent) => {
            e.preventDefault();
        };

        const handleWheel = (e: WheelEvent) => {
            if (!allowZoom) return;
            e.preventDefault();
            const zoomDelta = e.deltaY * 0.02;
            applyZoomDelta(zoomDelta);
        };

        domElement.addEventListener("pointerdown", handlePointerDown);
        if (allowZoom) {
            domElement.addEventListener("wheel", handleWheel, { passive: false });
        }
        window.addEventListener("pointermove", handlePointerMove);
        window.addEventListener("pointerup", handlePointerUp);
        window.addEventListener("pointercancel", handlePointerUp);
        domElement.addEventListener("contextmenu", handleContextMenu);

        return () => {
            domElement.removeEventListener("pointerdown", handlePointerDown);
            if (allowZoom) {
                domElement.removeEventListener("wheel", handleWheel);
            }
            window.removeEventListener("pointermove", handlePointerMove);
            window.removeEventListener("pointerup", handlePointerUp);
            window.removeEventListener("pointercancel", handlePointerUp);
            domElement.removeEventListener("contextmenu", handleContextMenu);
        };
    }, [allowManualOrbit, allowZoom, centralId, focusId, gl.domElement, onFocusChange]);

    return {
        userThetaOffsetRef,
        userPhiOffsetRef,
        targetThetaOffsetRef,
        targetPhiOffsetRef,
        userZoomOffsetRef,
        targetZoomOffsetRef
    };
}

export function CameraRig({
    focusId,
    centralId,
    bodyRefs,
    allowManualOrbit = false,
    allowZoom = false,
    cameraOrbitSpeed = HOME_ORBIT_SPEED,
    isCameraOrbitPaused = false,
    customDistanceConfig,
    onFocusChange,
}: CameraRigProps) {
    const { camera, gl } = useThree();
    const lastFocusId = useRef<string | null>(null);
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
        targetThetaOffsetRef,
        targetPhiOffsetRef,
        userZoomOffsetRef,
        targetZoomOffsetRef
    } = useCameraRigControls(gl, focusId, centralId, allowManualOrbit, allowZoom, onFocusChange);

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

        if (allowManualOrbit) {
            userThetaOffsetRef.current = THREE.MathUtils.damp(
                userThetaOffsetRef.current,
                targetThetaOffsetRef.current,
                12,
                frameDelta
            );
            userPhiOffsetRef.current = THREE.MathUtils.damp(
                userPhiOffsetRef.current,
                targetPhiOffsetRef.current,
                12,
                frameDelta
            );
            userZoomOffsetRef.current = THREE.MathUtils.damp(
                userZoomOffsetRef.current,
                targetZoomOffsetRef.current,
                12,
                frameDelta
            );
        }

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

        if (focusId !== lastFocusId.current) {
            lastFocusId.current = focusId;
            isTransitioning.current = true;
            transitionElapsed.current = 0;
            transitionStartLookTarget.current.copy(currentLookTarget.current);

            scratchOffset.current.subVectors(camera.position, currentTargetPos.current);
            transitionStartSpherical.current.setFromVector3(scratchOffset.current).makeSafe();

            targetThetaOffsetRef.current = 0;
            targetPhiOffsetRef.current = 0;
            userThetaOffsetRef.current = 0;
            userPhiOffsetRef.current = 0;
            targetZoomOffsetRef.current = 0;
            userZoomOffsetRef.current = 0;
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

