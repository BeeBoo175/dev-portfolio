import type { OrbitConfig, PlanetTerrainConfig } from "../types";

/** Kept apart from the terrain builder so saved data can be cleaned without loading three.js. */
export function stripDetailFromPlanets(planets: OrbitConfig[]): OrbitConfig[] {
    return planets.map((p) => {
        const next = { ...p };
        if (next.terrain && "detail" in (next.terrain as Record<string, unknown>)) {
            const cleanTerrain = { ...next.terrain } as PlanetTerrainConfig & { detail?: number };
            delete cleanTerrain.detail;
            next.terrain = cleanTerrain;
        }
        if (next.children) {
            next.children = stripDetailFromPlanets(next.children);
        }
        return next;
    });
}
