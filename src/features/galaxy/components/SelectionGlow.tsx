import { useMemo, useRef, useEffect } from "react";
import { useFrame } from "@react-three/fiber";
import * as THREE from "three";
import { useGalaxyVisuals } from "../store";

export interface SelectionGlowProps {
    radius: number;
    color?: string;
    label?: string;
    isSelected?: boolean;
    isHovered?: boolean;
    showReticle?: boolean;
    showLabel?: boolean;
}

function createBracketsGeometry(radius: number, cornerSize: number) {
    const r = radius * 1.35;
    const s = cornerSize;
    const points: THREE.Vector3[] = [];

    points.push(new THREE.Vector3(-r, r - s, 0));
    points.push(new THREE.Vector3(-r, r, 0));
    points.push(new THREE.Vector3(-r + s, r, 0));

    points.push(new THREE.Vector3(r - s, r, 0));
    points.push(new THREE.Vector3(r, r, 0));
    points.push(new THREE.Vector3(r, r - s, 0));

    points.push(new THREE.Vector3(r, -r + s, 0));
    points.push(new THREE.Vector3(r, -r, 0));
    points.push(new THREE.Vector3(r - s, -r, 0));

    points.push(new THREE.Vector3(-r + s, -r, 0));
    points.push(new THREE.Vector3(-r, -r, 0));
    points.push(new THREE.Vector3(-r, -r + s, 0));

    const geom = new THREE.BufferGeometry().setFromPoints(points);
    return geom;
}

function createDottedRingGeometry(radius: number, segments = 32) {
    const r = radius * 1.25;
    const points: THREE.Vector3[] = [];
    for (let i = 0; i < segments; i++) {
        const theta = (i / segments) * Math.PI * 2;
        points.push(new THREE.Vector3(Math.cos(theta) * r, Math.sin(theta) * r, 0));
    }
    const geom = new THREE.BufferGeometry().setFromPoints(points);
    return geom;
}

