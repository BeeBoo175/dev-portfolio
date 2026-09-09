import { describe, it, expect, beforeEach } from "vitest";
import { hasSavedWorkingDraft, DRAFT_STORAGE_KEY } from "./draftUtils";
import { galaxyStore } from "../../galaxy";

function createMockStorage(): Storage {
    let store: Record<string, string> = {};
    return {
        getItem: (key: string) => store[key] ?? null,
        setItem: (key: string, value: string) => {
            store[key] = String(value);
        },
        removeItem: (key: string) => {
            delete store[key];
        },
        clear: () => {
            store = {};
        },
        key: (index: number) => Object.keys(store)[index] ?? null,
        get length() {
            return Object.keys(store).length;
        },
    };
}

describe("draftUtils", () => {
    let mockStorage: Storage;

    beforeEach(() => {
        mockStorage = createMockStorage();
        Object.defineProperty(window, "localStorage", {
            value: mockStorage,
            configurable: true,
            writable: true,
        });
        Object.defineProperty(window, "sessionStorage", {
            value: mockStorage,
            configurable: true,
            writable: true,
        });
    });

    it("returns false when no draft is in storage", () => {
        expect(hasSavedWorkingDraft()).toBe(false);
    });

    it("returns false when storage contains invalid json", () => {
        mockStorage.setItem(DRAFT_STORAGE_KEY, "invalid-json{");
        expect(hasSavedWorkingDraft()).toBe(false);
    });

    it("returns true when draft in storage has modifications", () => {
        const planets = galaxyStore.getSnapshot();
        const modifiedPlanets = structuredClone(planets);
        if (modifiedPlanets[0]) {
            modifiedPlanets[0].radius = 99.9;
        }

        mockStorage.setItem("portfolio_custom_planets_v1", JSON.stringify(planets));

        const draftData = {
            planets: modifiedPlanets,
            asteroidBelt: galaxyStore.getAsteroidBeltSnapshot(),
            sun: galaxyStore.getSunSnapshot(),
            defaultPlanetId: galaxyStore.getDefaultPlanetIdSnapshot(),
        };

        mockStorage.setItem(DRAFT_STORAGE_KEY, JSON.stringify(draftData));
        expect(hasSavedWorkingDraft()).toBe(true);
    });

    it("returns false when draft in storage matches saved state exactly", () => {
        const planets = galaxyStore.getSnapshot();
        const belt = galaxyStore.getAsteroidBeltSnapshot();
        const sun = galaxyStore.getSunSnapshot();

        mockStorage.setItem("portfolio_custom_planets_v1", JSON.stringify(planets));
        mockStorage.setItem("portfolio_asteroid_belt_v1", JSON.stringify(belt));
        mockStorage.setItem("portfolio_sun_config_v1", JSON.stringify(sun));

        const draftData = {
            planets,
            asteroidBelt: belt,
            sun,
            defaultPlanetId: galaxyStore.getDefaultPlanetIdSnapshot(),
        };

        mockStorage.setItem(DRAFT_STORAGE_KEY, JSON.stringify(draftData));
        expect(hasSavedWorkingDraft()).toBe(false);
    });
});
