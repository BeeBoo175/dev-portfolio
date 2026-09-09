import { stripDetailFromPlanets } from "../../galaxy";

export const DRAFT_STORAGE_KEY = "portfolio_galaxy_studio_draft_v1";
const PERSISTED_PLANETS_KEY = "portfolio_custom_planets_v1";
const PERSISTED_BELT_KEY = "portfolio_asteroid_belt_v1";
const PERSISTED_SUN_KEY = "portfolio_sun_config_v1";

export function hasSavedWorkingDraft(): boolean {
    try {
        if (typeof window === "undefined") return false;
        const raw =
            window.sessionStorage.getItem(DRAFT_STORAGE_KEY) ||
            window.localStorage.getItem(DRAFT_STORAGE_KEY);
        if (!raw) return false;

        const parsed = JSON.parse(raw);
        if (
            !parsed ||
            !Array.isArray(parsed.planets) ||
            !parsed.asteroidBelt ||
            !parsed.sun
        ) {
            return false;
        }

        const persistedRaw = window.localStorage.getItem(PERSISTED_PLANETS_KEY);
        if (persistedRaw) {
            try {
                const persistedPlanets = JSON.parse(persistedRaw);
                const draftClean = stripDetailFromPlanets(parsed.planets);
                const persistedClean = stripDetailFromPlanets(persistedPlanets);
                const isPlanetsSame = JSON.stringify(draftClean) === JSON.stringify(persistedClean);

                const beltRaw = window.localStorage.getItem(PERSISTED_BELT_KEY);
                const sunRaw = window.localStorage.getItem(PERSISTED_SUN_KEY);
                const isBeltSame = !beltRaw || JSON.stringify(parsed.asteroidBelt) === JSON.stringify(JSON.parse(beltRaw));
                const isSunSame = !sunRaw || JSON.stringify(parsed.sun) === JSON.stringify(JSON.parse(sunRaw));

                if (isPlanetsSame && isBeltSame && isSunSame) {
                    return false;
                }
            } catch {
                return true;
            }
        }

        return true;
    } catch {
        return false;
    }
}
