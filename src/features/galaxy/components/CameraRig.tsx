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

    const isDragging = useRef(false);
    const lastPointerPos = useRef({ x: 0, y: 0 });
    const userThetaOffset = useRef(0);
    const userPhiOffset = useRef(0);
    const targetThetaOffset = useRef(0);
    const targetPhiOffset = useRef(0);

    const userZoomOffset = useRef(0);
    const targetZoomOffset = useRef(0);

    const activePointers = useRef<Map<number, { x: number; y: number }>>(new Map());
    const lastPinchDistance = useRef<number | null>(null);
    const dragStartPos = useRef({ x: 0, y: 0 });
    const gestureAxis = useRef<"horizontal" | "vertical" | null>(null);

    useEffect(() => {
        const handleZoomButtonEvent = (e: CustomEvent<{ delta: number }>) => {
            const isHome = focusId === centralId || focusId === "sun";
            const minZoom = isHome ? -30 : -4.5;
            const maxZoom = isHome ? 80 : 35;

            targetZoomOffset.current = THREE.MathUtils.clamp(
                targetZoomOffset.current + e.detail.delta,
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
                targetZoomOffset.current + zoomDelta,
                minZoom,
                maxZoom
            );
            targetZoomOffset.current = nextZoom;

            if (!isHome && nextZoom >= 22 && onFocusChange) {
                targetZoomOffset.current = 0;
                onFocusChange("home");
            }
        };

        const handlePointerDown = (e: PointerEvent) => {
            activePointers.current.set(e.pointerId, { x: e.clientX, y: e.clientY });

            if (activePointers.current.size === 1 && e.button === 0) {
                isDragging.current = true;
                lastPointerPos.current = { x: e.clientX, y: e.clientY };
                dragStartPos.current = { x: e.clientX, y: e.clientY };
                gestureAxis.current = allowZoom ? "horizontal" : null;
            } else if (activePointers.current.size === 2 && allowZoom) {
                isDragging.current = false;
                const points = Array.from(activePointers.current.values());
                lastPinchDistance.current = Math.hypot(
                    points[0].x - points[1].x,
                    points[0].y - points[1].y
                );
            }
        };

        const handlePointerMove = (e: PointerEvent) => {
            if (activePointers.current.has(e.pointerId)) {
                activePointers.current.set(e.pointerId, { x: e.clientX, y: e.clientY });
            }

            if (activePointers.current.size === 2 && lastPinchDistance.current !== null && allowZoom) {
                const points = Array.from(activePointers.current.values());
                const currentDistance = Math.hypot(
                    points[0].x - points[1].x,
                    points[0].y - points[1].y
                );
                const diff = lastPinchDistance.current - currentDistance;
                lastPinchDistance.current = currentDistance;

                applyZoomDelta(diff * 0.08);
                return;
            }

            if (!isDragging.current) return;

            if (e.pointerType === "touch" && !allowZoom && gestureAxis.current === null) {
                const totalDx = Math.abs(e.clientX - dragStartPos.current.x);
                const totalDy = Math.abs(e.clientY - dragStartPos.current.y);

                if (totalDx > 6 || totalDy > 6) {
                    if (totalDy > totalDx) {
                        gestureAxis.current = "vertical";
                        isDragging.current = false;
                        return;
                    }
                    gestureAxis.current = "horizontal";
                } else {
                    return;
                }
            }

            if (gestureAxis.current === "vertical") return;

            const deltaX = e.clientX - lastPointerPos.current.x;
            const deltaY = e.clientY - lastPointerPos.current.y;
            lastPointerPos.current = { x: e.clientX, y: e.clientY };

            targetThetaOffset.current -= deltaX * 0.005;

            if (allowZoom || e.pointerType !== "touch") {
                targetPhiOffset.current = THREE.MathUtils.clamp(
                    targetPhiOffset.current - deltaY * 0.005,
                    -FIXED_POLAR_ANGLE + 0.1,
                    Math.PI - FIXED_POLAR_ANGLE - 0.1
                );
            }
        };

        const handlePointerUp = (e: PointerEvent) => {
            activePointers.current.delete(e.pointerId);

            if (activePointers.current.size === 0) {
                isDragging.current = false;
                gestureAxis.current = null;
                lastPinchDistance.current = null;
            } else if (activePointers.current.size === 1) {
                lastPinchDistance.current = null;
                const remaining = Array.from(activePointers.current.values())[0];
                lastPointerPos.current = { x: remaining.x, y: remaining.y };
                isDragging.current = true;
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
            userZoomOffset.current = THREE.MathUtils.damp(
                userZoomOffset.current,
                targetZoomOffset.current,
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
        const distance = Math.max(1.5, baseDistance + userZoomOffset.current);

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

        if (focusId !== lastFocusId.current) {
            lastFocusId.current = focusId;
            isTransitioning.current = true;
            transitionElapsed.current = 0;
            transitionStartLookTarget.current.copy(currentLookTarget.current);

            scratchOffset.current.subVectors(camera.position, currentTargetPos.current);
            transitionStartSpherical.current.setFromVector3(scratchOffset.current).makeSafe();

            targetThetaOffset.current = 0;
            targetPhiOffset.current = 0;
            userThetaOffset.current = 0;
            userPhiOffset.current = 0;
            targetZoomOffset.current = 0;
            userZoomOffset.current = 0;
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

