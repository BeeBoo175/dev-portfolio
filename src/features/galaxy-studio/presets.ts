import type {
    AsteroidBeltConfig,
    PaletteConfig,
    PlanetTerrainConfig,
    OrbitConfig,
    SunConfig,
} from "../galaxy";
import { resolveGalaxyCollisions } from "../galaxy";

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
        name: "Frost Tundra",
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
            mountain: "#bae6fd",
            peak: "#ffffff",
        },
    },
    {
        id: "desert",
        name: "Dune Expanse",
        description: "Arid desert planet sculpted by copper canyons and golden plateaus.",
        color: "#fbbf24",
        terrain: {
            seed: 95,
            noiseScale: 2.1,
            roughness: 0.35,
            waterLevel: 0.15,
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
    {
        id: "amethyst",
        name: "Abyssal Rift",
        description: "Deep violet oceanic realm with luminescence shimmering across trenches.",
        color: "#818cf8",
        terrain: {
            seed: 104,
            noiseScale: 1.7,
            roughness: 0.24,
            waterLevel: 0.62,
            detail: 3,
        },
        palette: {
            water: "#312e81",
            coast: "#4338ca",
            land: "#6366f1",
            mountain: "#4f46e5",
            peak: "#c7d2fe",
        },
    },
];

export const RANDOM_PALETTES: PaletteConfig[] = [
    {
        water: "#0369a1",
        coast: "#38bdf8",
        land: "#22c55e",
        mountain: "#15803d",
        peak: "#f8fafc",
    },
    {
        water: "#be123c",
        coast: "#f43f5e",
        land: "#fb7185",
        mountain: "#881337",
        peak: "#ffe4e6",
    },
    {
        water: "#4c1d95",
        coast: "#7c3aed",
        land: "#a855f7",
        mountain: "#2e1065",
        peak: "#f3e8ff",
    },
    {
        water: "#1e293b",
        coast: "#475569",
        land: "#64748b",
        mountain: "#334155",
        peak: "#e2e8f0",
    },
    {
        water: "#0f766e",
        coast: "#14b8a6",
        land: "#2dd4bf",
        mountain: "#115e59",
        peak: "#ccfbf1",
    },
    {
        water: "#7c2d12",
        coast: "#ea580c",
        land: "#fb923c",
        mountain: "#431407",
        peak: "#ffedd5",
    },
];

export function generateRandomTerrain(): PlanetTerrainConfig {
    return {
        seed: Math.floor(Math.random() * 999) + 1,
        noiseScale: Number((Math.random() * 1.0 + 1.0).toFixed(2)),
        roughness: Number((Math.random() * 0.25 + 0.15).toFixed(2)),
        waterLevel: Number((Math.random() * 0.45 + 0.15).toFixed(2)),
        detail: 3,
    };
}

export function generateRandomSun(baseSun?: SunConfig): SunConfig {
    const sunColors = ["#ffd76b", "#ff9e3b", "#ff5500", "#ff4477", "#60a5fa", "#38bdf8", "#facc15"];
    const chosenColor = sunColors[Math.floor(Math.random() * sunColors.length)];
    return {
        id: baseSun?.id || "home",
        radius: Number((Math.random() * 1.5 + 2.8).toFixed(2)),
        rotationSpeed: Number((Math.random() * 0.2 + 0.08).toFixed(3)),
        color: chosenColor,
        glowIntensity: Number((Math.random() * 0.6 + 0.8).toFixed(2)),
        lightIntensity: Number((Math.random() * 3.0 + 5.0).toFixed(1)),
        cameraOrbitSpeed: Number((-(Math.random() * 0.06 + 0.02)).toFixed(3)),
        palette: {
            water: chosenColor,
            peak: "#fffbeb",
        },
    };
}

export function generateRandomMoon(planetId: string, index: number): OrbitConfig {
    const palette = RANDOM_PALETTES[Math.floor(Math.random() * RANDOM_PALETTES.length)];
    return {
        id: `${planetId}-moon-${index + 1}`,
        radius: Number((Math.random() * 0.15 + 0.22).toFixed(2)),
        orbitRadius: Number((1.5 + index * 1.1 + Math.random() * 0.3).toFixed(2)),
        orbitSpeed: Number((Math.random() * 0.6 + 0.6).toFixed(2)),
        rotationSpeed: Number((Math.random() * 0.5 + 0.3).toFixed(2)),
        axialTilt: Number((Math.random() * 0.35).toFixed(3)),
        orbitInclination: Number(((Math.random() - 0.5) * 0.3).toFixed(3)),
        orbitAscendingNode: Number(((Math.random() - 0.5) * 0.4).toFixed(3)),
        orbitArgument: Number(((Math.random() - 0.5) * 0.4).toFixed(3)),
        initialAngle: Number((Math.random() * Math.PI * 2).toFixed(2)),
        color: palette.coast ?? palette.land ?? "#cbd5e1",
        terrain: {
            seed: Math.floor(Math.random() * 999) + 1,
            noiseScale: Number((Math.random() * 1.2 + 1.6).toFixed(2)),
            roughness: Number((Math.random() * 0.25 + 0.18).toFixed(2)),
            waterLevel: 0,
            detail: 2,
        },
        palette: {
            land: palette.land ?? "#94a3b8",
            mountain: palette.mountain ?? "#64748b",
            peak: palette.peak ?? "#e2e8f0",
        },
    };
}

export function generateRandomPlanet(planet: OrbitConfig): OrbitConfig {
    const allPalettes = [
        ...BIOME_PRESETS.map((b) => ({ palette: b.palette, color: b.color })),
        ...RANDOM_PALETTES.map((p) => ({ palette: p, color: p.coast ?? p.land ?? "#38bdf8" })),
    ];
    const paletteObj = allPalettes[Math.floor(Math.random() * allPalettes.length)];

    const radius = Number((Math.random() * 0.8 + 0.85).toFixed(2));
    const hasRing = Math.random() < 0.4;
    const ring = hasRing
        ? {
              innerRadius: Number((radius * 1.35 + 0.1).toFixed(2)),
              outerRadius: Number((radius * 1.95 + 0.3).toFixed(2)),
              color: paletteObj.palette.coast ?? paletteObj.palette.land ?? paletteObj.color,
              opacity: Number((Math.random() * 0.35 + 0.5).toFixed(2)),
          }
        : undefined;

    return {
        ...planet,
        radius,
        rotationSpeed: Number((Math.random() * 0.5 + 0.25).toFixed(2)),
        axialTilt: Number(
            (Math.random() < 0.15 ? Math.random() * 0.4 + 2.8 : Math.random() * 0.65).toFixed(3)
        ),
        orbitInclination: Number(((Math.random() - 0.5) * 0.35).toFixed(3)),
        orbitAscendingNode: Number(((Math.random() - 0.5) * 0.45).toFixed(3)),
        orbitArgument: Number(((Math.random() - 0.5) * 0.45).toFixed(3)),
        color: paletteObj.color,
        terrain: generateRandomTerrain(),
        palette: paletteObj.palette,
        ring,
    };
}

export function generateRandomAsteroidBelt(baseBelt?: AsteroidBeltConfig): AsteroidBeltConfig {
    const colorPairs = [
        { primary: "#9ca3af", secondary: "#57534e" },
        { primary: "#78716c", secondary: "#44403c" },
        { primary: "#a8a29e", secondary: "#713f12" },
        { primary: "#64748b", secondary: "#334155" },
        { primary: "#ca8a04", secondary: "#854d0e" },
        { primary: "#475569", secondary: "#1e293b" },
    ];
    const colorPair = colorPairs[Math.floor(Math.random() * colorPairs.length)];
    const innerRadius = Number((Math.random() * 2.5 + 13.0).toFixed(1));
    const outerRadius = Number((innerRadius + Math.random() * 2.5 + 2.0).toFixed(1));
    const count = Math.floor(Math.random() * 300) + 350;
    const minSize = Number((Math.random() * 0.04 + 0.03).toFixed(2));
    const maxSize = Number((minSize + Math.random() * 0.12 + 0.08).toFixed(2));
    const orbitSpeed = Number(((Math.random() * 0.08 + 0.05) * (Math.random() > 0.15 ? 1 : -1)).toFixed(3));
    const heightSpread = Number((Math.random() * 0.7 + 0.4).toFixed(2));
    const inclination = Number(((Math.random() - 0.5) * 0.25).toFixed(3));
    const ascendingNode = Number(((Math.random() - 0.5) * 0.35).toFixed(3));
    const argument = Number(((Math.random() - 0.5) * 0.35).toFixed(3));
    const seed = Math.floor(Math.random() * 9999) + 1;

    return {
        enabled: baseBelt?.enabled ?? true,
        innerRadius,
        outerRadius,
        count,
        minSize,
        maxSize,
        orbitSpeed,
        heightSpread,
        inclination,
        ascendingNode,
        argument,
        color: colorPair.primary,
        secondaryColor: colorPair.secondary,
        seed,
    };
}

export function generateRandomGalaxy(
    basePlanets: OrbitConfig[],
    baseBelt: AsteroidBeltConfig,
    baseSun: SunConfig
): {
    planets: OrbitConfig[];
    asteroidBelt: AsteroidBeltConfig;
    sun: SunConfig;
} {
    const orbitLanes = [
        { minOrbit: 6.8, maxOrbit: 7.6, speedFactor: 0.23 },
        { minOrbit: 11.5, maxOrbit: 12.8, speedFactor: 0.15 },
        { minOrbit: 17.5, maxOrbit: 19.0, speedFactor: 0.11 },
        { minOrbit: 23.5, maxOrbit: 25.5, speedFactor: 0.08 },
    ];

    const rawPlanets = basePlanets.map((base, idx) => {
        const lane = orbitLanes[idx] ?? {
            minOrbit: 7.0 + idx * 5.5,
            maxOrbit: 8.0 + idx * 5.5,
            speedFactor: 0.2 / (idx + 1),
        };

        const randomPlanet = generateRandomPlanet(base);
        const orbitRadius = Number(
            (lane.minOrbit + Math.random() * (lane.maxOrbit - lane.minOrbit)).toFixed(1)
        );
        const orbitSpeed = Number(
            (lane.speedFactor * (0.85 + Math.random() * 0.35)).toFixed(3)
        );
        const initialAngle = Number((Math.random() * Math.PI * 2).toFixed(2));

        const moonCount = Math.floor(Math.random() * 3);
        const moons: OrbitConfig[] = [];
        for (let m = 0; m < moonCount; m++) {
            moons.push(generateRandomMoon(base.id, m));
        }

        return {
            ...randomPlanet,
            orbitRadius,
            orbitSpeed,
            initialAngle,
            children: moons,
        };
    });

    const asteroidBelt = generateRandomAsteroidBelt(baseBelt);
    const sun = generateRandomSun(baseSun);
    const { resolvedPlanets: planets } = resolveGalaxyCollisions(rawPlanets, asteroidBelt);

    return { planets, asteroidBelt, sun };
}
