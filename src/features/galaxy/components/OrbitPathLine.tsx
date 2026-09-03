import { useMemo, useEffect } from "react";
import * as THREE from "three";
import { useTheme } from "../../theme";

interface OrbitPathLineProps {
    radius: number;
    color?: string;
    opacity?: number;
    segments?: number;
}

export function OrbitPathLine({
    radius,
    color = "#38bdf8",
    opacity = 0.25,
    segments = 128,
}: OrbitPathLineProps) {
    const { isLight } = useTheme();

    const effectiveColor = useMemo(() => {
        if (isLight) {
            return new THREE.Color(color).lerp(new THREE.Color("#0284c7"), 0.45);
        }
        return new THREE.Color(color);
    }, [color, isLight]);

    const effectiveOpacity = isLight ? Math.max(opacity * 1.5, 0.45) : opacity;

    const lineLoopMesh = useMemo(() => {
        const points: THREE.Vector3[] = [];
        for (let i = 0; i <= segments; i++) {
            const theta = (i / segments) * Math.PI * 2;
            points.push(new THREE.Vector3(Math.cos(theta) * radius, 0, Math.sin(theta) * radius));
        }
        const geometry = new THREE.BufferGeometry().setFromPoints(points);
        const material = new THREE.LineBasicMaterial({
            color: effectiveColor,
            transparent: true,
            opacity: effectiveOpacity,
            depthWrite: false,
        });
        return new THREE.LineLoop(geometry, material);
    }, [radius, effectiveColor, effectiveOpacity, segments]);

    useEffect(() => {
        return () => {
            lineLoopMesh.geometry.dispose();
            if (Array.isArray(lineLoopMesh.material)) {
                lineLoopMesh.material.forEach((m) => m.dispose());
            } else {
                lineLoopMesh.material.dispose();
            }
        };
    }, [lineLoopMesh]);

    return <primitive object={lineLoopMesh} />;
}

export default OrbitPathLine;
