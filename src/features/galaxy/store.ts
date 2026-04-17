import { useSyncExternalStore } from "react";
import type { AsteroidBeltConfig, GalaxyVisualSettings, OrbitConfig, SunConfig } from "./types";
import { DEFAULT_ASTEROID_BELT, DEFAULT_SUN, ORBIT_LAYOUT } from "./data";

const STORAGE_KEY = "portfolio_custom_planets_v1";
const VISUALS_KEY = "portfolio_galaxy_visuals_v1";
const ASTEROID_BELT_KEY = "portfolio_asteroid_belt_v1";
const SUN_KEY = "portfolio_sun_config_v1";

function cloneDefaultPlanets(): OrbitConfig[] {
    return structuredClone(ORBIT_LAYOUT);
}

function cloneDefaultAsteroidBelt(): AsteroidBeltConfig {
    return structuredClone(DEFAULT_ASTEROID_BELT);
}

function cloneDefaultSun(): SunConfig {
    return structuredClone(DEFAULT_SUN);
}

function loadPersistedPlanets(): OrbitConfig[] {
    try {
        const raw = localStorage.getItem(STORAGE_KEY);
        if (!raw) return cloneDefaultPlanets();
        const parsed = JSON.parse(raw);
        if (!Array.isArray(parsed)) return cloneDefaultPlanets();

        const defaults = cloneDefaultPlanets();
        return defaults.map((def) => {
            const override = parsed.find((p: OrbitConfig) => p.id === def.id);
            return override ? { ...def, ...override } : def;
        });
    } catch {
        return cloneDefaultPlanets();
    }
}

function loadPersistedAsteroidBelt(): AsteroidBeltConfig {
    try {
        const raw = localStorage.getItem(ASTEROID_BELT_KEY);
        if (raw) {
            const parsed = JSON.parse(raw);
            return { ...cloneDefaultAsteroidBelt(), ...parsed };
        }
    } catch {
    }
    return cloneDefaultAsteroidBelt();
}

function loadPersistedSun(): SunConfig {
    try {
        const raw = localStorage.getItem(SUN_KEY);
        if (raw) {
            const parsed = JSON.parse(raw);
            return { ...cloneDefaultSun(), ...parsed };
        }
    } catch {
    }
    return cloneDefaultSun();
}

function loadPersistedVisuals(): GalaxyVisualSettings {
    try {
        const raw = localStorage.getItem(VISUALS_KEY);
        if (raw) return JSON.parse(raw);
    } catch {
    }
    return { showOrbitPaths: true, showOrbitalAxes: false };
}

class GalaxyStore {
    private planets: OrbitConfig[] = loadPersistedPlanets();
    private asteroidBelt: AsteroidBeltConfig = loadPersistedAsteroidBelt();
    private sun: SunConfig = loadPersistedSun();
    private visuals: GalaxyVisualSettings = loadPersistedVisuals();
    private listeners = new Set<() => void>();

    getSnapshot = () => {
        return this.planets;
    };

    getAsteroidBeltSnapshot = () => {
        return this.asteroidBelt;
    };

    getSunSnapshot = () => {
        return this.sun;
    };

    getVisualsSnapshot = () => {
        return this.visuals;
    };

    subscribe = (listener: () => void) => {
        this.listeners.add(listener);
        return () => {
            this.listeners.delete(listener);
        };
    };

    private notify() {
        try {
            localStorage.setItem(STORAGE_KEY, JSON.stringify(this.planets));
            localStorage.setItem(ASTEROID_BELT_KEY, JSON.stringify(this.asteroidBelt));
            localStorage.setItem(SUN_KEY, JSON.stringify(this.sun));
            localStorage.setItem(VISUALS_KEY, JSON.stringify(this.visuals));
        } catch {
        }
        this.listeners.forEach((l) => l());
    }

    updatePlanet(id: string, updates: Partial<OrbitConfig>) {
        this.planets = this.planets.map((p) => {
            if (p.id === id) {
                return {
                    ...p,
                    ...updates,
                    terrain: updates.terrain ? { ...p.terrain, ...updates.terrain } : p.terrain,
                    palette: updates.palette ? { ...p.palette, ...updates.palette } : p.palette,
                    ring: updates.ring !== undefined ? updates.ring : p.ring,
                    children: updates.children !== undefined ? updates.children : p.children,
                };
            }
            return p;
        });
        this.notify();
    }

