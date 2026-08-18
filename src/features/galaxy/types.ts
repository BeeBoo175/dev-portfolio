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

export interface SunConfig {
    id: string;
    radius: number;
    rotationSpeed: number;
    color: string;
    glowIntensity: number;
    lightIntensity: number;
    cameraOrbitSpeed?: number;
    palette?: PaletteConfig;
}

export interface OrbitConfig {
    id: string;
    radius: number;
    rotationSpeed: number;
    orbitRadius?: number;
    orbitSpeed?: number;
    initialAngle?: number;
    orbitInclination?: number;
    orbitAscendingNode?: number;
    orbitArgument?: number;
    axialTilt?: number;
    color?: string;
    palette?: PaletteConfig;
    terrain?: PlanetTerrainConfig;
    ring?: RingConfig;
    children?: OrbitConfig[];
}

export interface AsteroidBeltConfig {
    enabled: boolean;
    innerRadius: number;
    outerRadius: number;
    count: number;
    minSize: number;
    maxSize: number;
    orbitSpeed: number;
    heightSpread: number;
    inclination?: number;
    ascendingNode?: number;
    argument?: number;
    color?: string;
    secondaryColor?: string;
    seed?: number;
}

export interface GalaxyVisualSettings {
    showOrbitPaths: boolean;
    showOrbitalAxes: boolean;
    showSelectionGlow?: boolean;
    showPlanetNames?: boolean;
    freezeCameraOrbit?: boolean;
    showBackgroundPhenomena?: boolean;
}