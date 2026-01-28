export interface PaletteConfig {
    water?: string;
    coast?: string;
    land?: string;
    mountain?: string;
    peak?: string;
}

export interface PlanetTerrainConfig {
    seed?: number;
    noiseScale?: number;
    roughness?: number;
    waterLevel?: number;
    detail?: number;
}

export interface RingConfig {
    innerRadius: number;
    outerRadius: number;
    color: string;
    opacity?: number;
    tilt?: [number, number, number];
}

export interface OrbitConfig {
    id: string;
    radius: number;
    rotationSpeed: number;
    orbitRadius?: number;
    orbitSpeed?: number;
    initialAngle?: number;
    color?: string;
    palette?: PaletteConfig;
    terrain?: PlanetTerrainConfig;
    ring?: RingConfig;
    children?: OrbitConfig[];
}

export interface GalaxyVisualSettings {
    showOrbitPaths: boolean;
    showOrbitalAxes: boolean;
}