import { useMemo, useRef, useEffect } from "react";
import { useFrame, useThree } from "@react-three/fiber";
import * as THREE from "three";

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
): number {
    group.getWorldPosition(targetPosRef);
    targetObj.position.copy(targetPosRef);

    const surfaceMesh = group.userData?.surfaceMesh as THREE.Mesh | undefined;
    let bodyRadius = 2.0;
    if (surfaceMesh?.geometry?.boundingSphere) {
        bodyRadius = surfaceMesh.geometry.boundingSphere.radius;
    }

    const dist = cameraPos.distanceTo(targetPosRef);
    const angularRadius = Math.atan2(bodyRadius * 1.15, Math.max(dist, 0.1));
    light.angle = THREE.MathUtils.clamp(angularRadius, 0.05, Math.PI / 3);
    light.distance = dist + bodyRadius * 0.2;

    return dist;
}

export function CameraFillLight({
    focusId,
    bodyRefs,
    maxIntensity = 3.2,
    color = "#ffffff",
}: CameraFillLightProps) {
    const { camera } = useThree();
    const lightRef = useRef<THREE.SpotLight>(null);
    const targetRef = useRef<THREE.Object3D>(null);
    const targetPos = useRef(new THREE.Vector3());
    const prevFocusId = useRef(focusId);
    const activeTargetId = useRef(focusId);
    const isTransitioning = useRef(false);
    const transitionElapsed = useRef(0);
    const transitionStartDist = useRef(0);

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

        if (focusId !== prevFocusId.current) {
            prevFocusId.current = focusId;
            isTransitioning.current = true;
            transitionElapsed.current = 0;
            const newGroup = bodyRefs.current[focusId];
            if (newGroup && focusId !== "home" && focusId !== "sun") {
                newGroup.getWorldPosition(targetPos.current);
                transitionStartDist.current = camera.position.distanceTo(targetPos.current);
            } else {
                transitionStartDist.current = 0;
            }
        }

        const newTargetIsBody = focusId !== "home" && focusId !== "sun";
        const newGroup = bodyRefs.current[focusId];

        if (isTransitioning.current) {
            transitionElapsed.current += delta;
            const timeProgress = Math.min(transitionElapsed.current / 0.72, 1.0);

            if (activeTargetId.current !== focusId) {
                const oldGroup = bodyRefs.current[activeTargetId.current];
                if (oldGroup && activeTargetId.current !== "home" && activeTargetId.current !== "sun") {
                    updateSpotlightTarget(lightRef.current, targetRef.current, oldGroup, camera.position, targetPos.current);

                    lightRef.current.intensity = THREE.MathUtils.damp(
                        lightRef.current.intensity,
                        0,
                        12.0,
                        delta
                    );

                    if (lightRef.current.intensity < 0.02 || timeProgress > 0.3) {
                        activeTargetId.current = focusId;
                        lightRef.current.intensity = 0;
                    }
                } else {
                    activeTargetId.current = focusId;
                    lightRef.current.intensity = 0;
                }
                return;
            }

            if (newGroup && newTargetIsBody) {
                const dist = updateSpotlightTarget(lightRef.current, targetRef.current, newGroup, camera.position, targetPos.current);

                const startDist = Math.max(transitionStartDist.current, 15);
                const focusDist = 9.5;
                const distProgress = THREE.MathUtils.clamp(
                    1 - (dist - focusDist) / Math.max(startDist - focusDist, 1),
                    0,
                    1
                );
                const progress = Math.max(distProgress, timeProgress);
                const easedProgress = progress * progress * (3 - 2 * progress);
                const targetIntensity = maxIntensity * easedProgress;

                lightRef.current.intensity = THREE.MathUtils.damp(
                    lightRef.current.intensity,
                    targetIntensity,
                    6.0,
                    delta
                );

                if (timeProgress >= 1.0) {
                    isTransitioning.current = false;
                }
                return;
            }

            isTransitioning.current = false;
            return;
        }

        if (newGroup && newTargetIsBody) {
            activeTargetId.current = focusId;
            const dist = updateSpotlightTarget(lightRef.current, targetRef.current, newGroup, camera.position, targetPos.current);

            const baseDist = 9.5;
            const distanceCompFactor = Math.max(dist / baseDist, 0.2);
            lightRef.current.intensity = maxIntensity * (distanceCompFactor * distanceCompFactor);
            return;
        }

        activeTargetId.current = focusId;
        isTransitioning.current = false;
        lightRef.current.distance = 0;
        lightRef.current.intensity = THREE.MathUtils.damp(
            lightRef.current.intensity,
            0,
            8.0,
            delta
        );
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
