import { useState, useCallback, useEffect, useRef, useMemo } from "react";
import type { AsteroidBeltConfig, OrbitConfig, SunConfig } from "../../galaxy";
import {
    galaxyStore,
    detectAllGalaxyCollisions,
    resolveGalaxyCollisions,
    ORBIT_LAYOUT,
    DEFAULT_SUN,
    DEFAULT_ASTEROID_BELT,
    DEFAULT_SPACESHIP_PLANET_ID,
    stripDetailFromPlanets,
} from "../../galaxy";
import { generateRandomGalaxy } from "../presets";
import { resolveTargetSelection } from "../utils/targetUtils";
import { DRAFT_STORAGE_KEY } from "../utils/draftUtils";
import { useDraftHistory } from "./useDraftHistory";
import { useDraftPersistence } from "./useDraftPersistence";
import type { GalaxyDraftState } from "../types";
import { useRadarTransition } from "../../transition";

export { DRAFT_STORAGE_KEY };
export type { GalaxyDraftState };

export function loadInitialDraft(savedState: GalaxyDraftState): GalaxyDraftState {
    try {
        const raw = sessionStorage.getItem(DRAFT_STORAGE_KEY) || localStorage.getItem(DRAFT_STORAGE_KEY);
        if (raw) {
            const parsed = JSON.parse(raw);
            if (parsed && Array.isArray(parsed.planets) && parsed.asteroidBelt && parsed.sun) {
                parsed.planets = stripDetailFromPlanets(parsed.planets);
                return parsed;
            }
        }
    } catch (e) {
        void e;
    }
    return {
        ...savedState,
        planets: stripDetailFromPlanets(savedState.planets),
    };
}

function getSpatialSignature(planets: OrbitConfig[], sun: SunConfig, belt: AsteroidBeltConfig): string {
    let key = `s:${sun.radius}|b:${belt.innerRadius},${belt.outerRadius}|`;
    for (let i = 0; i < planets.length; i++) {
        const p = planets[i];
        key += `p:${p.id},${p.radius},${p.orbitRadius ?? 0},${p.orbitInclination ?? 0},${p.orbitAscendingNode ?? 0},${p.orbitArgument ?? 0}|`;
        if (p.children) {
            for (let j = 0; j < p.children.length; j++) {
                const c = p.children[j];
                key += `c:${c.id},${c.radius},${c.orbitRadius ?? 0}|`;
            }
        }
    }
    return key;
}

const _collisionCache = new Map<string, ReturnType<typeof detectAllGalaxyCollisions>>();

