import { useMemo, useRef, useEffect } from "react";
import { useFrame, useThree } from "@react-three/fiber";
import * as THREE from "three";
import { getCameraDistanceConfig } from "../cameraConfig";

export const DEFAULT_CAMERA_FILL_LIGHT_INTENSITY = 6.0;

export interface CameraFillLightProps {
    focusId: string;
    bodyRefs: React.RefObject<Record<string, THREE.Group | null>>;
    maxIntensity?: number;
    color?: string;
}

function updateSpotlightTarget(
    light: THREE.SpotLight,
    targetObj: THREE.Object3D,
    group: THREE.Group,
    cameraPos: THREE.Vector3,
    targetPosRef: THREE.Vector3
): { dist: number; bodyRadius: number } {
    group.getWorldPosition(targetPosRef);
    targetObj.position.copy(targetPosRef);

    const surfaceMesh = group.userData?.surfaceMesh as THREE.Mesh | undefined;
    let bodyRadius = 2.0;
    if (surfaceMesh?.geometry?.boundingSphere) {
        bodyRadius = surfaceMesh.geometry.boundingSphere.radius;
    }

    const dist = cameraPos.distanceTo(targetPosRef);
    const angularRadius = Math.atan2(bodyRadius * 1.2, Math.max(dist, 0.1));
    light.angle = THREE.MathUtils.clamp(angularRadius, 0.05, Math.PI / 3);
    light.distance = dist + bodyRadius * 0.5;

    return { dist, bodyRadius };
}

