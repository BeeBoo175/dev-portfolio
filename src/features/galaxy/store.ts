import { useSyncExternalStore } from "react";
import type { AsteroidBeltConfig, GalaxyVisualSettings, OrbitConfig, SunConfig } from "./types";
import { DEFAULT_ASTEROID_BELT, DEFAULT_SUN, DEFAULT_SPACESHIP_PLANET_ID, ORBIT_LAYOUT } from "./data";

const STORAGE_KEY = "portfolio_custom_planets_v1";
const VISUALS_KEY = "portfolio_galaxy_visuals_v1";
const ASTEROID_BELT_KEY = "portfolio_asteroid_belt_v1";
const SUN_KEY = "portfolio_sun_config_v1";
const DEFAULT_PLANET_KEY = "portfolio_default_planet_v1";

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
            if (!override) return def;
            return {
                ...def,
                ...override,
                ring: override.ring,
                children: override.children,
            };
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
    } catch (e) {
        void e;
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
    } catch (e) {
        void e;
    }
    return cloneDefaultSun();
}

function loadPersistedVisuals(): GalaxyVisualSettings {
    try {
        const raw = localStorage.getItem(VISUALS_KEY);
        if (raw) {
            return {
                showOrbitPaths: true,
                showOrbitalAxes: false,
                showSelectionGlow: true,
                showPlanetNames: true,
                freezeCameraOrbit: false,
                ...JSON.parse(raw),
            };
        }
    } catch (e) {
        void e;
    }
    return {
        showOrbitPaths: true,
        showOrbitalAxes: false,
        showSelectionGlow: true,
        showPlanetNames: true,
        freezeCameraOrbit: false,
    };
}

function loadPersistedDefaultPlanetId(): string {
    try {
        const raw = localStorage.getItem(DEFAULT_PLANET_KEY);
        if (raw) return raw;
    } catch (e) {
        void e;
    }
    return DEFAULT_SPACESHIP_PLANET_ID;
}

function initLocalStorageDefaultsIfEmpty() {
    try {
        if (!localStorage.getItem(STORAGE_KEY)) {
            localStorage.setItem(STORAGE_KEY, JSON.stringify(cloneDefaultPlanets()));
        }
        if (!localStorage.getItem(ASTEROID_BELT_KEY)) {
            localStorage.setItem(ASTEROID_BELT_KEY, JSON.stringify(cloneDefaultAsteroidBelt()));
        }
        if (!localStorage.getItem(SUN_KEY)) {
            localStorage.setItem(SUN_KEY, JSON.stringify(cloneDefaultSun()));
        }
        if (!localStorage.getItem(VISUALS_KEY)) {
            localStorage.setItem(VISUALS_KEY, JSON.stringify({ showOrbitPaths: true, showOrbitalAxes: false, showSelectionGlow: true, showPlanetNames: true }));
        }
        if (!localStorage.getItem(DEFAULT_PLANET_KEY)) {
            localStorage.setItem(DEFAULT_PLANET_KEY, DEFAULT_SPACESHIP_PLANET_ID);
        }
    } catch (e) {
        void e;
    }
}

initLocalStorageDefaultsIfEmpty();

class GalaxyStore {
    private planets: OrbitConfig[] = loadPersistedPlanets();
    private asteroidBelt: AsteroidBeltConfig = loadPersistedAsteroidBelt();
    private sun: SunConfig = loadPersistedSun();
    private visuals: GalaxyVisualSettings = loadPersistedVisuals();
    private defaultPlanetId: string = loadPersistedDefaultPlanetId();
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

    getDefaultPlanetIdSnapshot = () => {
        return this.defaultPlanetId;
    };

    subscribe = (listener: () => void) => {
        this.listeners.add(listener);
        return () => {
            this.listeners.delete(listener);
        };
    };

    private notify(persist = false) {
        if (persist) {
            try {
                localStorage.setItem(STORAGE_KEY, JSON.stringify(this.planets));
                localStorage.setItem(ASTEROID_BELT_KEY, JSON.stringify(this.asteroidBelt));
                localStorage.setItem(SUN_KEY, JSON.stringify(this.sun));
                localStorage.setItem(VISUALS_KEY, JSON.stringify(this.visuals));
                localStorage.setItem(DEFAULT_PLANET_KEY, this.defaultPlanetId);
            } catch (e) {
                void e;
            }
        }
        this.listeners.forEach((l) => l());
    }

    saveCustomizations() {
        this.notify(true);
    }

