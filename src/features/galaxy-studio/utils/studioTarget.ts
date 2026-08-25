import type { OrbitConfig } from "../../galaxy";

export interface ResolvedSelection {
    focusId: string;
    tab?: "appearance" | "orbit" | "terrain" | "moons";
    moonIndex?: number;
    isMoon: boolean;
}

export function resolveTargetSelection(
    targetId: string,
    planets: OrbitConfig[]
): ResolvedSelection {
    if (!targetId || targetId === "home" || targetId === "sun") {
        return { focusId: "home", isMoon: false };
    }

    if (targetId === "asteroid-belt") {
        return { focusId: "asteroid-belt", isMoon: false };
    }

    const topLevelPlanet = planets.find((p) => p.id === targetId);
    if (topLevelPlanet) {
        return { focusId: topLevelPlanet.id, tab: "appearance", isMoon: false };
    }


    for (const planet of planets) {
        if (planet.children && planet.children.length > 0) {
            const moonIdx = planet.children.findIndex((m) => m.id === targetId);
            if (moonIdx !== -1) {
                return {
                    focusId: planet.id,
                    tab: "moons",
                    moonIndex: moonIdx,
                    isMoon: true,
                };
            }
        }
    }

    return { focusId: "home", isMoon: false };
}
