import type { AsteroidBeltConfig, OrbitConfig, SunConfig } from "../galaxy";

export type PlanetTab = "appearance" | "orbit" | "terrain" | "moons";

export interface GalaxyDraftState {
    planets: OrbitConfig[];
    asteroidBelt: AsteroidBeltConfig;
    sun: SunConfig;
    defaultPlanetId: string;
}

export interface ResolvedSelection {
    focusId: string;
    tab?: PlanetTab;
    moonIndex?: number;
    isMoon: boolean;
}
