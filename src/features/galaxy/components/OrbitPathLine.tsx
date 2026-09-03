import { useMemo, useEffect, useState, memo } from "react";
import * as THREE from "three";
import { useTheme } from "../../theme";
import { getEffectiveAccentThreeColor } from "../utils/colorUtils";

interface OrbitPathLineProps {
    radius: number;
    color?: string;
    opacity?: number;
    segments?: number;
}

export const OrbitPathLine = memo(function OrbitPathLine({
    radius,
    color = "#38bdf8",
    opacity = 0.25,
    segments = 128,
}: OrbitPathLineProps) {
    const { isLight } = useTheme();

    const effectiveColor = useMemo(() => {
        return getEffectiveAccentThreeColor(color, isLight);
    }, [color, isLight]);

    const effectiveOpacity = isLight ? Math.max(opacity * 2.2, 0.75) : opacity;

    const geometry = useMemo(() => {
        const points: THREE.Vector3[] = [];
        for (let i = 0; i <= segments; i++) {
            const theta = (i / segments) * Math.PI * 2;
            points.push(new THREE.Vector3(Math.cos(theta) * radius, 0, Math.sin(theta) * radius));
        }
        return new THREE.BufferGeometry().setFromPoints(points);
    }, [radius, segments]);

    const [material] = useState(() => new THREE.LineBasicMaterial({
        color: effectiveColor,
        transparent: true,
        opacity: effectiveOpacity,
        depthWrite: false,
    }));

    useEffect(() => {
        material.color.copy(effectiveColor);
        material.opacity = effectiveOpacity;
    }, [material, effectiveColor, effectiveOpacity]);

    useEffect(() => {
        return () => {
            geometry.dispose();
            material.dispose();
        };
    }, [geometry, material]);

    return (
        <lineLoop geometry={geometry} material={material} />
    );
});

OrbitPathLine.displayName = "OrbitPathLine";

export default OrbitPathLine;