    updateAsteroidBelt(updates: Partial<AsteroidBeltConfig>) {
        this.asteroidBelt = {
            ...this.asteroidBelt,
            ...updates,
        };
        this.notify();
    }

    updateSun(updates: Partial<SunConfig>) {
        this.sun = {
            ...this.sun,
            ...updates,
            palette: updates.palette ? { ...this.sun.palette, ...updates.palette } : this.sun.palette,
        };
        this.notify();
    }

    setPlanets(newPlanets: OrbitConfig[]) {
        this.planets = newPlanets;
        this.notify();
    }

    setAsteroidBelt(newBelt: AsteroidBeltConfig) {
        this.asteroidBelt = newBelt;
        this.notify();
    }

    setSun(newSun: SunConfig) {
        this.sun = newSun;
        this.notify();
    }

    resetPlanet(id: string) {
        const defaults = cloneDefaultPlanets();
        const defaultPlanet = defaults.find((p) => p.id === id);
        if (!defaultPlanet) return;

        this.planets = this.planets.map((p) => (p.id === id ? defaultPlanet : p));
        this.notify();
    }

    resetAsteroidBelt() {
        this.asteroidBelt = cloneDefaultAsteroidBelt();
        this.notify();
    }

    resetSun() {
        this.sun = cloneDefaultSun();
        this.notify();
    }

    resetAll() {
        this.planets = cloneDefaultPlanets();
        this.asteroidBelt = cloneDefaultAsteroidBelt();
        this.sun = cloneDefaultSun();
        this.visuals = { showOrbitPaths: true, showOrbitalAxes: false };
        try {
            localStorage.removeItem(STORAGE_KEY);
            localStorage.removeItem(ASTEROID_BELT_KEY);
            localStorage.removeItem(SUN_KEY);
            localStorage.removeItem(VISUALS_KEY);
        } catch {
        }
        this.listeners.forEach((l) => l());
    }

    toggleOrbitPaths() {
        this.visuals = { ...this.visuals, showOrbitPaths: !this.visuals.showOrbitPaths };
        this.notify();
    }

    toggleOrbitalAxes() {
        this.visuals = { ...this.visuals, showOrbitalAxes: !this.visuals.showOrbitalAxes };
        this.notify();
    }

    setVisualSettings(updates: Partial<GalaxyVisualSettings>) {
        this.visuals = { ...this.visuals, ...updates };
        this.notify();
    }

    exportJSON(): string {
        return JSON.stringify(
            {
                planets: this.planets,
                asteroidBelt: this.asteroidBelt,
                sun: this.sun,
            },
            null,
            2
        );
    }

    importJSON(jsonString: string): boolean {
        try {
            const parsed = JSON.parse(jsonString);
            if (Array.isArray(parsed)) {
                this.planets = parsed;
                this.notify();
                return true;
            }
            if (parsed && typeof parsed === "object" && Array.isArray(parsed.planets)) {
                this.planets = parsed.planets;
                if (parsed.asteroidBelt && typeof parsed.asteroidBelt === "object") {
                    this.asteroidBelt = { ...cloneDefaultAsteroidBelt(), ...parsed.asteroidBelt };
                }
                if (parsed.sun && typeof parsed.sun === "object") {
                    this.sun = { ...cloneDefaultSun(), ...parsed.sun };
                }
                this.notify();
                return true;
            }
            return false;
        } catch {
            return false;
        }
    }
}

export const galaxyStore = new GalaxyStore();

export function useGalaxyPlanets(): OrbitConfig[] {
    return useSyncExternalStore(galaxyStore.subscribe, galaxyStore.getSnapshot);
}

export function useGalaxyAsteroidBelt(): AsteroidBeltConfig {
    return useSyncExternalStore(galaxyStore.subscribe, galaxyStore.getAsteroidBeltSnapshot);
}

export function useGalaxySun(): SunConfig {
    return useSyncExternalStore(galaxyStore.subscribe, galaxyStore.getSunSnapshot);
}

export function useGalaxyVisuals(): GalaxyVisualSettings {
    return useSyncExternalStore(galaxyStore.subscribe, galaxyStore.getVisualsSnapshot);
}

