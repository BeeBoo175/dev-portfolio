import { useState, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import {
    galaxyStore,
    useGalaxyVisuals,
} from "../../galaxy";
import GalaxyToolbar from "./GalaxyToolbar";
import TargetSelector, { type TargetItem } from "./TargetSelector";
import SunPanel from "./SunPanel";
import AppearancePanel from "./AppearancePanel";
import Orbit3DPanel from "./Orbit3DPanel";
import TerrainPanel from "./TerrainPanel";
import MoonsPanel from "./MoonsPanel";
import AsteroidBeltPanel from "./AsteroidBeltPanel";
import GalaxyDataDialog from "./GalaxyDataDialog";
import { useGalaxyStudioDraft } from "../hooks/useGalaxyStudioDraft";
import "../GalaxyStudio.css";

const TARGET_LIST: TargetItem[] = [
    { id: "home", label: "Sun", type: "sun" },
    { id: "about", label: "About", type: "planet" },
    { id: "skills", label: "Skills", type: "planet" },
    { id: "projects", label: "Projects", type: "planet" },
    { id: "contact", label: "Contact", type: "planet" },
    { id: "asteroid-belt", label: "Asteroids", type: "belt" },
];

export type PlanetTab = "appearance" | "orbit" | "terrain" | "moons";

export interface GalaxyStudioProps {
    focusId: string;
    onFocusChange: (id: string) => void;
    activeTab?: PlanetTab;
    onTabChange?: (tab: PlanetTab) => void;
    activeMoonIndex?: number;
    onSelectMoon?: (index: number) => void;
    isSidebarOpen?: boolean;
    onToggleSidebar?: () => void;
}

export function GalaxyStudio({
    focusId,
    onFocusChange,
    activeTab: activeTabProp,
    onTabChange: onTabChangeProp,
    activeMoonIndex: activeMoonIndexProp,
    onSelectMoon: onSelectMoonProp,
    isSidebarOpen: isSidebarOpenProp,
    onToggleSidebar: onToggleSidebarProp,
}: GalaxyStudioProps) {
    const navigate = useNavigate();
    const visuals = useGalaxyVisuals();

    const {
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
        currentPlanet,
        allWarnings,
        isSavedRef,
        selectedId,
        resolvedSelection,
    } = useGalaxyStudioDraft(focusId);

    const [internalActiveTab, setInternalActiveTab] = useState<PlanetTab>(() => {
        if (resolvedSelection.isMoon && resolvedSelection.tab) {
            return resolvedSelection.tab;
        }
        return "appearance";
    });
    const [internalActiveMoonIndex, setInternalActiveMoonIndex] = useState<number>(() => {
        if (resolvedSelection.isMoon && resolvedSelection.moonIndex !== undefined) {
            return resolvedSelection.moonIndex;
        }
        return 0;
    });
    const [internalIsSidebarOpen, setInternalIsSidebarOpen] = useState<boolean>(() => {
        if (typeof window !== "undefined" && window.innerWidth <= 960) {
            return false;
        }
        return true;
    });

    const [prevFocusId, setPrevFocusId] = useState<string>(focusId);
    if (focusId !== prevFocusId) {
        setPrevFocusId(focusId);
        if (!isSidebarOpenProp) {
            setInternalIsSidebarOpen(true);
        }
        if (resolvedSelection.tab && !activeTabProp) {
            setInternalActiveTab(resolvedSelection.tab);
        }
        if (resolvedSelection.isMoon && resolvedSelection.moonIndex !== undefined && activeMoonIndexProp === undefined) {
            setInternalActiveMoonIndex(resolvedSelection.moonIndex);
        }
    }


    const activeTab = activeTabProp ?? internalActiveTab;
    const activeMoonIndex = activeMoonIndexProp ?? internalActiveMoonIndex;
    const isSidebarOpen = isSidebarOpenProp ?? internalIsSidebarOpen;

    const handleSetActiveTab = useCallback((tab: PlanetTab) => {
        if (onTabChangeProp) {
            onTabChangeProp(tab);
        } else {
            setInternalActiveTab(tab);
        }
    }, [onTabChangeProp]);

    const handleSelectMoon = useCallback((index: number) => {
        if (onSelectMoonProp) {
            onSelectMoonProp(index);
        } else {
            setInternalActiveMoonIndex(index);
        }
    }, [onSelectMoonProp]);

    const handleToggleSidebar = useCallback(() => {
        if (onToggleSidebarProp) {
            onToggleSidebarProp();
        } else {
            setInternalIsSidebarOpen((prev) => !prev);
        }
    }, [onToggleSidebarProp]);



    const [isDataModalOpen, setIsDataModalOpen] = useState<boolean>(false);
    const [isConfirmExitOpen, setIsConfirmExitOpen] = useState<boolean>(false);

    const handleSelectTarget = useCallback((id: string) => {
        onFocusChange(id);
    }, [onFocusChange]);

    const handleExitStudio = () => {
        if (isDirty) {
            setIsConfirmExitOpen(true);
        } else {
            navigate("/");
        }
    };

    const targetLabel = TARGET_LIST.find((t) => t.id === selectedId)?.label || selectedId;

    const renderHeaderActions = () => {
        if (selectedId === "home" || selectedId === "sun") {
            return (
                <button
                    type="button"
                    className="studio-btn studio-btn--ghost studio-btn--sm"
                    onClick={handleResetSun}
                    title="Reset star to original default configuration"
                >
                    Reset
                </button>
            );
        }

        if (selectedId === "asteroid-belt") {
            return (
                <button
                    type="button"
                    className="studio-btn studio-btn--ghost studio-btn--sm"
                    onClick={handleResetBelt}
                    title="Reset asteroid belt to original default configuration"
                >
                    Reset
                </button>
            );
        }

        if (currentPlanet) {
            return (
                <>
                    <button
                        type="button"
                        className={`studio-btn studio-btn--sm ${draftDefaultPlanetId === currentPlanet.id
                                ? "studio-btn--station-active"
                                : "studio-btn--ghost"
                            }`}
                        onClick={() => handleSetDefaultPlanetId(currentPlanet.id, targetLabel)}
                        title={
                            draftDefaultPlanetId === currentPlanet.id
                                ? "Current default starting base for spaceship"
                                : "Set this planet as spaceship default starting base"
                        }
                        aria-pressed={draftDefaultPlanetId === currentPlanet.id}
                    >
                        {draftDefaultPlanetId === currentPlanet.id ? "Ship Base" : "Set Ship Base"}
                    </button>
                    <button
                        type="button"
                        className="studio-btn studio-btn--ghost studio-btn--sm"
                        onClick={() => handleResetCurrentPlanet(targetLabel)}
                        title="Reset this planet to original default configuration"
                    >
                        Reset
                    </button>
                </>
            );
        }

        return null;
    };

    const renderInspectorContent = () => {
        if (selectedId === "home" || selectedId === "sun") {
            return (
                <div className="studio-tab-body">
                    <SunPanel
                        sun={draftSun}
                        onChange={updateSun}
                    />
                </div>
            );
        }

        if (selectedId === "asteroid-belt") {
            return (
                <div className="studio-tab-body">
                    <AsteroidBeltPanel
                        config={draftBelt}
                        onChange={updateBelt}
                    />
                </div>
            );
        }

        if (currentPlanet) {
            return (
                <>
                    <div className="studio-tabs" role="tablist" aria-label="Planet categories">
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
                                role="tab"
                                id={`planet-tab-${tab.id}`}
                                aria-selected={activeTab === tab.id}
                                aria-controls={`planet-panel-${tab.id}`}
                                className={`studio-tab ${activeTab === tab.id ? "studio-tab--active" : ""}`}
                                onClick={() => handleSetActiveTab(tab.id as PlanetTab)}
                            >
                                {tab.label}
                            </button>
                        ))}
                    </div>

                    <div
                        className="studio-tab-body"
                        role="tabpanel"
                        id={`planet-panel-${activeTab}`}
                        aria-labelledby={`planet-tab-${activeTab}`}
                    >
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
                                onSelectMoon={handleSelectMoon}
                                onChange={updatePlanet}
                            />
                        )}
                    </div>
                </>
            );
        }

        return null;
    };

    return (
        <div className={`galaxy-studio-container ${isInteracting ? "galaxy-studio-container--zen" : ""}`}>
            <div className="studio-header-area">
                <GalaxyToolbar
                    visuals={visuals}
                    isDirty={isDirty}
                    canUndo={canUndo}
                    canRedo={canRedo}
                    onUndo={handleUndo}
                    onRedo={handleRedo}
                    isCameraOrbitPaused={!!visuals?.freezeCameraOrbit}
                    onTogglePauseCameraOrbit={() => galaxyStore.toggleFreezeCameraOrbit()}
                    onToggleOrbitPaths={() => galaxyStore.toggleOrbitPaths()}
                    onToggleOrbitalAxes={() => galaxyStore.toggleOrbitalAxes()}
                    onToggleSelectionGlow={() => galaxyStore.toggleSelectionGlow()}
                    onTogglePlanetNames={() => galaxyStore.togglePlanetNames()}
                    onToggleBackgroundPhenomena={() => galaxyStore.toggleBackgroundPhenomena()}
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
                onToggleSidebar={handleToggleSidebar}
            />

            <aside className={`studio-sidebar ${isSidebarOpen ? "studio-sidebar--open" : "studio-sidebar--collapsed"}`}>
                <button
                    type="button"
                    className="studio-sidebar__toggle-btn"
                    onClick={(e) => {
                        handleToggleSidebar();
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
                                {targetLabel}
                            </h2>
                        </div>

                        <div className="studio-sidebar__header-actions">
                            {renderHeaderActions()}
                        </div>
                    </div>

                    {renderInspectorContent()}
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
                        role="dialog"
                        aria-modal="true"
                        aria-labelledby="studio-confirm-title"
                    >
                        <div className="studio-confirm-title" id="studio-confirm-title">
                            Unapplied Changes
                        </div>
                        <div className="studio-confirm-text">
                            You have working modifications in Galaxy Studio. Would you like to keep your draft saved locally for your next session or discard it?
                        </div>
                        <div className="studio-confirm-actions">
                            <button
                                type="button"
                                className="studio-btn studio-btn--ghost studio-btn--sm"
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
                                className="studio-btn studio-btn--danger studio-btn--sm"
                                onClick={() => {
                                    handleConfirmDiscardAndExit();
                                    navigate("/");
                                }}
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
