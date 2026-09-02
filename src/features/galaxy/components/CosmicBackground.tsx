import { useMemo, useEffect, useRef } from "react";
import { useFrame } from "@react-three/fiber";
import * as THREE from "three";

export interface CosmicBackgroundProps {
    visible?: boolean;
}

const STAR_COUNT = 1400;
const BRIGHT_STAR_COUNT = 75;
const NEBULA_COUNT = 6;
const METEOR_COUNT = 4;
const METEOR_COLORS = ["#38bdf8", "#818cf8", "#fef08a", "#f472b6"];

function seededRandom(seed: number) {
    const x = Math.sin(seed) * 10000;
    return x - Math.floor(x);
}

function generateStarfieldData() {
    const positions = new Float32Array(STAR_COUNT * 3);
    const colors = new Float32Array(STAR_COUNT * 3);
    const phases = new Float32Array(STAR_COUNT);

    const starPalettes = [
        new THREE.Color("#ffffff"),
        new THREE.Color("#e0f2fe"),
        new THREE.Color("#bae6fd"),
        new THREE.Color("#fef08a"),
        new THREE.Color("#fbcfe8"),
        new THREE.Color("#c7d2fe"),
    ];

    for (let i = 0; i < STAR_COUNT; i++) {
        const u = seededRandom(i * 1.37 + 10.1);
        const v = seededRandom(i * 2.73 + 20.2);
        const theta = u * 2.0 * Math.PI;
        const phi = Math.acos(2.0 * v - 1.0);
        const radius = 600 + seededRandom(i * 3.19 + 30.3) * 280;

        const sinPhi = Math.sin(phi);
        const x = radius * sinPhi * Math.cos(theta);
        const y = radius * Math.cos(phi);
        const z = radius * sinPhi * Math.sin(theta);

        positions[i * 3] = x;
        positions[i * 3 + 1] = y;
        positions[i * 3 + 2] = z;

        const paletteIndex = Math.floor(seededRandom(i * 4.91 + 40.4) * starPalettes.length);
        const baseColor = starPalettes[paletteIndex];
        const brightness = 0.55 + seededRandom(i * 5.33 + 50.5) * 0.45;

        colors[i * 3] = baseColor.r * brightness;
        colors[i * 3 + 1] = baseColor.g * brightness;
        colors[i * 3 + 2] = baseColor.b * brightness;

        phases[i] = seededRandom(i * 6.77 + 60.6) * Math.PI * 2;
    }

    return { starPositions: positions, starColors: colors, starPhases: phases };
}

function generateBrightStarData() {
    const positions = new Float32Array(BRIGHT_STAR_COUNT * 3);
    const colors = new Float32Array(BRIGHT_STAR_COUNT * 3);

    const heroPalettes = [
        new THREE.Color("#38bdf8"),
        new THREE.Color("#fbbf24"),
        new THREE.Color("#818cf8"),
        new THREE.Color("#34d399"),
        new THREE.Color("#f472b6"),
        new THREE.Color("#ffffff"),
    ];

    for (let i = 0; i < BRIGHT_STAR_COUNT; i++) {
        const u = seededRandom(i * 7.13 + 100.1);
        const v = seededRandom(i * 8.41 + 200.2);
        const theta = u * 2.0 * Math.PI;
        const phi = Math.acos(2.0 * v - 1.0);
        const radius = 500 + seededRandom(i * 9.87 + 300.3) * 220;

        const sinPhi = Math.sin(phi);
        positions[i * 3] = radius * sinPhi * Math.cos(theta);
        positions[i * 3 + 1] = radius * Math.cos(phi);
        positions[i * 3 + 2] = radius * sinPhi * Math.sin(theta);

        const c = heroPalettes[i % heroPalettes.length];
        colors[i * 3] = c.r;
        colors[i * 3 + 1] = c.g;
        colors[i * 3 + 2] = c.b;
    }

    return { brightPositions: positions, brightColors: colors };
}

const STATIC_STARFIELD_DATA = generateStarfieldData();
const STATIC_BRIGHT_STAR_DATA = generateBrightStarData();

