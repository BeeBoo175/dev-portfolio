import type { PaletteConfig, PlanetTerrainConfig, OrbitConfig } from "../galaxy";

export interface BiomePreset {
    id: string;
    name: string;
    description: string;
    terrain: PlanetTerrainConfig;
    palette: PaletteConfig;
    color: string;
}

export const BIOME_PRESETS: BiomePreset[] = [
    {
        id: "terra",
        name: "Terra Prime",
        description: "Lush terrestrial world with vast oceans and emerald continents.",
        color: "#38bdf8",
        terrain: {
            seed: 12,
            noiseScale: 1.4,
            roughness: 0.22,
            waterLevel: 0.45,
            detail: 3,
        },
        palette: {
            water: "#0284c7",
            coast: "#38bdf8",
            land: "#10b981",
            mountain: "#047857",
            peak: "#f8fafc",
        },
    },
    {
        id: "magma",
        name: "Inferno Core",
        description: "Volcanic planet with glowing magma fractures and obsidian peaks.",
        color: "#ff7849",
        terrain: {
            seed: 48,
            noiseScale: 1.8,
            roughness: 0.32,
            waterLevel: 0.38,
            detail: 3,
        },
        palette: {
            water: "#dc2626",
            coast: "#f97316",
            land: "#7c2d12",
            mountain: "#451a03",
            peak: "#fef08a",
        },
    },
    {
        id: "cyberpunk",
        name: "Neon Synth",
        description: "Futuristic crystal planet with ultraviolet valleys and magenta ridges.",
        color: "#ec4899",
        terrain: {
            seed: 77,
            noiseScale: 1.6,
            roughness: 0.28,
            waterLevel: 0.35,
            detail: 3,
        },
        palette: {
            water: "#a855f7",
            coast: "#c084fc",
            land: "#ec4899",
            mountain: "#581c87",
            peak: "#67e8f9",
        },
    },
    {
        id: "emerald",
        name: "Jade Spire",
        description: "Alien mineral world filled with teal oceans and crystal peaks.",
        color: "#10b981",
        terrain: {
            seed: 63,
            noiseScale: 1.3,
            roughness: 0.26,
            waterLevel: 0.42,
            detail: 3,
        },
        palette: {
            water: "#059669",
            coast: "#10b981",
            land: "#34d399",
            mountain: "#065f46",
            peak: "#ecfdf5",
        },
    },
    {
        id: "glacier",
        name: "Frostbite Tundra",
        description: "Frozen world of turquoise ice shelves and shimmering snowdrifts.",
        color: "#67e8f9",
        terrain: {
            seed: 31,
            noiseScale: 1.5,
            roughness: 0.2,
            waterLevel: 0.5,
            detail: 3,
        },
        palette: {
            water: "#0891b2",
            coast: "#22d3ee",
            land: "#a5f3fc",
            mountain: "#0e7490",
            peak: "#ffffff",
        },
    },
    {
        id: "desert",
        name: "Solar Dunes",
        description: "Endless golden sand ridges and sunbaked canyons.",
        color: "#f59e0b",
        terrain: {
            seed: 85,
            noiseScale: 1.7,
            roughness: 0.24,
            waterLevel: 0.2,
            detail: 3,
        },
        palette: {
            water: "#b45309",
            coast: "#d97706",
            land: "#f59e0b",
            mountain: "#78350f",
            peak: "#fef3c7",
        },
    },
];

const RANDOM_PALETTES: PaletteConfig[] = [
    { water: "#0369a1", coast: "#38bdf8", land: "#15803d", mountain: "#166534", peak: "#f8fafc" },
    { water: "#be123c", coast: "#f43f5e", land: "#fda4af", mountain: "#881337", peak: "#fff1f2" },
    { water: "#4338ca", coast: "#6366f1", land: "#a5b4fc", mountain: "#312e81", peak: "#e0e7ff" },
    { water: "#047857", coast: "#10b981", land: "#6ee7b7", mountain: "#064e3b", peak: "#ecfdf5" },
    { water: "#a16207", coast: "#eab308", land: "#fde047", mountain: "#713f12", peak: "#fef9c3" },
    { water: "#6b21a8", coast: "#9333ea", land: "#c084fc", mountain: "#3b0764", peak: "#fae8ff" },
    { water: "#0f766e", coast: "#14b8a6", land: "#5eead4", mountain: "#134e4a", peak: "#ccfbf1" },
    { water: "#c2410c", coast: "#ea580c", land: "#fb923c", mountain: "#7c2d12", peak: "#ffedd5" },
];

export function generateRandomTerrain(): { terrain: PlanetTerrainConfig; palette: PaletteConfig; color: string } {
    const seed = Math.floor(Math.random() * 1000);
    const noiseScale = Number((Math.random() * 1.2 + 0.9).toFixed(2));
    const roughness = Number((Math.random() * 0.22 + 0.14).toFixed(2));
    const waterLevel = Number((Math.random() * 0.35 + 0.25).toFixed(2));

    const palette = RANDOM_PALETTES[Math.floor(Math.random() * RANDOM_PALETTES.length)];
    const color = palette.coast ?? palette.land ?? "#38bdf8";

    return {
        terrain: {
            seed,
            noiseScale,
            roughness,
            waterLevel,
            detail: 3,
        },
        palette,
        color,
    };
}

