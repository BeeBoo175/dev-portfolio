import { useSyncExternalStore } from "react";
import type { OrbitConfig } from "./types";
import { ORBIT_LAYOUT } from "./data";

const STORAGE_KEY = "portfolio_custom_planets_v1";

function cloneDefaultPlanets(): OrbitConfig[] {
    return JSON.parse(JSON.stringify(ORBIT_LAYOUT));
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

class GalaxyStore {
    private planets: OrbitConfig[] = loadPersistedPlanets();
    private listeners = new Set<() => void>();

    getSnapshot = () => {
        return this.planets;
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
                };
            }
            return p;
        });
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
        localStorage.removeItem(STORAGE_KEY);
        this.listeners.forEach((l) => l());
    }
}

export const galaxyStore = new GalaxyStore();

export function useGalaxyPlanets(): OrbitConfig[] {
    return useSyncExternalStore(galaxyStore.subscribe, galaxyStore.getSnapshot);
}
