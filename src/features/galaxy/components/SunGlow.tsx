import { useMemo, useRef } from "react";
import { useFrame } from "@react-three/fiber";
import * as THREE from "three";
import { useTheme } from "../../theme";
import { getSunGlowDataTexture } from "../utils/textureUtils";

interface SunGlowProps {
    radius: number;
    color?: string;
    glowIntensity?: number;
    visible?: boolean;
}

export function SunGlow({ radius, color = "#ffd76b", glowIntensity = 1.0, visible = true }: SunGlowProps) {
    const { isLight } = useTheme();
    const innerGlowRef = useRef<THREE.Mesh>(null);
    const outerGlowRef = useRef<THREE.Mesh>(null);

    const brightColor = useMemo(() => new THREE.Color(isLight ? color : "#fffbeb"), [isLight, color]);
    const warmOrangeColor = useMemo(() => new THREE.Color(color), [color]);
    const glowTexture = useMemo(() => getSunGlowDataTexture(isLight), [isLight]);

    const worldPos = useRef(new THREE.Vector3());

    useFrame((state) => {
        if (!visible) return;
        const time = state.clock.getElapsedTime();
        const pulse = Math.sin(time * 1.25) * 0.02;

        if (innerGlowRef.current) {
            const s = 1.0 + pulse;
            innerGlowRef.current.scale.set(s, s, s);
            innerGlowRef.current.getWorldPosition(worldPos.current);
            innerGlowRef.current.lookAt(state.camera.position);
        }

        if (outerGlowRef.current) {
            const s = 1.0 - pulse * 0.5;
            outerGlowRef.current.scale.set(s, s, s);
            outerGlowRef.current.lookAt(state.camera.position);
        }
    });

    return (
        <group visible={visible}>
            <mesh ref={innerGlowRef}>
                <planeGeometry args={[radius * 2.8, radius * 2.8]} />
                <meshBasicMaterial
                    map={glowTexture}
                    color={brightColor}
                    transparent
                    opacity={(isLight ? 0.45 : 0.65) * glowIntensity}
                    blending={isLight ? THREE.NormalBlending : THREE.AdditiveBlending}
                    depthWrite={false}
                />
            </mesh>

            <mesh ref={outerGlowRef}>
                <planeGeometry args={[radius * 4.4, radius * 4.4]} />
                <meshBasicMaterial
                    map={glowTexture}
                    color={warmOrangeColor}
                    transparent
                    opacity={(isLight ? 0.3 : 0.4) * glowIntensity}
                    blending={isLight ? THREE.NormalBlending : THREE.AdditiveBlending}
                    depthWrite={false}
                />
            </mesh>
        </group>
    );
}

export default SunGlow;
