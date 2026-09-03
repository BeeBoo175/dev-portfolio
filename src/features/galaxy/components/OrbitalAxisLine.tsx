import { useMemo, useEffect, useState, memo } from "react";
import * as THREE from "three";
import { useTheme } from "../../theme";
import { getEffectiveAccentThreeColor } from "../utils/colorUtils";

interface OrbitalAxisLineProps {
    radius: number;
    color?: string;
    opacity?: number;
}

export const OrbitalAxisLine = memo(function OrbitalAxisLine({
    radius,
    color = "#38bdf8",
    opacity = 0.45,
}: OrbitalAxisLineProps) {
    const { isLight } = useTheme();

    const effectiveColor = useMemo(() => {
        return getEffectiveAccentThreeColor(color, isLight);
    }, [color, isLight]);

    const effectiveOpacity = isLight ? Math.max(opacity * 2.0, 0.9) : opacity;

    const geometry = useMemo(() => {
        const length = radius * 1.9;
        const points = [
            new THREE.Vector3(0, -length, 0),
            new THREE.Vector3(0, length, 0),
        ];
        return new THREE.BufferGeometry().setFromPoints(points);
    }, [radius]);

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

    const lineObject = useMemo(() => new THREE.Line(geometry, material), [geometry, material]);

    return (
        <primitive object={lineObject} />
    );
});

OrbitalAxisLine.displayName = "OrbitalAxisLine";

export default OrbitalAxisLine;
