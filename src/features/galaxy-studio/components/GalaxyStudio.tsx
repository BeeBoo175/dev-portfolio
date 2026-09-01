import { useState, useCallback, useEffect, useRef, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import type { AsteroidBeltConfig, OrbitConfig, SunConfig } from "../../galaxy";
import {
    galaxyStore,
    useGalaxyVisuals,
    detectAllGalaxyCollisions,
    resolveGalaxyCollisions,
    ORBIT_LAYOUT,
    DEFAULT_SUN,
    DEFAULT_ASTEROID_BELT,
    DEFAULT_SPACESHIP_PLANET_ID,
} from "../../galaxy";
import { generateRandomGalaxy } from "../presets";
import GalaxyToolbar from "./GalaxyToolbar";
import TargetSelector, { type TargetItem } from "./TargetSelector";
import SunPanel from "./SunPanel";
import AppearancePanel from "./AppearancePanel";
import Orbit3DPanel from "./Orbit3DPanel";
import TerrainPanel from "./TerrainPanel";
import MoonsPanel from "./MoonsPanel";
import AsteroidBeltPanel from "./AsteroidBeltPanel";
import GalaxyDataDialog from "./GalaxyDataDialog";
import "../GalaxyStudio.css";

const TARGET_LIST: TargetItem[] = [
    { id: "home", label: "Sun", type: "sun" },
    { id: "about", label: "About", type: "planet" },
    { id: "skills", label: "Skills", type: "planet" },
    { id: "projects", label: "Projects", type: "planet" },
    { id: "contact", label: "Contact", type: "planet" },
    { id: "asteroid-belt", label: "Asteroids", type: "belt" },
];

type PlanetTab = "appearance" | "orbit" | "terrain" | "moons";

const DRAFT_STORAGE_KEY = "portfolio_galaxy_studio_draft_v1";

interface GalaxyDraftState {
    planets: OrbitConfig[];
    asteroidBelt: AsteroidBeltConfig;
    sun: SunConfig;
    defaultPlanetId: string;
}

function loadInitialDraft(savedState: GalaxyDraftState): GalaxyDraftState {
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

export interface GalaxyStudioProps {
    focusId: string;
    onFocusChange: (id: string) => void;
}

export function GalaxyStudio({ focusId, onFocusChange }: GalaxyStudioProps) {
    const navigate = useNavigate();
    const visuals = useGalaxyVisuals();

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
    const selectedId = focusId || "home";
    const [activeTab, setActiveTab] = useState<PlanetTab>("appearance");
    const [activeMoonIndex, setActiveMoonIndex] = useState<number>(0);
    const [isSidebarOpen, setIsSidebarOpen] = useState<boolean>(() => {
        if (typeof window !== "undefined" && window.innerWidth <= 1280) {
            return false;
        }
        return true;
    });
    const [isDataModalOpen, setIsDataModalOpen] = useState<boolean>(false);
    const [isConfirmExitOpen, setIsConfirmExitOpen] = useState<boolean>(false);
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
        const handlePopState = () => {
            if (isDirty) {
                window.history.pushState(null, "", window.location.href);
                setIsConfirmExitOpen(true);
            }
        };

        window.addEventListener("popstate", handlePopState);
        return () => {
            window.removeEventListener("popstate", handlePopState);
        };
    }, [isDirty]);

    useEffect(() => {
        return () => {
            if (!isSavedRef.current) {
                galaxyStore.revertToPersisted();
            }
        };
    }, []);

    const handleSelectTarget = useCallback((id: string) => {
        onFocusChange(id);
    }, [onFocusChange]);

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

    const handleSetDefaultPlanetId = useCallback((id: string) => {
        setDraftDefaultPlanetId(id);
        pushHistory({
            planets: draftPlanets,
            asteroidBelt: draftBelt,
            sun: draftSun,
            defaultPlanetId: id,
        });
        const planetLabel = TARGET_LIST.find((t) => t.id === id)?.label || id;
        showToast(`Spaceship default base station set to ${planetLabel}.`);
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

    const handleExitStudio = () => {
        if (isDirty) {
            setIsConfirmExitOpen(true);
        } else {
            navigate("/");
        }
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
        navigate("/");
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

    const handleResetCurrentPlanet = () => {
        if (!defaultPlanetConfig || !currentPlanet) return;
        const fresh = structuredClone(defaultPlanetConfig);
        updatePlanet(() => fresh);
        showToast(`Reset ${TARGET_LIST.find((t) => t.id === selectedId)?.label || selectedId} to original defaults.`);
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

    return (
        <div className={`galaxy-studio-container ${isInteracting ? "galaxy-studio-container--zen" : ""}`}>
            <div className="studio-header-area">
                <GalaxyToolbar
                    visuals={visuals}
                    isDirty={isDirty}
                    canUndo={historyIndex > 0}
                    canRedo={historyIndex < history.length - 1}
                    onUndo={handleUndo}
                    onRedo={handleRedo}
                    isCameraOrbitPaused={!!visuals?.freezeCameraOrbit}
                    onTogglePauseCameraOrbit={() => galaxyStore.toggleFreezeCameraOrbit()}
                    onToggleOrbitPaths={() => galaxyStore.toggleOrbitPaths()}
                    onToggleOrbitalAxes={() => galaxyStore.toggleOrbitalAxes()}
                    onToggleSelectionGlow={() => galaxyStore.toggleSelectionGlow()}
                    onTogglePlanetNames={() => galaxyStore.togglePlanetNames()}
                    onRandomizeAll={handleRandomizeAll}
                    onResetGalaxy={handleResetAllDefaults}
                    onOpenDataModal={() => setIsDataModalOpen(true)}
                    onSaveAndApply={handleSaveAndApply}
                    onDiscard={handleDiscard}
                    onExit={handleExitStudio}
                />

                {allWarnings.length > 0 && (
                    <aside
                        className="studio-collision-banner"
                        role="alert"
                        aria-label="Orbit collision warning"
                    >
                        <span className="studio-collision-banner__text">
                            {allWarnings.length === 1 ? "1 Orbit Collision Detected" : `${allWarnings.length} Orbit Collisions Detected`}
                        </span>
                        <button
                            type="button"
                            className="studio-collision-banner__btn"
                            onClick={handleResolveCollisions}
                            title="Automatically space out intersecting orbits to safe orbital distances"
                        >
                            Fix Orbits
                        </button>
                    </aside>
                )}
            </div>

            <TargetSelector
                targets={TARGET_LIST}
                selectedId={selectedId}
                onSelectTarget={handleSelectTarget}
                sun={draftSun}
                planets={draftPlanets}
                asteroidBelt={draftBelt}
                defaultPlanetId={draftDefaultPlanetId}
                isSidebarOpen={isSidebarOpen}
                onToggleSidebar={() => setIsSidebarOpen(!isSidebarOpen)}
            />

            <aside className={`studio-sidebar ${isSidebarOpen ? "studio-sidebar--open" : "studio-sidebar--collapsed"}`}>
                <button
                    type="button"
                    className="studio-sidebar__toggle-btn"
                    onClick={(e) => {
                        setIsSidebarOpen(!isSidebarOpen);
                        e.currentTarget.blur();
                    }}
                    aria-expanded={isSidebarOpen}
                    title={isSidebarOpen ? "Collapse Inspector" : "Expand Inspector"}
                    aria-label="Toggle inspector panel"
                >
                    <span className="studio-sidebar__toggle-icon studio-sidebar__toggle-icon--desktop">
                        {isSidebarOpen ? "▸" : "◂"}
                    </span>
                    <span className="studio-sidebar__toggle-label studio-sidebar__toggle-label--mobile">
                        {isSidebarOpen ? "▼ Inspector" : "▲ Inspector"}
                    </span>
                </button>

                <div className="studio-sidebar__content">
                    <div className="studio-sidebar__header">
                        <div className="studio-sidebar__header-info">
                            <span className="studio-sidebar__target-type">
                                {selectedId === "home" || selectedId === "sun"
                                    ? "Star"
                                    : selectedId === "asteroid-belt"
                                        ? "Debris Belt"
                                        : "Planet"}
                            </span>
                            <h2 className="studio-sidebar__target-name">
                                {TARGET_LIST.find((t) => t.id === selectedId)?.label || selectedId}
                            </h2>
                        </div>

                        <div className="studio-sidebar__header-actions">
                            {currentPlanet && (
                                <button
                                    type="button"
                                    className={`studio-btn studio-btn--sm ${draftDefaultPlanetId === currentPlanet.id
                                        ? "studio-btn--station-active"
                                        : "studio-btn--ghost"
                                        }`}
                                    onClick={() => handleSetDefaultPlanetId(currentPlanet.id)}
                                    title={
                                        draftDefaultPlanetId === currentPlanet.id
                                            ? "Current default starting base for spaceship"
                                            : "Set this planet as spaceship default starting base"
                                    }
                                    aria-pressed={draftDefaultPlanetId === currentPlanet.id}
                                >
                                    {draftDefaultPlanetId === currentPlanet.id ? "Ship Base" : "Set Ship Base"}
                                </button>
                            )}

                            {selectedId === "home" || selectedId === "sun" ? (
                                <button
                                    type="button"
                                    className="studio-btn studio-btn--ghost studio-btn--sm"
                                    onClick={handleResetSun}
                                    title="Reset star to original default configuration"
                                >
                                    Reset
                                </button>
                            ) : selectedId === "asteroid-belt" ? (
                                <button
                                    type="button"
                                    className="studio-btn studio-btn--ghost studio-btn--sm"
                                    onClick={handleResetBelt}
                                    title="Reset asteroid belt to original default configuration"
                                >
                                    Reset
                                </button>
                            ) : currentPlanet ? (
                                <button
                                    type="button"
                                    className="studio-btn studio-btn--ghost studio-btn--sm"
                                    onClick={handleResetCurrentPlanet}
                                    title="Reset this planet to original default configuration"
                                >
                                    Reset
                                </button>
                            ) : null}
                        </div>
                    </div>

                    {selectedId === "home" || selectedId === "sun" ? (
                        <div className="studio-tab-body">
                            <SunPanel
                                sun={draftSun}
                                onChange={updateSun}
                            />
                        </div>
                    ) : selectedId === "asteroid-belt" ? (
                        <div className="studio-tab-body">
                            <AsteroidBeltPanel
                                config={draftBelt}
                                onChange={updateBelt}
                            />
                        </div>
                    ) : currentPlanet ? (
                        <>
                            <nav className="studio-tabs" aria-label="Planet categories">
                                {[
                                    { id: "appearance", label: "Appearance" },
                                    { id: "orbit", label: "Orbit 3D" },
                                    { id: "terrain", label: "Terrain" },
                                    {
                                        id: "moons",
                                        label: `Moons (${currentPlanet.children?.length || 0})`,
                                    },
                                ].map((tab) => (
                                    <button
                                        key={tab.id}
                                        type="button"
                                        className={`studio-tab ${activeTab === tab.id ? "studio-tab--active" : ""
                                            }`}
                                        onClick={() => setActiveTab(tab.id as PlanetTab)}
                                    >
                                        {tab.label}
                                    </button>
                                ))}
                            </nav>

                            <div className="studio-tab-body">
                                {activeTab === "appearance" && (
                                    <AppearancePanel
                                        planet={currentPlanet}
                                        onChange={updatePlanet}
                                    />
                                )}

                                {activeTab === "orbit" && (
                                    <Orbit3DPanel
                                        planet={currentPlanet}
                                        onChange={updatePlanet}
                                    />
                                )}

                                {activeTab === "terrain" && (
                                    <TerrainPanel
                                        planet={currentPlanet}
                                        onChange={updatePlanet}
                                    />
                                )}

                                {activeTab === "moons" && (
                                    <MoonsPanel
                                        planet={currentPlanet}
                                        activeMoonIndex={activeMoonIndex}
                                        onSelectMoon={setActiveMoonIndex}
                                        onChange={updatePlanet}
                                    />
                                )}
                            </div>
                        </>
                    ) : null}
                </div>
            </aside>

            {isConfirmExitOpen && (
                <div
                    className="studio-modal-backdrop"
                    onClick={() => setIsConfirmExitOpen(false)}
                >
                    <div
                        className="studio-confirm-dialog"
                        onClick={(e) => e.stopPropagation()}
                    >
                        <div className="studio-confirm-title">
                            Unapplied Changes
                        </div>
                        <div className="studio-confirm-text">
                            You have working modifications in Galaxy Studio. Would you like to keep your draft saved locally for your next session or discard it?
                        </div>
                        <div className="studio-confirm-actions">
                            <button
                                type="button"
                                className="studio-btn studio-btn--outline studio-btn--sm"
                                onClick={() => setIsConfirmExitOpen(false)}
                            >
                                Keep Editing
                            </button>
                            <button
                                type="button"
                                className="studio-btn studio-btn--secondary studio-btn--sm"
                                onClick={() => {
                                    isSavedRef.current = true;
                                    navigate("/");
                                }}
                                title="Exit to portfolio now. Your in-progress edits will remain safely saved in draft for when you return."
                            >
                                Keep Draft & Exit
                            </button>
                            <button
                                type="button"
                                className="studio-btn studio-btn--primary studio-btn--sm"
                                style={{
                                    background: "var(--destructive)",
                                    borderColor: "var(--destructive)",
                                }}
                                onClick={handleConfirmDiscardAndExit}
                                title="Permanently discard all unapplied draft changes and revert to your published galaxy"
                            >
                                Discard & Exit
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {toastMessage && (
                <div className="studio-toast" role="status">
                    {toastMessage}
                </div>
            )}

            <GalaxyDataDialog
                isOpen={isDataModalOpen}
                planets={draftPlanets}
                asteroidBelt={draftBelt}
                sun={draftSun}
                defaultPlanetId={draftDefaultPlanetId}
                onClose={() => setIsDataModalOpen(false)}
                onImport={handleImportData}
                onResetDefaults={handleResetAllDefaults}
            />
        </div>
    );
}

export default GalaxyStudio;
