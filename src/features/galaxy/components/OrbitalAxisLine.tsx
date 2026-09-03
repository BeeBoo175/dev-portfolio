import { useMemo, useEffect } from "react";
import * as THREE from "three";
import { useTheme } from "../../theme";

interface OrbitalAxisLineProps {
    radius: number;
    color?: string;
    opacity?: number;
}

export function OrbitalAxisLine({
    radius,
    color = "#38bdf8",
    opacity = 0.45,
}: OrbitalAxisLineProps) {
    const { isLight } = useTheme();

    const effectiveColor = useMemo(() => {
        if (isLight) {
            return new THREE.Color(color).lerp(new THREE.Color("#0284c7"), 0.45);
        }
        return new THREE.Color(color);
    }, [color, isLight]);

    const effectiveOpacity = isLight ? Math.max(opacity * 1.4, 0.65) : opacity;

    const lineMesh = useMemo(() => {
        const length = radius * 1.6;
        const points = [
            new THREE.Vector3(0, -length, 0),
            new THREE.Vector3(0, length, 0),
        ];
        const geometry = new THREE.BufferGeometry().setFromPoints(points);
        const material = new THREE.LineBasicMaterial({
            color: effectiveColor,
            transparent: true,
            opacity: effectiveOpacity,
            depthWrite: false,
        });
        return new THREE.Line(geometry, material);
    }, [radius, effectiveColor, effectiveOpacity]);

    useEffect(() => {
        return () => {
            lineMesh.geometry.dispose();
            if (Array.isArray(lineMesh.material)) {
                lineMesh.material.forEach((m) => m.dispose());
            } else {
                lineMesh.material.dispose();
            }
        };
    }, [lineMesh]);

    return <primitive object={lineMesh} />;
}

export default OrbitalAxisLine;
