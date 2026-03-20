import { useSyncExternalStore } from "react";
import type { GalaxyVisualSettings, OrbitConfig } from "./types";
import { ORBIT_LAYOUT } from "./data";

const STORAGE_KEY = "portfolio_custom_planets_v1";
const VISUALS_KEY = "portfolio_galaxy_visuals_v1";

function cloneDefaultPlanets(): OrbitConfig[] {
    return structuredClone(ORBIT_LAYOUT);
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

function loadPersistedVisuals(): GalaxyVisualSettings {
    try {
        const raw = localStorage.getItem(VISUALS_KEY);
        if (raw) return JSON.parse(raw);
    } catch {
        // Ignored
    }
    return { showOrbitPaths: true, showOrbitalAxes: false };
}

class GalaxyStore {
    private planets: OrbitConfig[] = loadPersistedPlanets();
    private visuals: GalaxyVisualSettings = loadPersistedVisuals();
    private listeners = new Set<() => void>();

    getSnapshot = () => {
        return this.planets;
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
            localStorage.setItem(VISUALS_KEY, JSON.stringify(this.visuals));
        } catch {
            // Ignored
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

    setPlanets(newPlanets: OrbitConfig[]) {
        this.planets = newPlanets;
        this.notify();
    }

    resetPlanet(id: string) {
        const defaults = cloneDefaultPlanets();
        const defaultPlanet = defaults.find((p) => p.id === id);
        if (!defaultPlanet) return;

        this.planets = this.planets.map((p) => (p.id === id ? defaultPlanet : p));
        this.notify();
    }

    resetAll() {
        this.planets = cloneDefaultPlanets();
        this.visuals = { showOrbitPaths: true, showOrbitalAxes: false };
        try {
            localStorage.removeItem(STORAGE_KEY);
            localStorage.removeItem(VISUALS_KEY);
        } catch {
            // Ignored
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
        return JSON.stringify(this.planets, null, 2);
    }

    importJSON(jsonString: string): boolean {
        try {
            const parsed = JSON.parse(jsonString);
            if (!Array.isArray(parsed)) return false;
            this.planets = parsed;
            this.notify();
            return true;
        } catch {
            return false;
        }
    }
}

export const galaxyStore = new GalaxyStore();

export function useGalaxyPlanets(): OrbitConfig[] {
    return useSyncExternalStore(galaxyStore.subscribe, galaxyStore.getSnapshot);
}

export function useGalaxyVisuals(): GalaxyVisualSettings {
    return useSyncExternalStore(galaxyStore.subscribe, galaxyStore.getVisualsSnapshot);
}
