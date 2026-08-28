import { useMemo } from "react";
import * as THREE from "three";

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
    const lineMesh = useMemo(() => {
        const length = radius * 1.6;
        const points = [
            new THREE.Vector3(0, -length, 0),
            new THREE.Vector3(0, length, 0),
        ];
        const geometry = new THREE.BufferGeometry().setFromPoints(points);
        const material = new THREE.LineBasicMaterial({
            color,
            transparent: true,
            opacity,
            depthWrite: false,
        });
        return new THREE.Line(geometry, material);
    }, [radius, color, opacity]);

    return <primitive object={lineMesh} />;
}

export default OrbitalAxisLine;