export function SelectionGlow({
    radius,
    color = "#38bdf8",
    label,
    isSelected = false,
    isHovered = false,
    showReticle,
    showLabel,
}: SelectionGlowProps) {
    const visuals = useGalaxyVisuals();
    const effectiveShowReticle = showReticle ?? (visuals.showSelectionGlow !== false);
    const effectiveShowLabel = showLabel ?? (visuals.showPlanetNames !== false);

    const groupRef = useRef<THREE.Group>(null);
    const bracketsRef = useRef<THREE.LineSegments>(null);
    const dotsRef = useRef<THREE.Points>(null);
    const labelSpriteRef = useRef<THREE.Sprite>(null);
    const reticleRotation = useRef(0);

    const cornerSize = Math.max(0.06, Math.min(0.28, radius * 0.28));
    const bracketGeom = useMemo(() => createBracketsGeometry(radius, cornerSize), [radius, cornerSize]);
    const dottedGeom = useMemo(() => createDottedRingGeometry(radius, 28), [radius]);


    const lineColor = useMemo(() => new THREE.Color(color), [color]);
    const idleTextColor = useMemo(() => new THREE.Color("#94a3b8"), []);

    const labelTexture = useMemo(() => {
        if (!label) return null;
        const canvas = document.createElement("canvas");
        canvas.width = 1024;
        canvas.height = 256;
        const ctx = canvas.getContext("2d");
        if (ctx) {
            ctx.clearRect(0, 0, 1024, 256);

            ctx.font = "600 72px 'Space Grotesk', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, monospace";
            ctx.textAlign = "center";
            ctx.textBaseline = "middle";

            ctx.shadowColor = "rgba(0, 0, 0, 0.95)";
            ctx.shadowBlur = 12;
            ctx.shadowOffsetX = 0;
            ctx.shadowOffsetY = 2;

            ctx.fillStyle = "#ffffff";
            ctx.letterSpacing = "6px";
            ctx.fillText(label.toUpperCase(), 512, 128);
        }
        const tex = new THREE.CanvasTexture(canvas);
        tex.minFilter = THREE.LinearFilter;
        tex.magFilter = THREE.LinearFilter;
        return tex;
    }, [label]);

    useEffect(() => {
        return () => {
            bracketGeom.dispose();
            dottedGeom.dispose();
            labelTexture?.dispose();
        };
    }, [bracketGeom, dottedGeom, labelTexture]);

    const worldPos = useRef(new THREE.Vector3());

    useFrame((state, delta) => {
        if (!groupRef.current) return;

        groupRef.current.lookAt(state.camera.position);

        const targetBracketOpacity = effectiveShowReticle
            ? (isSelected ? 0.9 : isHovered ? 0.65 : 0)
            : 0;

        if (bracketsRef.current) {
            const mat = bracketsRef.current.material as THREE.LineBasicMaterial;
            mat.opacity = THREE.MathUtils.damp(mat.opacity, targetBracketOpacity, 6, delta);
            bracketsRef.current.visible = mat.opacity > 0.01;

            if (isSelected) {
                const pulse = 1 + Math.sin(state.clock.getElapsedTime() * 4) * 0.03;
                bracketsRef.current.scale.set(pulse, pulse, 1);
            } else if (isHovered) {
                bracketsRef.current.scale.set(1.02, 1.02, 1);
            } else {
                bracketsRef.current.scale.set(1.08, 1.08, 1);
            }
        }

        if (dotsRef.current) {
            const dotMat = dotsRef.current.material as THREE.PointsMaterial;
            const dotTargetOpacity = effectiveShowReticle
                ? (isSelected ? 0.75 : isHovered ? 0.45 : 0)
                : 0;
            dotMat.opacity = THREE.MathUtils.damp(dotMat.opacity, dotTargetOpacity, 6, delta);
            dotsRef.current.visible = dotMat.opacity > 0.01;

            reticleRotation.current += (isSelected ? 0.6 : 0.2) * delta;
            dotsRef.current.rotation.z = reticleRotation.current;
        }

        if (labelSpriteRef.current) {
            labelSpriteRef.current.getWorldPosition(worldPos.current);
            const dist = state.camera.position.distanceTo(worldPos.current);

            const distanceScale = dist * 0.09;
            const labelMat = labelSpriteRef.current.material as THREE.SpriteMaterial;

            const closeFocusFade = isSelected ? THREE.MathUtils.clamp((dist - 10.5) / 12.0, 0, 1) : 1;
            const targetBaseOpacity = effectiveShowLabel
                ? (isSelected ? 0.95 : isHovered ? 0.85 : 0.4)
                : 0;
            const labelTargetOpacity = targetBaseOpacity * closeFocusFade;

            labelMat.opacity = isSelected ? labelTargetOpacity : THREE.MathUtils.damp(labelMat.opacity, labelTargetOpacity, 10, delta);
            labelSpriteRef.current.visible = labelMat.opacity > 0.005;
            labelMat.color.lerp(isSelected || isHovered ? lineColor : idleTextColor, 0.2);

            const cameraDist = state.camera.position.length();
            const zoomInFactor = THREE.MathUtils.clamp((60 - cameraDist) / 38, 0, 1);
            const ambientScaleMultiplier = 1.0 + 0.5 * zoomInFactor;

            const interactionMultiplier = isSelected ? 1.15 : isHovered ? 1.05 : 1.0;
            const width = interactionMultiplier * ambientScaleMultiplier * distanceScale * 1.8;
            const height = width * 0.25;
            labelSpriteRef.current.scale.set(width, height, 1);

            const targetYOffset = (isSelected || isHovered) ? 1.15 : (0.75 + 0.3 * zoomInFactor);
            const targetY = -(radius * 1.35 + targetYOffset);
            labelSpriteRef.current.position.y = THREE.MathUtils.damp(labelSpriteRef.current.position.y, targetY, 8, delta);
        }
    });

    const labelY = -(radius * 1.35 + 0.75);

    return (
        <group ref={groupRef} renderOrder={998}>
            <lineSegments ref={bracketsRef} geometry={bracketGeom} renderOrder={998}>
                <lineBasicMaterial
                    color={lineColor}
                    transparent
                    opacity={0}
                    linewidth={1}
                    depthTest={false}
                    depthWrite={false}
                />
            </lineSegments>

            <points ref={dotsRef} geometry={dottedGeom} renderOrder={998}>
                <pointsMaterial
                    color={lineColor}
                    size={0.06}
                    transparent
                    opacity={0}
                    sizeAttenuation
                    depthTest={false}
                    depthWrite={false}
                />
            </points>

            {labelTexture && (
                <sprite
                    ref={labelSpriteRef}
                    position={[0, labelY, 0]}
                    scale={[3.6, 0.9, 1]}
                    renderOrder={999}
                >
                    <spriteMaterial
                        map={labelTexture}
                        color={idleTextColor}
                        transparent
                        opacity={0.35}
                        depthTest={false}
                        depthWrite={false}
                    />
                </sprite>
            )}
        </group>
    );
}

export default SelectionGlow;