function createCircleTexture(): THREE.CanvasTexture {
    const canvas = document.createElement("canvas");
    canvas.width = 64;
    canvas.height = 64;
    const ctx = canvas.getContext("2d");
    if (ctx) {
        const gradient = ctx.createRadialGradient(32, 32, 0, 32, 32, 32);
        gradient.addColorStop(0, "rgba(255, 255, 255, 1)");
        gradient.addColorStop(0.2, "rgba(255, 255, 255, 0.9)");
        gradient.addColorStop(0.5, "rgba(255, 255, 255, 0.35)");
        gradient.addColorStop(0.8, "rgba(255, 255, 255, 0.08)");
        gradient.addColorStop(1, "rgba(255, 255, 255, 0)");
        ctx.fillStyle = gradient;
        ctx.fillRect(0, 0, 64, 64);
    }
    const texture = new THREE.CanvasTexture(canvas);
    texture.wrapS = THREE.ClampToEdgeWrapping;
    texture.wrapT = THREE.ClampToEdgeWrapping;
    return texture;
}

function createOrganicNebulaTexture(
    primaryColor: { r: number; g: number; b: number },
    highlightColor: { r: number; g: number; b: number },
    seed: number
): THREE.CanvasTexture {
    const size = 512;
    const canvas = document.createElement("canvas");
    canvas.width = size;
    canvas.height = size;
    const ctx = canvas.getContext("2d");

    if (ctx) {
        ctx.clearRect(0, 0, size, size);

        function pseudoRand(s: number) {
            const x = Math.sin(s) * 10000;
            return x - Math.floor(x);
        }

        const numFilaments = 20;
        const center = size / 2;
        const maxAllowedRadius = 220;

        for (let i = 0; i < numFilaments; i++) {
            const r1 = pseudoRand(seed + i * 11.37);
            const r2 = pseudoRand(seed + i * 23.71);
            const r3 = pseudoRand(seed + i * 37.19);
            const r4 = pseudoRand(seed + i * 49.83);
            const r5 = pseudoRand(seed + i * 61.29);

            const angle = r1 * Math.PI * 2;
            const dist = 15 + r2 * 95;
            const px = center + Math.cos(angle) * dist * (0.7 + r5 * 0.6);
            const py = center + Math.sin(angle) * dist * (0.7 + (1 - r5) * 0.6);
            const maxPuffDistFromEdge = Math.min(px, py, size - px, size - py);
            const puffRadius = Math.min(50 + r3 * 75, maxPuffDistFromEdge * 0.85);

            if (puffRadius > 5) {
                const grad = ctx.createRadialGradient(px, py, 0, px, py, puffRadius);

                const isCore = r4 > 0.65;
                const col = isCore ? highlightColor : primaryColor;
                const centerDist = Math.hypot(px - center, py - center);
                const distanceFactor = Math.max(0, 1.0 - centerDist / maxAllowedRadius);
                const maxAlpha = (isCore ? 0.24 : 0.16) * distanceFactor;

                grad.addColorStop(0, `rgba(${col.r}, ${col.g}, ${col.b}, ${maxAlpha})`);
                grad.addColorStop(0.35, `rgba(${col.r}, ${col.g}, ${col.b}, ${maxAlpha * 0.6})`);
                grad.addColorStop(0.7, `rgba(${col.r}, ${col.g}, ${col.b}, ${maxAlpha * 0.15})`);
                grad.addColorStop(1, `rgba(${col.r}, ${col.g}, ${col.b}, 0)`);

                ctx.fillStyle = grad;
                ctx.beginPath();
                ctx.arc(px, py, puffRadius, 0, Math.PI * 2);
                ctx.fill();
            }
        }

        for (let j = 0; j < 10; j++) {
            const r1 = pseudoRand(seed + 100 + j * 17.3);
            const r2 = pseudoRand(seed + 100 + j * 31.7);
            const r3 = pseudoRand(seed + 100 + j * 47.9);

            const sx = center + (r1 - 0.5) * 120;
            const sy = center + (r2 - 0.5) * 120;
            const whispyRadius = 35 + r3 * 45;

            const wGrad = ctx.createRadialGradient(sx, sy, 0, sx, sy, whispyRadius);
            wGrad.addColorStop(0, `rgba(${highlightColor.r}, ${highlightColor.g}, ${highlightColor.b}, 0.18)`);
            wGrad.addColorStop(0.5, `rgba(${primaryColor.r}, ${primaryColor.g}, ${primaryColor.b}, 0.05)`);
            wGrad.addColorStop(1, "rgba(0, 0, 0, 0)");

            ctx.fillStyle = wGrad;
            ctx.beginPath();
            ctx.arc(sx, sy, whispyRadius, 0, Math.PI * 2);
            ctx.fill();
        }

        ctx.globalCompositeOperation = "destination-in";
        const vignette = ctx.createRadialGradient(center, center, 0, center, center, center * 0.95);
        vignette.addColorStop(0, "rgba(0, 0, 0, 1)");
        vignette.addColorStop(0.7, "rgba(0, 0, 0, 0.95)");
        vignette.addColorStop(0.88, "rgba(0, 0, 0, 0.45)");
        vignette.addColorStop(1, "rgba(0, 0, 0, 0)");
        ctx.fillStyle = vignette;
        ctx.fillRect(0, 0, size, size);
        ctx.globalCompositeOperation = "source-over";
    }

    const texture = new THREE.CanvasTexture(canvas);
    texture.wrapS = THREE.ClampToEdgeWrapping;
    texture.wrapT = THREE.ClampToEdgeWrapping;
    return texture;
}