    revertToPersisted() {
        this.planets = loadPersistedPlanets();
        this.asteroidBelt = loadPersistedAsteroidBelt();
        this.sun = loadPersistedSun();
        this.visuals = loadPersistedVisuals();
        this.defaultPlanetId = loadPersistedDefaultPlanetId();
        this.notify(false);
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
        this.notify(false);
    }

    updateAsteroidBelt(updates: Partial<AsteroidBeltConfig>) {
        this.asteroidBelt = {
            ...this.asteroidBelt,
            ...updates,
        };
        this.notify(false);
    }

    updateSun(updates: Partial<SunConfig>) {
        this.sun = {
            ...this.sun,
            ...updates,
            palette: updates.palette ? { ...this.sun.palette, ...updates.palette } : this.sun.palette,
        };
        this.notify(false);
    }

    setPlanets(newPlanets: OrbitConfig[], persist = false) {
        this.planets = newPlanets;
        this.notify(persist);
    }

    setAsteroidBelt(newBelt: AsteroidBeltConfig, persist = false) {
        this.asteroidBelt = newBelt;
        this.notify(persist);
    }

    setSun(newSun: SunConfig, persist = false) {
        this.sun = newSun;
        this.notify(persist);
    }

    setDefaultPlanetId(id: string, persist = false) {
        this.defaultPlanetId = id;
        this.notify(persist);
    }

    resetPlanet(id: string) {
        const defaults = cloneDefaultPlanets();
        const defaultPlanet = defaults.find((p) => p.id === id);
        if (!defaultPlanet) return;

        this.planets = this.planets.map((p) => (p.id === id ? defaultPlanet : p));
        this.notify(false);
    }

    resetAsteroidBelt() {
        this.asteroidBelt = cloneDefaultAsteroidBelt();
        this.notify(false);
    }

    resetSun() {
        this.sun = cloneDefaultSun();
        this.notify(false);
    }

    resetDefaultPlanetId() {
        this.defaultPlanetId = DEFAULT_SPACESHIP_PLANET_ID;
        this.notify(false);
    }

    resetAll() {
        this.planets = cloneDefaultPlanets();
        this.asteroidBelt = cloneDefaultAsteroidBelt();
        this.sun = cloneDefaultSun();
        this.visuals = {
            showOrbitPaths: true,
            showOrbitalAxes: false,
            showSelectionGlow: true,
            showPlanetNames: true,
            freezeCameraOrbit: false,
        };
        this.defaultPlanetId = DEFAULT_SPACESHIP_PLANET_ID;
        try {
            localStorage.removeItem(STORAGE_KEY);
            localStorage.removeItem(ASTEROID_BELT_KEY);
            localStorage.removeItem(SUN_KEY);
            localStorage.removeItem(VISUALS_KEY);
            localStorage.removeItem(DEFAULT_PLANET_KEY);
        } catch (e) {
            void e;
        }
        this.listeners.forEach((l) => l());
    }

    toggleOrbitPaths() {
        this.visuals = { ...this.visuals, showOrbitPaths: !this.visuals.showOrbitPaths };
        this.notify(true);
    }

    toggleOrbitalAxes() {
        this.visuals = { ...this.visuals, showOrbitalAxes: !this.visuals.showOrbitalAxes };
        this.notify(true);
    }

    toggleSelectionGlow() {
        const current = this.visuals.showSelectionGlow !== false;
        this.visuals = { ...this.visuals, showSelectionGlow: !current };
        this.notify(true);
    }

    togglePlanetNames() {
        const current = this.visuals.showPlanetNames !== false;
        this.visuals = { ...this.visuals, showPlanetNames: !current };
        this.notify(true);
    }

    toggleFreezeCameraOrbit() {
        this.visuals = { ...this.visuals, freezeCameraOrbit: !this.visuals.freezeCameraOrbit };
        this.notify(true);
    }

    setVisualSettings(updates: Partial<GalaxyVisualSettings>) {
        this.visuals = { ...this.visuals, ...updates };
        this.notify(true);
    }

    exportJSON(): string {
        return JSON.stringify(
            {
                planets: this.planets,
                asteroidBelt: this.asteroidBelt,
                sun: this.sun,
                defaultPlanetId: this.defaultPlanetId,
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
                if (typeof parsed.defaultPlanetId === "string") {
                    this.defaultPlanetId = parsed.defaultPlanetId;
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

export function useGalaxyDefaultPlanetId(): string {
    return useSyncExternalStore(galaxyStore.subscribe, galaxyStore.getDefaultPlanetIdSnapshot);
}

