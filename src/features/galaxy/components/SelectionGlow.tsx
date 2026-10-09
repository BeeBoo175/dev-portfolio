import { useMemo, useRef, useEffect } from "react";
import { useFrame } from "@react-three/fiber";
import * as THREE from "three";
import { useGalaxyVisuals } from "../store";
import { useTheme } from "../../theme";
import { getEffectiveAccentThreeColor } from "../utils/colorUtils";

const _whiteColor = new THREE.Color("#ffffff");
const RETICLE_SCALE = 1.45;
const RETICLE_ARC_STEPS = 18;
const RETICLE_ARC_INSET = 0.32;

export interface SelectionGlowProps {
    radius: number;
    color?: string;
    label?: string;
    isSelected?: boolean;
    isHovered?: boolean;
    showReticle?: boolean;
    showLabel?: boolean;
    /** The screen-space callout names the selected planet, so its 3D label can step aside. */
    hideSelectedLabel?: boolean;
}

const _labelTextureCache = new Map<string, THREE.CanvasTexture>();

const LABEL_FONT = "500 34px 'DM Mono', ui-monospace, Consolas, monospace";

function drawLabel(canvas: HTMLCanvasElement, label: string, isLight: boolean) {
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    const { width, height } = canvas;
    ctx.clearRect(0, 0, width, height);
    ctx.font = LABEL_FONT;
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.letterSpacing = "4px";
    if (isLight) {
        ctx.fillStyle = "#10203f";
    } else {
        ctx.shadowColor = "rgba(0, 0, 0, 0.95)";
        ctx.shadowBlur = 8;
        ctx.shadowOffsetY = 1;
        ctx.fillStyle = "#ffffff";
    }
    ctx.fillText(label.toUpperCase(), width / 2, height / 2);
}

function getLabelTexture(label: string, isLight: boolean): THREE.CanvasTexture {
    const key = `${label}_${isLight ? "light" : "dark"}`;
    const cached = _labelTextureCache.get(key);
    if (cached) return cached;

    const canvas = document.createElement("canvas");
    canvas.width = 512;
    canvas.height = 128;
    drawLabel(canvas, label, isLight);
    const tex = new THREE.CanvasTexture(canvas);
    tex.minFilter = THREE.LinearFilter;
    tex.magFilter = THREE.LinearFilter;
    _labelTextureCache.set(key, tex);
    // redraw once the web font arrives; canvas text never reflows on its own
    document.fonts?.load(LABEL_FONT).then(() => {
        drawLabel(canvas, label, isLight);
        tex.needsUpdate = true;
    });
    return tex;
}

function createReticleGeometry(radius: number) {
    const r = radius * RETICLE_SCALE;
    const tick = radius * 0.1;
    const at = (angle: number, length: number) =>
        new THREE.Vector3(Math.cos(angle) * length, Math.sin(angle) * length, 0);
    const points: THREE.Vector3[] = [];

    for (let quarter = 0; quarter < 4; quarter++) {
        const cardinal = (quarter * Math.PI) / 2;
        const from = cardinal + RETICLE_ARC_INSET;
        const span = Math.PI / 2 - RETICLE_ARC_INSET * 2;
        for (let i = 0; i < RETICLE_ARC_STEPS; i++) {
            points.push(
                at(from + (span * i) / RETICLE_ARC_STEPS, r),
                at(from + (span * (i + 1)) / RETICLE_ARC_STEPS, r)
            );
        }
        points.push(at(cardinal, r - tick), at(cardinal, r + tick));
    }

    return new THREE.BufferGeometry().setFromPoints(points);
}

export function SelectionGlow({
    radius,
    color = "#38bdf8",
    label,
    isSelected = false,
    isHovered = false,
    showReticle,
    showLabel,
    hideSelectedLabel = false,
}: SelectionGlowProps) {
    const { isLight } = useTheme();
    const visuals = useGalaxyVisuals();
    const effectiveShowReticle = showReticle ?? (visuals.showSelectionGlow !== false);
    const effectiveShowLabel = showLabel ?? (visuals.showPlanetNames !== false);

    const groupRef = useRef<THREE.Group>(null);
    const reticleRef = useRef<THREE.LineSegments>(null);
    const labelSpriteRef = useRef<THREE.Sprite>(null);

    const reticleGeom = useMemo(() => createReticleGeometry(radius), [radius]);

    const lineColor = useMemo(() => {
        return getEffectiveAccentThreeColor(color, isLight);
    }, [color, isLight]);
    const reticleColor = isLight ? "#bd3f08" : "#ff7a4d";
    const idleTextColor = useMemo(() => new THREE.Color(isLight ? "#334155" : "#94a3b8"), [isLight]);

    const labelTexture = useMemo(() => {
        if (!label) return null;
        return getLabelTexture(label, isLight);
    }, [label, isLight]);

    useEffect(() => {
        return () => {
            reticleGeom.dispose();
        };
    }, [reticleGeom]);

    const worldPos = useRef(new THREE.Vector3());

    useFrame((state, delta) => {
        if (!groupRef.current) return;

        groupRef.current.lookAt(state.camera.position);

        if (reticleRef.current) {
            const material = reticleRef.current.material as THREE.LineBasicMaterial;
            const targetOpacity = effectiveShowReticle ? (isSelected ? 1.0 : isHovered ? 0.65 : 0) : 0;
            material.opacity = THREE.MathUtils.damp(material.opacity, targetOpacity, 8, delta);
            reticleRef.current.visible = material.opacity > 0.01;
            reticleRef.current.rotation.z += (isSelected ? 0.2 : 0.08) * delta;
        }

        if (labelSpriteRef.current) {
            labelSpriteRef.current.getWorldPosition(worldPos.current);
            const dist = state.camera.position.distanceTo(worldPos.current);

            const distanceScale = dist * 0.09;
            const labelMat = labelSpriteRef.current.material as THREE.SpriteMaterial;

            const closeFocusFade = isSelected ? THREE.MathUtils.clamp((dist - 10.5) / 12.0, 0, 1) : 1;
            const targetBaseOpacity = effectiveShowLabel
                ? (isSelected ? 1.0 : isHovered ? 0.95 : (isLight ? 0.8 : 0.6))
                : 0;
            const labelTargetOpacity = isSelected && hideSelectedLabel ? 0 : targetBaseOpacity * closeFocusFade;

            labelMat.opacity = isSelected ? labelTargetOpacity : THREE.MathUtils.damp(labelMat.opacity, labelTargetOpacity, 10, delta);
            labelSpriteRef.current.visible = labelMat.opacity > 0.005;
            const targetSpriteColor = isSelected || isHovered ? lineColor : (isLight ? _whiteColor : idleTextColor);
            labelMat.color.lerp(targetSpriteColor, 0.2);

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
            <lineSegments ref={reticleRef} geometry={reticleGeom} renderOrder={998}>
                <lineBasicMaterial
                    color={reticleColor}
                    transparent
                    opacity={0}
                    depthTest={false}
                    depthWrite={false}
                />
            </lineSegments>

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