export function generateRandomGalaxy(basePlanets: OrbitConfig[]): OrbitConfig[] {
    const allPalettes = [
        ...BIOME_PRESETS.map((b) => ({ palette: b.palette, color: b.color })),
        ...RANDOM_PALETTES.map((p) => ({ palette: p, color: p.coast ?? p.land ?? "#38bdf8" })),
    ];
    const shuffledPalettes = [...allPalettes].sort(() => Math.random() - 0.5);

    const orbitLanes = [
        { minOrbit: 6.8, maxOrbit: 7.6, speedFactor: 0.23 },
        { minOrbit: 11.5, maxOrbit: 12.8, speedFactor: 0.15 },
        { minOrbit: 16.8, maxOrbit: 18.2, speedFactor: 0.11 },
        { minOrbit: 22.8, maxOrbit: 24.5, speedFactor: 0.08 },
    ];

    return basePlanets.map((base, idx) => {
        const lane = orbitLanes[idx] ?? {
            minOrbit: 7.0 + idx * 5.5,
            maxOrbit: 8.0 + idx * 5.5,
            speedFactor: 0.2 / (idx + 1),
        };

        const radius = Number((Math.random() * 0.8 + 0.85).toFixed(2));
        const orbitRadius = Number(
            (lane.minOrbit + Math.random() * (lane.maxOrbit - lane.minOrbit)).toFixed(1)
        );
        const orbitSpeed = Number(
            (lane.speedFactor * (0.85 + Math.random() * 0.35)).toFixed(3)
        );
        const initialAngle = Number((Math.random() * Math.PI * 2).toFixed(2));
        const rotationSpeed = Number((Math.random() * 0.5 + 0.25).toFixed(2));
        const axialTilt = Number(
            (Math.random() < 0.15 ? Math.random() * 0.4 + 2.8 : Math.random() * 0.65).toFixed(3)
        );
        const orbitInclination = Number(((Math.random() - 0.5) * 0.24).toFixed(3));

        const paletteObj = shuffledPalettes[idx % shuffledPalettes.length];
        const terrain = {
            seed: Math.floor(Math.random() * 999) + 1,
            noiseScale: Number((Math.random() * 0.9 + 1.1).toFixed(2)),
            roughness: Number((Math.random() * 0.18 + 0.16).toFixed(2)),
            waterLevel: Number((Math.random() * 0.35 + 0.22).toFixed(2)),
            detail: 3,
        };

        const hasRing = Math.random() < 0.4;
        const ring = hasRing
            ? {
                  innerRadius: Number((radius * 1.35 + 0.1).toFixed(2)),
                  outerRadius: Number((radius * 1.95 + 0.3).toFixed(2)),
                  color: paletteObj.palette.coast ?? paletteObj.palette.land ?? paletteObj.color,
                  opacity: Number((Math.random() * 0.35 + 0.5).toFixed(2)),
              }
            : undefined;

        const moonCount = Math.floor(Math.random() * 3);
        const moons = [];
        let currentMoonOrbit = radius + 0.95 + Math.random() * 0.3;

        for (let m = 0; m < moonCount; m++) {
            const moonRadius = Number((Math.random() * 0.15 + 0.2).toFixed(2));
            const moonOrbitRadius = Number(currentMoonOrbit.toFixed(2));
            const moonOrbitSpeed = Number((Math.random() * 0.6 + 0.7).toFixed(2));
            const moonRotationSpeed = Number((Math.random() * 0.5 + 0.3).toFixed(2));
            const moonTilt = Number((Math.random() * 0.35).toFixed(3));
            const moonInc = Number(((Math.random() - 0.5) * 0.25).toFixed(3));

            const moonPalette = RANDOM_PALETTES[Math.floor(Math.random() * RANDOM_PALETTES.length)];

            moons.push({
                id: `${base.id}-moon-${m + 1}`,
                radius: moonRadius,
                orbitRadius: moonOrbitRadius,
                orbitSpeed: moonOrbitSpeed,
                rotationSpeed: moonRotationSpeed,
                axialTilt: moonTilt,
                orbitInclination: moonInc,
                initialAngle: Number((Math.random() * Math.PI * 2).toFixed(2)),
                color: moonPalette.coast ?? moonPalette.land ?? "#cbd5e1",
                terrain: {
                    seed: Math.floor(Math.random() * 999) + 1,
                    noiseScale: Number((Math.random() * 1.2 + 1.6).toFixed(2)),
                    roughness: Number((Math.random() * 0.25 + 0.18).toFixed(2)),
                    waterLevel: 0,
                    detail: 2,
                },
                palette: {
                    land: moonPalette.land ?? "#94a3b8",
                    mountain: moonPalette.mountain ?? "#64748b",
                    peak: moonPalette.peak ?? "#e2e8f0",
                },
            });

            currentMoonOrbit += moonRadius + 1.1 + Math.random() * 0.3;
        }

        return {
            ...base,
            radius,
            orbitRadius,
            orbitSpeed,
            initialAngle,
            rotationSpeed,
            axialTilt,
            orbitInclination,
            color: paletteObj.color,
            terrain,
            palette: paletteObj.palette,
            ring,
            children: moons,
        };
    });
}