export function CameraFillLight({
    focusId,
    bodyRefs,
    maxIntensity = DEFAULT_CAMERA_FILL_LIGHT_INTENSITY,
    color = "#ffffff",
}: CameraFillLightProps) {
    const { camera } = useThree();
    const lightRef = useRef<THREE.SpotLight>(null);
    const targetRef = useRef<THREE.Object3D>(null);
    const targetPos = useRef(new THREE.Vector3());

    const isInitialBody = focusId !== "home" && focusId !== "sun" && focusId !== "asteroid-belt";
    const activeTargetId = useRef<string | null>(isInitialBody ? focusId : null);
    const pendingTargetId = useRef<string | null>(null);
    const prevFocusId = useRef(focusId);
    const departureIntensity = useRef(0);
    const transitionPhase = useRef<"idle" | "fade-in" | "fade-out" | "crossfade">("idle");
    const transitionElapsed = useRef(0);

    useEffect(() => {
        if (lightRef.current && targetRef.current) {
            lightRef.current.target = targetRef.current;
        }
    }, []);

    useFrame((_, delta) => {
        if (!lightRef.current || !targetRef.current) return;

        if (lightRef.current.target !== targetRef.current) {
            lightRef.current.target = targetRef.current;
        }

        lightRef.current.position.copy(camera.position);

        const isMobile = typeof window !== "undefined" && window.innerWidth <= 1280;
        const config = getCameraDistanceConfig(isMobile);
        const baseDist = Math.hypot(config.orbitRadial, config.orbitHeight);

        if (focusId !== prevFocusId.current) {
            prevFocusId.current = focusId;
            transitionElapsed.current = 0;
            departureIntensity.current = lightRef.current.intensity;

            const isNextABody = focusId !== "home" && focusId !== "sun" && focusId !== "asteroid-belt";
            const nextBodyId = isNextABody ? focusId : null;

            if (activeTargetId.current && !nextBodyId) {
                transitionPhase.current = "fade-out";
                pendingTargetId.current = null;
            } else if (!activeTargetId.current && nextBodyId) {
                activeTargetId.current = nextBodyId;
                transitionPhase.current = "fade-in";
                pendingTargetId.current = null;
            } else if (activeTargetId.current && nextBodyId && activeTargetId.current !== nextBodyId) {
                pendingTargetId.current = nextBodyId;
                transitionPhase.current = "crossfade";
            } else {
                activeTargetId.current = nextBodyId;
                transitionPhase.current = "idle";
                pendingTargetId.current = null;
            }
        }

        transitionElapsed.current += delta;

        if (transitionPhase.current === "crossfade") {
            const halfDuration = 0.36;
            if (transitionElapsed.current < halfDuration) {
                const currentId = activeTargetId.current;
                const oldGroup = currentId ? bodyRefs.current?.[currentId] : null;
                if (oldGroup) {
                    updateSpotlightTarget(
                        lightRef.current,
                        targetRef.current,
                        oldGroup,
                        camera.position,
                        targetPos.current
                    );
                    const t = Math.min(transitionElapsed.current / halfDuration, 1.0);
                    const visibility = 1.0 - t * t * (3 - 2 * t);
                    lightRef.current.intensity = departureIntensity.current * visibility;
                } else {
                    lightRef.current.intensity = 0;
                }
                return;
            }

            if (pendingTargetId.current) {
                activeTargetId.current = pendingTargetId.current;
                pendingTargetId.current = null;
            }

            const currentId = activeTargetId.current;
            const newGroup = currentId ? bodyRefs.current?.[currentId] : null;
            if (newGroup) {
                const { dist } = updateSpotlightTarget(
                    lightRef.current,
                    targetRef.current,
                    newGroup,
                    camera.position,
                    targetPos.current
                );
                const effectiveDist = Math.min(dist, baseDist * 1.5);
                const compFactor = Math.max(effectiveDist / baseDist, 0.2);
                const targetIntensity = maxIntensity * (compFactor * compFactor);
                const t = Math.min((transitionElapsed.current - halfDuration) / halfDuration, 1.0);
                const visibility = t * t * (3 - 2 * t);
                lightRef.current.intensity = targetIntensity * visibility;

                if (t >= 1.0) {
                    transitionPhase.current = "idle";
                }
            } else {
                lightRef.current.intensity = 0;
                transitionPhase.current = "idle";
            }
            return;
        }

        if (transitionPhase.current === "fade-in") {
            const currentId = activeTargetId.current;
            const targetGroup = currentId ? bodyRefs.current?.[currentId] : null;
            if (targetGroup) {
                const { dist } = updateSpotlightTarget(
                    lightRef.current,
                    targetRef.current,
                    targetGroup,
                    camera.position,
                    targetPos.current
                );
                const effectiveDist = Math.min(dist, baseDist * 1.5);
                const compFactor = Math.max(effectiveDist / baseDist, 0.2);
                const targetIntensity = maxIntensity * (compFactor * compFactor);
                const t = Math.min(transitionElapsed.current / 0.72, 1.0);
                const visibility = t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2;
                lightRef.current.intensity = targetIntensity * visibility;

                if (t >= 1.0) {
                    transitionPhase.current = "idle";
                }
                return;
            }
            transitionPhase.current = "idle";
        }

        if (transitionPhase.current === "fade-out") {
            const currentId = activeTargetId.current;
            const targetGroup = currentId ? bodyRefs.current?.[currentId] : null;
            if (targetGroup) {
                updateSpotlightTarget(
                    lightRef.current,
                    targetRef.current,
                    targetGroup,
                    camera.position,
                    targetPos.current
                );
                const t = Math.min(transitionElapsed.current / 0.45, 1.0);
                const visibility = 1.0 - (t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2);
                lightRef.current.intensity = departureIntensity.current * visibility;

                if (t >= 1.0) {
                    activeTargetId.current = null;
                    transitionPhase.current = "idle";
                    lightRef.current.intensity = 0;
                    lightRef.current.distance = 0;
                }
                return;
            }
            activeTargetId.current = null;
            transitionPhase.current = "idle";
            lightRef.current.intensity = 0;
            lightRef.current.distance = 0;
            return;
        }

        const currentId = activeTargetId.current;
        const targetGroup = currentId ? bodyRefs.current?.[currentId] : null;

        if (targetGroup && focusId === currentId) {
            const { dist } = updateSpotlightTarget(
                lightRef.current,
                targetRef.current,
                targetGroup,
                camera.position,
                targetPos.current
            );
            const compFactor = Math.max(dist / baseDist, 0.2);
            lightRef.current.intensity = maxIntensity * (compFactor * compFactor);
            return;
        }

        activeTargetId.current = null;
        lightRef.current.intensity = 0;
        lightRef.current.distance = 0;
    });

    const effectiveColor = useMemo(() => {
        return new THREE.Color(color).lerp(new THREE.Color("#ffffff"), 0.55);
    }, [color]);

    return (
        <>
            <object3D ref={targetRef} />
            <spotLight
                ref={lightRef}
                color={effectiveColor}
                intensity={0}
                distance={0}
                decay={0}
                penumbra={0.2}
                angle={Math.PI / 6}
            />
        </>
    );
}

export default CameraFillLight;
