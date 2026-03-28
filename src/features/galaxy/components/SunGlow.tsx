import { useMemo, useEffect, useRef } from "react";
import { useFrame } from "@react-three/fiber";
import * as THREE from "three";

interface SunGlowProps {
    radius: number;
    color?: string;
}

export function SunGlow({ radius, color = "#ffd76b" }: SunGlowProps) {
    const innerGlowRef = useRef<THREE.Mesh>(null);
    const outerGlowRef = useRef<THREE.Mesh>(null);

    const brightColor = useMemo(() => new THREE.Color("#fffbeb"), []);
    const warmOrangeColor = useMemo(() => new THREE.Color(color), [color]);

    const glowTexture = useMemo(() => {
        const canvas = document.createElement("canvas");
        canvas.width = 128;
        canvas.height = 128;
        const ctx = canvas.getContext("2d");
        if (ctx) {
            const gradient = ctx.createRadialGradient(64, 64, 0, 64, 64, 64);
            gradient.addColorStop(0, "rgba(255, 255, 255, 1)");
            gradient.addColorStop(0.25, "rgba(255, 251, 235, 0.85)");
            gradient.addColorStop(0.55, "rgba(255, 215, 107, 0.35)");
            gradient.addColorStop(0.8, "rgba(245, 158, 11, 0.12)");
            gradient.addColorStop(1, "rgba(245, 158, 11, 0)");
            ctx.fillStyle = gradient;
            ctx.fillRect(0, 0, 128, 128);
        }
        return new THREE.CanvasTexture(canvas);
    }, []);

    useEffect(() => {
        return () => {
            glowTexture.dispose();
        };
    }, [glowTexture]);

    useFrame((state) => {
        const time = state.clock.getElapsedTime();
        const pulse = Math.sin(time * 1.25) * 0.02;

        if (innerGlowRef.current) {
            const s = 1.0 + pulse;
            innerGlowRef.current.scale.set(s, s, s);
            innerGlowRef.current.lookAt(state.camera.position);
        }

        if (outerGlowRef.current) {
            const s = 1.0 - pulse * 0.5;
            outerGlowRef.current.scale.set(s, s, s);
            outerGlowRef.current.lookAt(state.camera.position);
        }
    });

    return (
        <group>
            <mesh ref={innerGlowRef}>
                <planeGeometry args={[radius * 2.8, radius * 2.8]} />
                <meshBasicMaterial
                    map={glowTexture}
                    color={brightColor}
                    transparent
                    opacity={0.65}
                    blending={THREE.AdditiveBlending}
                    depthWrite={false}
                />
            </mesh>

            <mesh ref={outerGlowRef}>
                <planeGeometry args={[radius * 4.4, radius * 4.4]} />
                <meshBasicMaterial
                    map={glowTexture}
                    color={warmOrangeColor}
                    transparent
                    opacity={0.4}
                    blending={THREE.AdditiveBlending}
                    depthWrite={false}
                />
            </mesh>
        </group>
    );
}

export default SunGlow;
