import { useMemo, useEffect, useRef } from "react";
import { useFrame } from "@react-three/fiber";
import * as THREE from "three";

export interface PlanetLabelProps {
    text: string;
    radius: number;
    color?: string;
    isSelected?: boolean;
    isHovered?: boolean;
}

export function PlanetLabel({
    text,
    radius,
    color = "#38bdf8",
    isSelected = false,
    isHovered = false,
}: PlanetLabelProps) {
    const groupRef = useRef<THREE.Group>(null);
    const spriteRef = useRef<THREE.Sprite>(null);

    const texture = useMemo(() => {
        const canvas = document.createElement("canvas");
        canvas.width = 512;
        canvas.height = 128;
        const ctx = canvas.getContext("2d");
        if (ctx) {
            ctx.clearRect(0, 0, 512, 128);

            ctx.fillStyle = "rgba(10, 15, 29, 0.72)";
            ctx.strokeStyle = "rgba(255, 255, 255, 0.4)";
            ctx.lineWidth = 4;

            const x = 32, y = 20, w = 448, h = 88, r = 24;
            ctx.beginPath();
            ctx.moveTo(x + r, y);
            ctx.lineTo(x + w - r, y);
            ctx.quadraticCurveTo(x + w, y, x + w, y + r);
            ctx.lineTo(x + w, y + h - r);
            ctx.quadraticCurveTo(x + w, y + h, x + w - r, y + h);
            ctx.lineTo(x + r, y + h);
            ctx.quadraticCurveTo(x, y + h, x, y + h - r);
            ctx.lineTo(x, y + r);
            ctx.quadraticCurveTo(x, y, x + r, y);
            ctx.closePath();
            ctx.fill();
            ctx.stroke();

            ctx.fillStyle = "#38bdf8";
            ctx.beginPath();
            ctx.arc(x + 36, y + h / 2, 8, 0, Math.PI * 2);
            ctx.fill();

            ctx.font = "600 36px 'Space Grotesk', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, monospace";
            ctx.textAlign = "left";
            ctx.textBaseline = "middle";
            ctx.fillStyle = "#f8fafc";
            ctx.letterSpacing = "4px";
            ctx.fillText(text.toUpperCase(), x + 62, y + h / 2 + 2);
        }
        const tex = new THREE.CanvasTexture(canvas);
        tex.minFilter = THREE.LinearFilter;
        tex.magFilter = THREE.LinearFilter;
        return tex;
    }, [text]);

    useEffect(() => {
        return () => {
            texture.dispose();
        };
    }, [texture]);

    const stemHeight = radius + 0.85;
    const stemGeom = useMemo(() => {
        const points = [
            new THREE.Vector3(0, 0, 0),
            new THREE.Vector3(0, stemHeight, 0),
        ];
        return new THREE.BufferGeometry().setFromPoints(points);
    }, [stemHeight]);

    useEffect(() => {
        return () => {
            stemGeom.dispose();
        };
    }, [stemGeom]);

    const lineObj = useMemo(() => {
        const mat = new THREE.LineBasicMaterial({
            transparent: true,
            opacity: 0.25,
            depthTest: false,
            depthWrite: false,
        });
        return new THREE.Line(stemGeom, mat);
    }, [stemGeom]);

    useEffect(() => {
        return () => {
            if (Array.isArray(lineObj.material)) {
                lineObj.material.forEach((m) => m.dispose());
            } else {
                lineObj.material.dispose();
            }
        };
    }, [lineObj]);

    const activeColor = useMemo(() => new THREE.Color(color), [color]);
    const idleColor = useMemo(() => new THREE.Color("#cbd5e1"), []);
    const worldPos = useRef(new THREE.Vector3());

    useFrame((state, delta) => {
        const targetOpacity = isSelected ? 0.95 : isHovered ? 0.88 : 0.45;
        const targetScaleMultiplier = isSelected ? 1.15 : isHovered ? 1.05 : 0.95;

        if (spriteRef.current) {
            spriteRef.current.getWorldPosition(worldPos.current);
            const dist = state.camera.position.distanceTo(worldPos.current);

            const distanceScale = THREE.MathUtils.clamp(dist * 0.07, 0.9, 5.0);

            const mat = spriteRef.current.material as THREE.SpriteMaterial;
            mat.opacity = THREE.MathUtils.damp(mat.opacity, targetOpacity, 10, delta);
            mat.color.lerp(isSelected || isHovered ? activeColor : idleColor, 0.15);

            const width = targetScaleMultiplier * distanceScale * 3.2;
            const height = targetScaleMultiplier * distanceScale * 0.8;

            spriteRef.current.scale.lerp(
                new THREE.Vector3(width, height, 1),
                0.2
            );
        }

        const lineMat = lineObj.material as THREE.LineBasicMaterial;
        const lineTargetOpacity = isSelected ? 0.6 : isHovered ? 0.45 : 0.2;
        lineMat.opacity = THREE.MathUtils.damp(lineMat.opacity, lineTargetOpacity, 10, delta);
        lineMat.color.lerp(isSelected || isHovered ? activeColor : idleColor, 0.15);
    });

    return (
        <group ref={groupRef}>
            <primitive object={lineObj} renderOrder={998} />
            <sprite
                ref={spriteRef}
                position={[0, stemHeight + 0.35, 0]}
                scale={[3.2, 0.8, 1]}
                renderOrder={999}
            >
                <spriteMaterial
                    map={texture}
                    transparent
                    opacity={0.45}
                    depthTest={false}
                    depthWrite={false}
                />
            </sprite>
        </group>
    );
}

export default PlanetLabel;