interface MeteorState {
    active: boolean;
    start: THREE.Vector3;
    dir: THREE.Vector3;
    progress: number;
    speed: number;
    length: number;
    color: THREE.Color;
    nextSpawnTime: number;
}

export function CosmicBackground({ visible = true }: CosmicBackgroundProps) {
    const starsRef = useRef<THREE.Points>(null);
    const brightStarsRef = useRef<THREE.Points>(null);
    const nebulaeGroupRef = useRef<THREE.Group>(null);
    const meteorsGroupRef = useRef<THREE.Group>(null);

    const circleTexture = useMemo(() => createCircleTexture(), []);

    const nebulaTextures = useMemo(() => {
        return [
            createOrganicNebulaTexture({ r: 56, g: 189, b: 248 }, { r: 186, g: 230, b: 253 }, 101),
            createOrganicNebulaTexture({ r: 129, g: 140, b: 248 }, { r: 224, g: 231, b: 255 }, 202),
            createOrganicNebulaTexture({ r: 236, g: 72, b: 153 }, { r: 251, g: 207, b: 232 }, 303),
            createOrganicNebulaTexture({ r: 251, g: 191, b: 36 }, { r: 254, g: 243, b: 199 }, 404),
            createOrganicNebulaTexture({ r: 45, g: 212, b: 191 }, { r: 204, g: 251, b: 241 }, 505),
            createOrganicNebulaTexture({ r: 168, g: 85, b: 247 }, { r: 243, g: 232, b: 255 }, 606),
        ];
    }, []);

    useEffect(() => {
        return () => {
            circleTexture.dispose();
            nebulaTextures.forEach((tex) => tex.dispose());
        };
    }, [circleTexture, nebulaTextures]);

    const { starPositions, starColors, starPhases } = STATIC_STARFIELD_DATA;
    const { brightPositions, brightColors } = STATIC_BRIGHT_STAR_DATA;

    const nebulae = useMemo(() => {
        const items = [];
        const offsets = [
            { x: -340, y: 140, z: -380, scaleX: 380, scaleY: 240, rotSpeed: 0.003, texIdx: 0 },
            { x: 360, y: -100, z: -360, scaleX: 420, scaleY: 260, rotSpeed: -0.002, texIdx: 1 },
            { x: -280, y: -180, z: 340, scaleX: 340, scaleY: 220, rotSpeed: 0.004, texIdx: 2 },
            { x: 320, y: 200, z: 300, scaleX: 390, scaleY: 250, rotSpeed: -0.003, texIdx: 3 },
            { x: 50, y: -280, z: -370, scaleX: 360, scaleY: 230, rotSpeed: 0.002, texIdx: 4 },
            { x: -200, y: 240, z: 360, scaleX: 350, scaleY: 220, rotSpeed: -0.004, texIdx: 5 },
        ];

        for (let i = 0; i < NEBULA_COUNT; i++) {
            const config = offsets[i % offsets.length];
            items.push({
                position: new THREE.Vector3(config.x, config.y, config.z),
                scaleX: config.scaleX,
                scaleY: config.scaleY,
                rotSpeed: config.rotSpeed,
                texture: nebulaTextures[config.texIdx % nebulaTextures.length],
            });
        }
        return items;
    }, [nebulaTextures]);

    const meteors = useRef<MeteorState[]>([
        {
            active: false,
            start: new THREE.Vector3(),
            dir: new THREE.Vector3(),
            progress: 0,
            speed: 1.8,
            length: 45,
            color: new THREE.Color("#38bdf8"),
            nextSpawnTime: 2.0,
        },
        {
            active: false,
            start: new THREE.Vector3(),
            dir: new THREE.Vector3(),
            progress: 0,
            speed: 2.2,
            length: 55,
            color: new THREE.Color("#818cf8"),
            nextSpawnTime: 5.5,
        },
        {
            active: false,
            start: new THREE.Vector3(),
            dir: new THREE.Vector3(),
            progress: 0,
            speed: 1.6,
            length: 40,
            color: new THREE.Color("#fef08a"),
            nextSpawnTime: 8.0,
        },
        {
            active: false,
            start: new THREE.Vector3(),
            dir: new THREE.Vector3(),
            progress: 0,
            speed: 2.0,
            length: 50,
            color: new THREE.Color("#f472b6"),
            nextSpawnTime: 12.0,
        },
    ]);

    const meteorLines = useMemo(() => {
        return Array.from({ length: METEOR_COUNT }, (_, idx) => {
            const geom = new THREE.BufferGeometry();
            const pos = new Float32Array(6);
            geom.setAttribute("position", new THREE.BufferAttribute(pos, 3));
            const mat = new THREE.LineBasicMaterial({
                color: METEOR_COLORS[idx % METEOR_COLORS.length],
                transparent: true,
                opacity: 0.85,
                blending: THREE.AdditiveBlending,
                depthWrite: false,
            });
            return new THREE.Line(geom, mat);
        });
    }, []);

    useEffect(() => {
        return () => {
            meteorLines.forEach((line) => {
                line.geometry.dispose();
                if (Array.isArray(line.material)) {
                    line.material.forEach((m) => m.dispose());
                } else {
                    line.material.dispose();
                }
            });
        };
    }, [meteorLines]);

    useFrame((state, delta) => {
        if (!visible) return;
        const time = state.clock.getElapsedTime();

        if (starsRef.current) {
            starsRef.current.rotation.y = time * 0.0015;
            starsRef.current.rotation.x = Math.sin(time * 0.0008) * 0.02;

            const geom = starsRef.current.geometry;
            const colorAttr = geom.getAttribute("color");
            if (colorAttr) {
                const colorsArr = colorAttr.array as Float32Array;
                for (let i = 0; i < STAR_COUNT; i += 7) {
                    const phase = starPhases[i];
                    const twinkle = 0.65 + 0.35 * Math.sin(time * 2.8 + phase);
                    colorsArr[i * 3] = starColors[i * 3] * twinkle;
                    colorsArr[i * 3 + 1] = starColors[i * 3 + 1] * twinkle;
                    colorsArr[i * 3 + 2] = starColors[i * 3 + 2] * twinkle;
                }
                colorAttr.needsUpdate = true;
            }
        }

        if (brightStarsRef.current) {
            brightStarsRef.current.rotation.y = time * 0.002;
            const brightMat = brightStarsRef.current.material as THREE.PointsMaterial;
            if (brightMat) {
                brightMat.size = 5.5 + Math.sin(time * 2.0) * 0.8;
            }
        }

        if (nebulaeGroupRef.current) {
            nebulaeGroupRef.current.children.forEach((child, idx) => {
                const item = nebulae[idx];
                if (item) {
                    child.rotation.z += item.rotSpeed * delta;
                    child.lookAt(state.camera.position);
                }
            });
        }

        meteors.current.forEach((m, idx) => {
            const lineObj = meteorLines[idx];
            if (!lineObj) return;
            const posAttr = lineObj.geometry.getAttribute("position") as THREE.BufferAttribute;
            const posArr = posAttr.array as Float32Array;

            if (!m.active) {
                if (time >= m.nextSpawnTime) {
                    m.active = true;
                    m.progress = 0;
                    m.speed = 1.6 + Math.random() * 1.4;
                    m.length = 35 + Math.random() * 30;

                    const theta = Math.random() * Math.PI * 2;
                    const phi = Math.acos(2 * Math.random() - 1);
                    const r = 420 + Math.random() * 150;
                    const sinPhi = Math.sin(phi);

                    m.start.set(
                        r * sinPhi * Math.cos(theta),
                        r * Math.cos(phi),
                        r * sinPhi * Math.sin(theta)
                    );

                    const target = new THREE.Vector3(
                        (Math.random() - 0.5) * 150,
                        (Math.random() - 0.5) * 100,
                        (Math.random() - 0.5) * 150
                    );
                    m.dir.subVectors(target, m.start).normalize();
                } else {
                    posArr.fill(0);
                    posAttr.needsUpdate = true;
                }
            } else {
                m.progress += delta * m.speed;
                const headPos = m.start.clone().add(m.dir.clone().multiplyScalar(m.progress * 180));
                const tailLength = Math.min(m.progress * 80, m.length);
                const tailPos = headPos.clone().sub(m.dir.clone().multiplyScalar(tailLength));

                posArr[0] = tailPos.x;
                posArr[1] = tailPos.y;
                posArr[2] = tailPos.z;
                posArr[3] = headPos.x;
                posArr[4] = headPos.y;
                posArr[5] = headPos.z;
                posAttr.needsUpdate = true;

                if (m.progress >= 1.0) {
                    m.active = false;
                    m.nextSpawnTime = time + 6.0 + Math.random() * 10.0;
                    posArr.fill(0);
                    posAttr.needsUpdate = true;
                }
            }
        });
    });

    if (!visible) return null;

    return (
        <group name="CosmicBackground">
            <points ref={starsRef}>
                <bufferGeometry>
                    <bufferAttribute
                        attach="attributes-position"
                        args={[starPositions, 3]}
                    />
                    <bufferAttribute
                        attach="attributes-color"
                        args={[starColors, 3]}
                    />
                </bufferGeometry>
                <pointsMaterial
                    map={circleTexture}
                    size={3.0}
                    vertexColors
                    transparent
                    opacity={0.88}
                    blending={THREE.AdditiveBlending}
                    depthWrite={false}
                    sizeAttenuation
                />
            </points>

            <points ref={brightStarsRef}>
                <bufferGeometry>
                    <bufferAttribute
                        attach="attributes-position"
                        args={[brightPositions, 3]}
                    />
                    <bufferAttribute
                        attach="attributes-color"
                        args={[brightColors, 3]}
                    />
                </bufferGeometry>
                <pointsMaterial
                    map={circleTexture}
                    size={5.5}
                    vertexColors
                    transparent
                    opacity={0.95}
                    blending={THREE.AdditiveBlending}
                    depthWrite={false}
                    sizeAttenuation
                />
            </points>

            <group ref={nebulaeGroupRef}>
                {nebulae.map((item, idx) => (
                    <mesh key={idx} position={item.position}>
                        <planeGeometry args={[item.scaleX, item.scaleY]} />
                        <meshBasicMaterial
                            map={item.texture}
                            transparent
                            opacity={0.65}
                            blending={THREE.AdditiveBlending}
                            depthWrite={false}
                            side={THREE.DoubleSide}
                        />
                    </mesh>
                ))}
            </group>

            <group ref={meteorsGroupRef}>
                {meteorLines.map((line, idx) => (
                    <primitive key={idx} object={line} />
                ))}
            </group>
        </group>
    );
}

export default CosmicBackground;
