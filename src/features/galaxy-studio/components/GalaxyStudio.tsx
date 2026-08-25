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

type PlanetTab = "appearance" | "orbit" | "terrain" | "moons";

export interface GalaxyStudioProps {
    focusId: string;
    onFocusChange: (id: string) => void;
}

export function GalaxyStudio({ focusId, onFocusChange }: GalaxyStudioProps) {
    const navigate = useNavigate();
    const visuals = useGalaxyVisuals();
    const selectedId = focusId || "home";

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
    } = useGalaxyStudioDraft(selectedId);

    const [activeTab, setActiveTab] = useState<PlanetTab>("appearance");
    const [activeMoonIndex, setActiveMoonIndex] = useState<number>(0);
    const [isSidebarOpen, setIsSidebarOpen] = useState<boolean>(() => {
        if (typeof window !== "undefined" && window.innerWidth <= 960) {
            return false;
        }
        return true;
    });
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
                                {targetLabel}
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
                                    onClick={() => handleResetCurrentPlanet(targetLabel)}
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
                                        className={`studio-tab ${activeTab === tab.id ? "studio-tab--active" : ""
                                            }`}
                                        onClick={() => setActiveTab(tab.id as PlanetTab)}
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
