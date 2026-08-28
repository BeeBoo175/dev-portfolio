import type { PaletteConfig, PlanetTerrainConfig } from "../galaxy/types";

export interface BiomePreset {
    id: string;
    name: string;
    description: string;
    icon: string;
    terrain: PlanetTerrainConfig;
    palette: PaletteConfig;
    color: string;
}

export const BIOME_PRESETS: BiomePreset[] = [
    {
        id: "terra",
        name: "Terra Prime",
        description: "Lush terrestrial world with vast oceans and emerald continents.",
        icon: "🌍",
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
        icon: "🌋",
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
        icon: "🔮",
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
        icon: "❇️",
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
        icon: "❄️",
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
        icon: "🏜️",
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