export function useStudioDraft(targetId: string) {
    const { triggerSweep } = useRadarTransition();
    const initialSavedState: GalaxyDraftState = useMemo(() => ({
        planets: galaxyStore.getSnapshot(),
        asteroidBelt: galaxyStore.getAsteroidBeltSnapshot(),
        sun: galaxyStore.getSunSnapshot(),
        defaultPlanetId: galaxyStore.getDefaultPlanetIdSnapshot(),
    }), []);

    const initialDraft = useMemo(() => loadInitialDraft(initialSavedState), [initialSavedState]);

    const [draftPlanets, setDraftPlanets] = useState<OrbitConfig[]>(() =>
        structuredClone(initialDraft.planets)
    );
    const [draftBelt, setDraftBelt] = useState<AsteroidBeltConfig>(() =>
        structuredClone(initialDraft.asteroidBelt)
    );
    const [draftSun, setDraftSun] = useState<SunConfig>(() =>
        structuredClone(initialDraft.sun)
    );
    const [draftDefaultPlanetId, setDraftDefaultPlanetId] = useState<string>(() =>
        initialDraft.defaultPlanetId
    );
    const [savedSnapshot, setSavedSnapshot] = useState<string>(() =>
        JSON.stringify(initialSavedState)
    );

    useEffect(() => {
        galaxyStore.setPlanets(draftPlanets, false);
        galaxyStore.setAsteroidBelt(draftBelt, false);
        galaxyStore.setSun(draftSun, false);
        galaxyStore.setDefaultPlanetId(draftDefaultPlanetId, false);
    }, [draftPlanets, draftBelt, draftSun, draftDefaultPlanetId]);

    const [toastMessage, setToastMessage] = useState<string | null>(null);

    const showToast = useCallback((msg: string) => {
        setToastMessage(msg);
        setTimeout(() => setToastMessage(null), 2500);
    }, []);

    const applyDraftState = useCallback((state: GalaxyDraftState) => {
        setDraftPlanets(state.planets);
        setDraftBelt(state.asteroidBelt);
        setDraftSun(state.sun);
        setDraftDefaultPlanetId(state.defaultPlanetId);
    }, []);

    const currentDraft: GalaxyDraftState = useMemo(
        () => ({
            planets: draftPlanets,
            asteroidBelt: draftBelt,
            sun: draftSun,
            defaultPlanetId: draftDefaultPlanetId,
        }),
        [draftPlanets, draftBelt, draftSun, draftDefaultPlanetId]
    );

    const currentDraftRef = useRef<GalaxyDraftState>(currentDraft);
    useEffect(() => {
        currentDraftRef.current = currentDraft;
    }, [currentDraft]);

    const {
        canUndo,
        canRedo,
        pushHistory,
        handleUndo,
        handleRedo,
        commitOnRelease,
    } = useDraftHistory(initialDraft, currentDraftRef, applyDraftState, showToast);

    const isDirty = JSON.stringify(currentDraft) !== savedSnapshot;

    const {
        markSaved,
        handleConfirmDiscardAndExit,
        clearDraftStorage,
    } = useDraftPersistence(currentDraft, currentDraftRef, isDirty, commitOnRelease);

    const [isInteracting, setIsInteracting] = useState<boolean>(false);

    useEffect(() => {
        const handleInteractionStart = (e: PointerEvent | TouchEvent) => {
            const target = e.target as HTMLElement | null;
            if (target && target.tagName.toLowerCase() === "input" && target.getAttribute("type") === "range") {
                setIsInteracting(true);
                return;
            }
            if (target && (target.closest(".studio-header-area") || target.closest(".studio-toolbar") || target.closest(".studio-collision-banner") || target.closest(".studio-sidebar") || target.closest(".studio-target-dock") || target.closest(".studio-confirm-dialog") || target.closest(".studio-modal-content") || target.closest(".studio-toast"))) {
                return;
            }
            setIsInteracting(true);
        };

        const handleInteractionEnd = () => {
            setIsInteracting(false);
        };

        window.addEventListener("pointerdown", handleInteractionStart);
        window.addEventListener("pointerup", handleInteractionEnd);
        window.addEventListener("pointercancel", handleInteractionEnd);

        return () => {
            window.removeEventListener("pointerdown", handleInteractionStart);
            window.removeEventListener("pointerup", handleInteractionEnd);
            window.removeEventListener("pointercancel", handleInteractionEnd);
        };
    }, []);

    const resolvedSelection = useMemo(
        () => resolveTargetSelection(targetId, draftPlanets),
        [targetId, draftPlanets]
    );
    const selectedId = resolvedSelection.focusId || "home";

    const currentPlanet = draftPlanets.find((p) => p.id === selectedId);
    const allWarnings = useMemo(() => {
        const key = getSpatialSignature(draftPlanets, draftSun, draftBelt);
        const cached = _collisionCache.get(key);
        if (cached) return cached;
        const fresh = detectAllGalaxyCollisions(draftPlanets, draftBelt, draftSun);
        if (_collisionCache.size > 100) {
            _collisionCache.clear();
        }
        _collisionCache.set(key, fresh);
        return fresh;
    }, [draftPlanets, draftBelt, draftSun]);

    const updatePlanet = useCallback((updater: (prev: OrbitConfig) => OrbitConfig) => {
        setDraftPlanets((prevList) => {
            return prevList.map((p) => (p.id === selectedId ? updater(p) : p));
        });
    }, [selectedId]);

    const updateBelt = useCallback((updater: (prev: AsteroidBeltConfig) => AsteroidBeltConfig) => {
        setDraftBelt((prev) => updater(prev));
    }, []);

    const updateSun = useCallback((updater: (prev: SunConfig) => SunConfig) => {
        setDraftSun((prev) => updater(prev));
    }, []);

    const handleSetDefaultPlanetId = useCallback((id: string, label?: string) => {
        setDraftDefaultPlanetId(id);
        pushHistory({
            planets: draftPlanets,
            asteroidBelt: draftBelt,
            sun: draftSun,
            defaultPlanetId: id,
        });
        showToast(`Spaceship default base station set to ${label || id}.`);
    }, [draftBelt, draftPlanets, draftSun, pushHistory, showToast]);

    const handleSaveAndApply = useCallback(() => {
        galaxyStore.setPlanets(draftPlanets, true);
        galaxyStore.setAsteroidBelt(draftBelt, true);
        galaxyStore.setSun(draftSun, true);
        galaxyStore.setDefaultPlanetId(draftDefaultPlanetId, true);
        galaxyStore.saveCustomizations();
        clearDraftStorage();
        setSavedSnapshot(JSON.stringify(currentDraft));
        showToast("Custom galaxy saved and applied successfully.");
    }, [draftPlanets, draftBelt, draftSun, draftDefaultPlanetId, currentDraft, clearDraftStorage, showToast]);

    const handleDiscard = useCallback(() => {
        setDraftPlanets(structuredClone(initialSavedState.planets));
        setDraftBelt(structuredClone(initialSavedState.asteroidBelt));
        setDraftSun(structuredClone(initialSavedState.sun));
        setDraftDefaultPlanetId(initialSavedState.defaultPlanetId);
        applyDraftState(initialSavedState);
        clearDraftStorage();
        galaxyStore.revertToPersisted();
        showToast("Reverted all working changes to stored galaxy.");
    }, [initialSavedState, applyDraftState, clearDraftStorage, showToast]);

    const handleRandomizeAll = useCallback(() => {
        const randomState = generateRandomGalaxy(draftPlanets, draftBelt, draftSun);
        applyDraftState({
            planets: randomState.planets,
            asteroidBelt: randomState.asteroidBelt,
            sun: randomState.sun,
            defaultPlanetId: draftDefaultPlanetId,
        });
        pushHistory({
            planets: randomState.planets,
            asteroidBelt: randomState.asteroidBelt,
            sun: randomState.sun,
            defaultPlanetId: draftDefaultPlanetId,
        });
        showToast("Randomized all planet parameters.");
        triggerSweep();
    }, [draftPlanets, draftBelt, draftSun, draftDefaultPlanetId, applyDraftState, pushHistory, showToast, triggerSweep]);

    const handleResolveCollisions = useCallback(() => {
        const resolved = resolveGalaxyCollisions(draftPlanets, draftBelt, draftSun);
        applyDraftState({
            planets: resolved.resolvedPlanets,
            asteroidBelt: draftBelt,
            sun: draftSun,
            defaultPlanetId: draftDefaultPlanetId,
        });
        pushHistory({
            planets: resolved.resolvedPlanets,
            asteroidBelt: draftBelt,
            sun: draftSun,
            defaultPlanetId: draftDefaultPlanetId,
        });
        showToast("Adjusted orbits to resolve collisions.");
    }, [draftPlanets, draftBelt, draftSun, draftDefaultPlanetId, applyDraftState, pushHistory, showToast]);

    const handleImportData = useCallback((data: {
        planets?: OrbitConfig[];
        asteroidBelt?: AsteroidBeltConfig;
        sun?: SunConfig;
        defaultPlanetId?: string;
    }) => {
        const nextPlanets = data.planets ? stripDetailFromPlanets(data.planets) : draftPlanets;
        const nextBelt = data.asteroidBelt ?? draftBelt;
        const nextSun = data.sun ?? draftSun;
        const nextDefaultPlanetId = data.defaultPlanetId ?? draftDefaultPlanetId;

        applyDraftState({
            planets: nextPlanets,
            asteroidBelt: nextBelt,
            sun: nextSun,
            defaultPlanetId: nextDefaultPlanetId,
        });
        pushHistory({
            planets: nextPlanets,
            asteroidBelt: nextBelt,
            sun: nextSun,
            defaultPlanetId: nextDefaultPlanetId,
        });
        showToast("Imported JSON system configuration.");
    }, [draftPlanets, draftBelt, draftSun, draftDefaultPlanetId, applyDraftState, pushHistory, showToast]);

    const handleResetCurrentPlanet = useCallback((label?: string) => {
        const defaultPlanet = ORBIT_LAYOUT.find((p) => p.id === selectedId);
        if (defaultPlanet) {
            updatePlanet(() => structuredClone(defaultPlanet));
            showToast(`Reset ${label || selectedId} to original defaults.`);
        }
    }, [selectedId, updatePlanet, showToast]);

    const handleResetSun = useCallback(() => {
        const freshSun = structuredClone(DEFAULT_SUN);
        updateSun(() => freshSun);
        showToast("Reset Sun to original defaults.");
    }, [updateSun, showToast]);

    const handleResetBelt = useCallback(() => {
        const freshBelt = structuredClone(DEFAULT_ASTEROID_BELT);
        updateBelt(() => freshBelt);
        showToast("Reset Asteroid Belt to original defaults.");
    }, [updateBelt, showToast]);

    const handleResetAllDefaults = useCallback(() => {
        const resetState = {
            planets: structuredClone(ORBIT_LAYOUT),
            asteroidBelt: structuredClone(DEFAULT_ASTEROID_BELT),
            sun: structuredClone(DEFAULT_SUN),
            defaultPlanetId: DEFAULT_SPACESHIP_PLANET_ID,
        };
        const hasChanges =
            JSON.stringify(stripDetailFromPlanets(draftPlanets)) !== JSON.stringify(stripDetailFromPlanets(resetState.planets)) ||
            JSON.stringify(draftBelt) !== JSON.stringify(resetState.asteroidBelt) ||
            JSON.stringify(draftSun) !== JSON.stringify(resetState.sun) ||
            draftDefaultPlanetId !== resetState.defaultPlanetId;

        applyDraftState(resetState);
        pushHistory(resetState);
        showToast("Reset entire galaxy to original default configuration.");
        if (hasChanges) {
            triggerSweep();
        }
    }, [draftPlanets, draftBelt, draftSun, draftDefaultPlanetId, applyDraftState, pushHistory, showToast, triggerSweep]);

    return {
        draftPlanets,
        draftBelt,
        draftSun,
        draftDefaultPlanetId,
        isDirty,
        isInteracting,
        canUndo,
        canRedo,
        handleUndo,
        handleRedo,
        updatePlanet,
        updateBelt,
        updateSun,
        handleSetDefaultPlanetId,
        handleSaveAndApply,
        handleDiscard,
        handleConfirmDiscardAndExit,
        handleRandomizeAll,
        handleResolveCollisions,
        handleImportData,
        handleResetCurrentPlanet,
        handleResetSun,
        handleResetBelt,
        handleResetAllDefaults,
        toastMessage,
        showToast,
        currentPlanet,
        allWarnings,
        markSaved,
        selectedId,
        resolvedSelection,
    };
}

export default useStudioDraft;
