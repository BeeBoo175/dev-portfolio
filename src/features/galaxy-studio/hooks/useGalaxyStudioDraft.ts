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
} from "../../galaxy";
import { generateRandomGalaxy } from "../presets";
import { resolveTargetSelection } from "../utils/studioTarget";

export const DRAFT_STORAGE_KEY = "portfolio_galaxy_studio_draft_v1";


export interface GalaxyDraftState {
    planets: OrbitConfig[];
    asteroidBelt: AsteroidBeltConfig;
    sun: SunConfig;
    defaultPlanetId: string;
}

export function loadInitialDraft(savedState: GalaxyDraftState): GalaxyDraftState {
    try {
        const raw = sessionStorage.getItem(DRAFT_STORAGE_KEY) || localStorage.getItem(DRAFT_STORAGE_KEY);
        if (raw) {
            const parsed = JSON.parse(raw);
            if (parsed && Array.isArray(parsed.planets) && parsed.asteroidBelt && parsed.sun) {
                return parsed;
            }
        }
    } catch (e) {
        void e;
    }
    return savedState;
}

export function useGalaxyStudioDraft(targetId: string) {
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

    const [history, setHistory] = useState<GalaxyDraftState[]>([structuredClone(initialDraft)]);
    const [historyIndex, setHistoryIndex] = useState<number>(0);
    const isHistoryAction = useRef<boolean>(false);
    const historyIndexRef = useRef<number>(0);
    const historyRef = useRef<GalaxyDraftState[]>([structuredClone(initialDraft)]);

    const isSavedRef = useRef<boolean>(false);
    const isExplicitDiscardRef = useRef<boolean>(false);
    const [toastMessage, setToastMessage] = useState<string | null>(null);

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
        historyIndexRef.current = historyIndex;
        historyRef.current = history;
        currentDraftRef.current = currentDraft;
    }, [historyIndex, history, currentDraft]);

    const isDirty = JSON.stringify(currentDraft) !== savedSnapshot;

    useEffect(() => {
        if (isExplicitDiscardRef.current) return;

        if (isDirty) {
            try {
                const serialized = JSON.stringify(currentDraft);
                sessionStorage.setItem(DRAFT_STORAGE_KEY, serialized);
                localStorage.setItem(DRAFT_STORAGE_KEY, serialized);
            } catch (e) {
                void e;
            }
        } else {
            try {
                sessionStorage.removeItem(DRAFT_STORAGE_KEY);
                localStorage.removeItem(DRAFT_STORAGE_KEY);
            } catch (e) {
                void e;
            }
        }
    }, [currentDraft, isDirty]);

    const showToast = useCallback((msg: string) => {
        setToastMessage(msg);
        setTimeout(() => setToastMessage(null), 2500);
    }, []);

    const pushHistory = useCallback((nextState: GalaxyDraftState) => {
        if (isHistoryAction.current) {
            isHistoryAction.current = false;
            return;
        }

        setHistory((prev) => {
            const nextHistory = prev.slice(0, historyIndexRef.current + 1);
            if (JSON.stringify(nextHistory[nextHistory.length - 1]) === JSON.stringify(nextState)) {
                return prev;
            }
            const updated = [...nextHistory.slice(-40), structuredClone(nextState)];
            setHistoryIndex(updated.length - 1);
            return updated;
        });
    }, []);

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

    useEffect(() => {
        const handleInteractionRelease = () => {
            const current = currentDraftRef.current;
            const curHistory = historyRef.current;
            const curIdx = historyIndexRef.current;
            const latestCommitted = curHistory[curIdx];

            if (JSON.stringify(current) !== JSON.stringify(latestCommitted)) {
                pushHistory(current);
            }
        };

        window.addEventListener("pointerup", handleInteractionRelease, { capture: true });
        window.addEventListener("mouseup", handleInteractionRelease, { capture: true });
        window.addEventListener("touchend", handleInteractionRelease, { capture: true });
        window.addEventListener("change", handleInteractionRelease, { capture: true });

        return () => {
            window.removeEventListener("pointerup", handleInteractionRelease, { capture: true });
            window.removeEventListener("mouseup", handleInteractionRelease, { capture: true });
            window.removeEventListener("touchend", handleInteractionRelease, { capture: true });
            window.removeEventListener("change", handleInteractionRelease, { capture: true });
        };
    }, [pushHistory]);

    const applyDraftState = useCallback((state: GalaxyDraftState, pushToHistory = false) => {
        setDraftPlanets(state.planets);
        setDraftBelt(state.asteroidBelt);
        setDraftSun(state.sun);
        setDraftDefaultPlanetId(state.defaultPlanetId);
        if (pushToHistory) {
            pushHistory(state);
        }
    }, [pushHistory]);

    const handleUndo = useCallback(() => {
        const current = currentDraftRef.current;
        const curHistory = historyRef.current;
        const curIdx = historyIndexRef.current;
        const latestCommitted = curHistory[curIdx];

        if (JSON.stringify(current) !== JSON.stringify(latestCommitted)) {
            const nextHistory = curHistory.slice(0, curIdx + 1);
            const updated = [...nextHistory.slice(-40), structuredClone(current)];
            const newIndex = updated.length - 1;
            historyRef.current = updated;
            historyIndexRef.current = newIndex;
            setHistory(updated);
            setHistoryIndex(newIndex);
        }

        const activeIdx = historyIndexRef.current;
        const activeHistory = historyRef.current;

        if (activeIdx > 0) {
            const prevIndex = activeIdx - 1;
            const targetState = activeHistory[prevIndex];
            if (targetState) {
                isHistoryAction.current = true;
                setHistoryIndex(prevIndex);
                applyDraftState(targetState, false);
                showToast("Undo");
            }
        }
    }, [applyDraftState, showToast]);

    const handleRedo = useCallback(() => {
        const curIdx = historyIndexRef.current;
        const curHistory = historyRef.current;
        if (curIdx < curHistory.length - 1) {
            const nextIndex = curIdx + 1;
            const targetState = curHistory[nextIndex];
            if (targetState) {
                isHistoryAction.current = true;
                setHistoryIndex(nextIndex);
                applyDraftState(targetState, false);
                showToast("Redo");
            }
        }
    }, [applyDraftState, showToast]);

    useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            const isZ = e.key === "z" || e.key === "Z" || e.code === "KeyZ";
            const isY = e.key === "y" || e.key === "Y" || e.code === "KeyY";
            if ((e.ctrlKey || e.metaKey) && (isZ || isY)) {
                e.preventDefault();
                e.stopPropagation();
                if (isZ) {
                    if (e.shiftKey) {
                        handleRedo();
                    } else {
                        handleUndo();
                    }
                } else if (isY) {
                    handleRedo();
                }
            }
        };

        window.addEventListener("keydown", handleKeyDown, { capture: true });
        return () => window.removeEventListener("keydown", handleKeyDown, { capture: true });
    }, [handleUndo, handleRedo]);

    const resolvedSelection = useMemo(() => {
        return resolveTargetSelection(targetId, draftPlanets);
    }, [targetId, draftPlanets]);

    const selectedId = resolvedSelection.focusId || "home";

    const currentPlanet = draftPlanets.find((p) => p.id === selectedId);
    const defaultPlanetConfig = ORBIT_LAYOUT.find((p) => p.id === selectedId);
    const allWarnings = detectAllGalaxyCollisions(draftPlanets, draftBelt, draftSun);

    useEffect(() => {
        const handleBeforeUnload = (e: BeforeUnloadEvent) => {
            if (isDirty) {
                e.preventDefault();
            }
        };
        window.addEventListener("beforeunload", handleBeforeUnload);
        return () => window.removeEventListener("beforeunload", handleBeforeUnload);
    }, [isDirty]);

    useEffect(() => {
        return () => {
            if (!isSavedRef.current) {
                galaxyStore.revertToPersisted();
            }
        };
    }, []);

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

    const handleSaveAndApply = () => {
        galaxyStore.setPlanets(draftPlanets, true);
        galaxyStore.setAsteroidBelt(draftBelt, true);
        galaxyStore.setSun(draftSun, true);
        galaxyStore.setDefaultPlanetId(draftDefaultPlanetId, true);
        galaxyStore.saveCustomizations();
        isSavedRef.current = true;
        isExplicitDiscardRef.current = true;
        try {
            sessionStorage.removeItem(DRAFT_STORAGE_KEY);
            localStorage.removeItem(DRAFT_STORAGE_KEY);
        } catch (e) {
            void e;
        }
        setSavedSnapshot(JSON.stringify({ planets: draftPlanets, asteroidBelt: draftBelt, sun: draftSun, defaultPlanetId: draftDefaultPlanetId }));
        showToast("Galaxy changes saved successfully.");
    };

    const handleDiscard = () => {
        const snap = JSON.parse(savedSnapshot);
        applyDraftState(snap, true);
        isExplicitDiscardRef.current = true;
        try {
            sessionStorage.removeItem(DRAFT_STORAGE_KEY);
            localStorage.removeItem(DRAFT_STORAGE_KEY);
        } catch (e) {
            void e;
        }
        showToast("Reverted working draft to saved galaxy.");
    };

    const handleConfirmDiscardAndExit = () => {
        isExplicitDiscardRef.current = true;
        try {
            sessionStorage.removeItem(DRAFT_STORAGE_KEY);
            localStorage.removeItem(DRAFT_STORAGE_KEY);
        } catch (e) {
            void e;
        }
        galaxyStore.revertToPersisted();
        isSavedRef.current = true;
    };

    const handleRandomizeAll = () => {
        const randomized = generateRandomGalaxy(draftPlanets, draftBelt, draftSun);
        applyDraftState({
            planets: randomized.planets,
            asteroidBelt: randomized.asteroidBelt,
            sun: randomized.sun,
            defaultPlanetId: draftDefaultPlanetId,
        }, true);
        showToast("Generated new procedural galaxy.");
    };

    const handleResolveCollisions = () => {
        const { resolvedPlanets } = resolveGalaxyCollisions(draftPlanets, draftBelt, draftSun);
        applyDraftState({
            planets: resolvedPlanets,
            asteroidBelt: draftBelt,
            sun: draftSun,
            defaultPlanetId: draftDefaultPlanetId,
        }, true);
        showToast("Auto-adjusted orbits to eliminate collisions.");
    };

    const handleImportData = (data: {
        planets?: OrbitConfig[];
        asteroidBelt?: AsteroidBeltConfig;
        sun?: SunConfig;
        defaultPlanetId?: string;
    }) => {
        const nextDraft: GalaxyDraftState = {
            planets: data.planets ?? draftPlanets,
            asteroidBelt: data.asteroidBelt ?? draftBelt,
            sun: data.sun ?? draftSun,
            defaultPlanetId: data.defaultPlanetId ?? draftDefaultPlanetId,
        };
        applyDraftState(nextDraft, true);
        showToast("System JSON imported successfully.");
    };

    const handleResetCurrentPlanet = (label?: string) => {
        if (!defaultPlanetConfig || !currentPlanet) return;
        const fresh = structuredClone(defaultPlanetConfig);
        updatePlanet(() => fresh);
        showToast(`Reset ${label || selectedId} to original defaults.`);
    };

    const handleResetSun = () => {
        const freshSun = structuredClone(DEFAULT_SUN);
        updateSun(() => freshSun);
        showToast("Reset Sun to original defaults.");
    };

    const handleResetBelt = () => {
        const freshBelt = structuredClone(DEFAULT_ASTEROID_BELT);
        updateBelt(() => freshBelt);
        showToast("Reset Asteroid Belt to original defaults.");
    };

    const handleResetAllDefaults = () => {
        applyDraftState({
            planets: structuredClone(ORBIT_LAYOUT),
            asteroidBelt: structuredClone(DEFAULT_ASTEROID_BELT),
            sun: structuredClone(DEFAULT_SUN),
            defaultPlanetId: DEFAULT_SPACESHIP_PLANET_ID,
        }, true);
        showToast("Reset entire galaxy to original default configuration.");
    };

    return {
        draftPlanets,
        draftBelt,
        draftSun,
        draftDefaultPlanetId,
        isDirty,
        isInteracting,
        canUndo: historyIndex > 0,
        canRedo: historyIndex < history.length - 1,
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
        isSavedRef,
        selectedId,
        resolvedSelection,
    };
}

export default useGalaxyStudioDraft;

