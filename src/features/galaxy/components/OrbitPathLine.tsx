import { useMemo, useEffect } from "react";
import * as THREE from "three";

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
    const lineLoopMesh = useMemo(() => {
        const points: THREE.Vector3[] = [];
        for (let i = 0; i <= segments; i++) {
            const theta = (i / segments) * Math.PI * 2;
            points.push(new THREE.Vector3(Math.cos(theta) * radius, 0, Math.sin(theta) * radius));
        }
        const geometry = new THREE.BufferGeometry().setFromPoints(points);
        const material = new THREE.LineBasicMaterial({
            color,
            transparent: true,
            opacity,
            depthWrite: false,
        });
        return new THREE.LineLoop(geometry, material);
    }, [radius, color, opacity, segments]);

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
