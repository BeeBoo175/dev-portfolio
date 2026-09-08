import { useMemo, useRef } from "react";
import { useFrame } from "@react-three/fiber";
import * as THREE from "three";
import { useTheme } from "../../theme";

interface SunGlowProps {
    radius: number;
    color?: string;
    glowIntensity?: number;
    visible?: boolean;
}

const _sunGlowTextureCache = new Map<string, THREE.CanvasTexture>();

function getSunGlowTexture(isLight: boolean): THREE.CanvasTexture {
    const key = isLight ? "light" : "dark";
    const cached = _sunGlowTextureCache.get(key);
    if (cached) return cached;

    const canvas = document.createElement("canvas");
    canvas.width = 128;
    canvas.height = 128;
    const ctx = canvas.getContext("2d");
    if (ctx) {
        const gradient = ctx.createRadialGradient(64, 64, 0, 64, 64, 64);
        if (isLight) {
            gradient.addColorStop(0, "rgba(2, 132, 199, 0.2)");
            gradient.addColorStop(0.35, "rgba(2, 132, 199, 0.12)");
            gradient.addColorStop(0.65, "rgba(3, 105, 161, 0.05)");
            gradient.addColorStop(0.85, "rgba(3, 105, 161, 0.02)");
            gradient.addColorStop(1, "rgba(3, 105, 161, 0)");
        } else {
            gradient.addColorStop(0, "rgba(255, 255, 255, 1)");
            gradient.addColorStop(0.25, "rgba(255, 251, 235, 0.85)");
            gradient.addColorStop(0.55, "rgba(255, 215, 107, 0.35)");
            gradient.addColorStop(0.8, "rgba(245, 158, 11, 0.12)");
            gradient.addColorStop(1, "rgba(245, 158, 11, 0)");
        }
        ctx.fillStyle = gradient;
        ctx.fillRect(0, 0, 128, 128);
    }
    const tex = new THREE.CanvasTexture(canvas);
    _sunGlowTextureCache.set(key, tex);
    return tex;
}

export function SunGlow({ radius, color = "#ffd76b", glowIntensity = 1.0, visible = true }: SunGlowProps) {
    const { isLight } = useTheme();
    const innerGlowRef = useRef<THREE.Mesh>(null);
    const outerGlowRef = useRef<THREE.Mesh>(null);

    const brightColor = useMemo(() => new THREE.Color(isLight ? color : "#fffbeb"), [isLight, color]);
    const warmOrangeColor = useMemo(() => new THREE.Color(color), [color]);
    const glowTexture = useMemo(() => getSunGlowTexture(isLight), [isLight]);

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
