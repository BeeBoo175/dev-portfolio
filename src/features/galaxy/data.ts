import type { OrbitConfig } from "./types";

export const CENTRAL_BODY: OrbitConfig = {
    id: "home",
    radius: 3.5,
    rotationSpeed: 0.15,
    orbitInclination: 0,
    axialTilt: 0,
    color: "#ffd76b",
    palette: {
        water: "#ffd76b",
        peak: "#fffbeb",
    },
};

export const ORBIT_LAYOUT: OrbitConfig[] = [
    {
        id: "about", // Mercury analog: steepest orbital tilt (~7 degrees)
        radius: 1.0,
        rotationSpeed: 0.5,
        orbitRadius: 7.0,
        orbitSpeed: 0.23,
        initialAngle: 0,
        orbitInclination: 0.122, // ~7.0°
        axialTilt: 0.001,
        color: "#5da9ff",
        terrain: {
            seed: 12,
            noiseScale: 1.5,
            roughness: 0.22,
            waterLevel: 0.44,
            detail: 3,
        },
        palette: {
            water: "#0284c7",
            coast: "#38bdf8",
            land: "#10b981",
            mountain: "#047857",
            peak: "#f8fafc",
        },
        children: [
            {
                id: "skills-moon-1",
                radius: 0.4,
                rotationSpeed: 0.5,
                orbitRadius: 2.2,
                orbitSpeed: 0.93,
                orbitInclination: 0.087, // ~5.0° (like Earth's Moon relative to ecliptic)
                axialTilt: 0.026,
                color: "#cbd5e1",
                terrain: {
                    seed: 91,
                    noiseScale: 2.2,
                    roughness: 0.22,
                    waterLevel: 0,
                    detail: 2,
                },
                palette: {
                    land: "#94a3b8",
                    mountain: "#64748b",
                    peak: "#e2e8f0",
                },
            },
        ],
    },
    {
        id: "skills", // Venus analog: slight tilt (~3.4 degrees)
        radius: 1.1,
        rotationSpeed: 0.4,
        orbitRadius: 11.0,
        orbitSpeed: 0.137,
        initialAngle: (2 * Math.PI) / 3,
        orbitInclination: 0.059, // ~3.39°
        axialTilt: 3.09, // Extreme retrograde tilt like Venus (~177°)
        color: "#ffb15d",
        terrain: {
            seed: 34,
            noiseScale: 1.7,
            roughness: 0.26,
            waterLevel: 0.38,
            detail: 3,
        },
        palette: {
            water: "#c2410c",
            coast: "#f97316",
            land: "#d97706",
            mountain: "#78350f",
            peak: "#fef3c7",
        },
    },
    {
        id: "projects", // Jupiter analog: almost flat plane (~1.3 degrees)
        radius: 1.5,
        rotationSpeed: 0.3,
        orbitRadius: 18.0,
        orbitSpeed: 0.071,
        initialAngle: (4 * Math.PI) / 3,
        orbitInclination: 0.023, // ~1.30°
        axialTilt: 0.054, // ~3.13°
        color: "#7dff9c",
        terrain: {
            seed: 73,
            noiseScale: 1.3,
            roughness: 0.25,
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
        ring: {
            innerRadius: 2.2,
            outerRadius: 3.3,
            color: "#6ee7b7",
            opacity: 0.8,
            tilt: [Math.PI / 3, 0, Math.PI / 6],
        },
        children: [
            {
                id: "projects-moon-1",
                radius: 0.22,
                rotationSpeed: 0.7,
                orbitRadius: 4.2,
                orbitSpeed: 0.77,
                orbitInclination: 0.008, // ~0.47° (Io-like tight coplanar orbit)
                axialTilt: 0.0,
                color: "#94a3b8",
                terrain: {
                    seed: 45,
                    noiseScale: 2.0,
                    roughness: 0.2,
                    waterLevel: 0,
                    detail: 2,
                },
                palette: {
                    land: "#64748b",
                    mountain: "#475569",
                    peak: "#cbd5e1",
                },
            },
            {
                id: "projects-moon-2",
                radius: 0.15,
                rotationSpeed: 1,
                orbitRadius: 5.0,
                orbitSpeed: 0.43,
                orbitInclination: 0.003, // ~0.18° (Europa-like)
                axialTilt: 0.0,
                color: "#64748b",
                terrain: {
                    seed: 66,
                    noiseScale: 2.4,
                    roughness: 0.18,
                    waterLevel: 0,
                    detail: 2,
                },
                palette: {
                    land: "#475569",
                    mountain: "#334155",
                    peak: "#94a3b8",
                },
            },
        ],
    },
    {
        id: "contact", // Neptune/Saturn analog: slight tilt (~2 degrees)
        radius: 1.0,
        rotationSpeed: 0.6,
        orbitRadius: 28.0,
        orbitSpeed: 0.039,
        initialAngle: Math.PI / 2,
        orbitInclination: 0.031, // ~1.77°
        axialTilt: 0.494, // ~28.3° (Saturn/Neptune-like axial tilt)
        color: "#ff5d8f",
        terrain: {
            seed: 88,
            noiseScale: 1.8,
            roughness: 0.24,
            waterLevel: 0.36,
            detail: 3,
        },
        palette: {
            water: "#be185d",
            coast: "#ec4899",
            land: "#a855f7",
            mountain: "#581c87",
            peak: "#fdf2f8",
        },
        children: [
            {
                id: "contact-moon-1",
                radius: 0.18,
                rotationSpeed: 0.5,
                orbitRadius: 2.0,
                orbitSpeed: 0.61,
                orbitInclination: 0.005,
                axialTilt: 0.0,
                color: "#cbd5e1",
                terrain: {
                    seed: 19,
                    noiseScale: 2.0,
                    roughness: 0.2,
                    waterLevel: 0,
                    detail: 2,
                },
                palette: {
                    land: "#94a3b8",
                    mountain: "#64748b",
                    peak: "#f1f5f9",
                },
            },
        ],
    },
];