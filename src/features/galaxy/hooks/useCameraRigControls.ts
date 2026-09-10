import { useEffect, useRef, useCallback } from "react";
import * as THREE from "three";

export const FIXED_POLAR_ANGLE = Math.PI / 2 - 0.35;
const TOUCH_ROTATE_SENSITIVITY = 0.0095;
const MOUSE_ROTATE_SENSITIVITY = 0.005;

export interface UseCameraRigControlsOptions {
    gl: THREE.WebGLRenderer;
    focusId: string;
    centralId: string;
    allowManualOrbit: boolean;
    allowZoom: boolean;
    onFocusChange?: (id: string) => void;
}

export function useCameraRigControls({
    gl,
    focusId,
    centralId,
    allowManualOrbit,
    allowZoom,
    onFocusChange,
}: UseCameraRigControlsOptions) {
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

    const thetaVelocityRef = useRef(0);
    const lastPointerMoveTimeRef = useRef(0);

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
            if (e.button !== 0) return;
            if (
                e.target instanceof Element &&
                e.target.closest(
                    "button, a, input, select, textarea, [role='button'], .docked-navigation, .studio-launcher-btn, .scroll-to-top"
                )
            ) {
                return;
            }

            activePointersRef.current.set(e.pointerId, { x: e.clientX, y: e.clientY });

            if (activePointersRef.current.size === 1) {
                isDraggingRef.current = true;
                thetaVelocityRef.current = 0;
                lastPointerPosRef.current = { x: e.clientX, y: e.clientY };
                dragStartPosRef.current = { x: e.clientX, y: e.clientY };
                gestureAxisRef.current = allowZoom ? "horizontal" : null;
            } else if (activePointersRef.current.size === 2 && allowZoom) {
                isDraggingRef.current = false;
                thetaVelocityRef.current = 0;
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

            const totalDx = Math.abs(e.clientX - dragStartPosRef.current.x);
            const totalDy = Math.abs(e.clientY - dragStartPosRef.current.y);

            if (!allowZoom && gestureAxisRef.current === null) {
                if (totalDx > 8 && totalDx >= totalDy * 0.8) {
                    gestureAxisRef.current = "horizontal";
                    lastPointerPosRef.current = { x: e.clientX, y: e.clientY };
                } else if (totalDy > 8 && totalDy > totalDx * 1.2) {
                    gestureAxisRef.current = "vertical";
                    isDraggingRef.current = false;
                    return;
                } else {
                    return;
                }
            }

            if (gestureAxisRef.current === "vertical") return;

            const deltaX = e.clientX - lastPointerPosRef.current.x;
            const deltaY = e.clientY - lastPointerPosRef.current.y;
            lastPointerPosRef.current = { x: e.clientX, y: e.clientY };

            const isTouch = e.pointerType === "touch";
            const sensitivity = isTouch ? TOUCH_ROTATE_SENSITIVITY : MOUSE_ROTATE_SENSITIVITY;
            const deltaTheta = -deltaX * sensitivity;
            targetThetaOffsetRef.current += deltaTheta;

            thetaVelocityRef.current = deltaTheta;
            lastPointerMoveTimeRef.current = performance.now();

            if (allowZoom || !isTouch) {
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

                if (performance.now() - lastPointerMoveTimeRef.current > 75) {
                    thetaVelocityRef.current = 0;
                } else {
                    thetaVelocityRef.current = THREE.MathUtils.clamp(
                        thetaVelocityRef.current,
                        -0.08,
                        0.08
                    );
                }
            } else if (activePointersRef.current.size === 1) {
                lastPinchDistanceRef.current = null;
                thetaVelocityRef.current = 0;
                const remaining = Array.from(activePointersRef.current.values())[0];
                lastPointerPosRef.current = { x: remaining.x, y: remaining.y };
                isDraggingRef.current = true;
            }
        };

        const handleContextMenu = (e: MouseEvent) => {
            e.preventDefault();
        };

        const handleWheel = (e: WheelEvent) => {
            if (allowZoom) {
                e.preventDefault();
                const zoomDelta = e.deltaY * 0.02;
                applyZoomDelta(zoomDelta);
            }
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

    const resetOffsets = useCallback(() => {
        targetThetaOffsetRef.current = 0;
        targetPhiOffsetRef.current = 0;
        userThetaOffsetRef.current = 0;
        userPhiOffsetRef.current = 0;
        targetZoomOffsetRef.current = 0;
        userZoomOffsetRef.current = 0;
        thetaVelocityRef.current = 0;
    }, []);

    const updateManualOrbit = useCallback((frameDelta: number) => {
        if (!allowManualOrbit) return;

        if (!isDraggingRef.current && Math.abs(thetaVelocityRef.current) > 0.00005) {
            targetThetaOffsetRef.current += thetaVelocityRef.current;
            thetaVelocityRef.current *= Math.exp(-6 * frameDelta);
            if (Math.abs(thetaVelocityRef.current) <= 0.00005) {
                thetaVelocityRef.current = 0;
            }
        }

        userThetaOffsetRef.current = THREE.MathUtils.damp(
            userThetaOffsetRef.current,
            targetThetaOffsetRef.current,
            14,
            frameDelta
        );
        userPhiOffsetRef.current = THREE.MathUtils.damp(
            userPhiOffsetRef.current,
            targetPhiOffsetRef.current,
            14,
            frameDelta
        );
        userZoomOffsetRef.current = THREE.MathUtils.damp(
            userZoomOffsetRef.current,
            targetZoomOffsetRef.current,
            14,
            frameDelta
        );
    }, [allowManualOrbit]);

    return {
        userThetaOffsetRef,
        userPhiOffsetRef,
        userZoomOffsetRef,
        resetOffsets,
        updateManualOrbit,
    };
}
