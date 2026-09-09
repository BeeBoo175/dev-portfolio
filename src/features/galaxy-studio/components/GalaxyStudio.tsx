import { useState, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import {
    galaxyStore,
    useGalaxyVisuals,
} from "../../galaxy";
import StudioToolbar from "./StudioToolbar";
import TargetSelector, { type TargetItem } from "./TargetSelector";
import SunPanel from "./SunPanel";
import AsteroidBeltPanel from "./AsteroidBeltPanel";
import PlanetInspector from "./PlanetInspector";
import StudioSidebarHeader from "./StudioSidebarHeader";
import StudioDataDialog from "./StudioDataDialog";
import StudioConfirmExitDialog from "./StudioConfirmExitDialog";
import { useStudioDraft } from "../hooks/useStudioDraft";
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
        markSaved,
        selectedId,
        resolvedSelection,
    } = useStudioDraft(focusId);

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
                <PlanetInspector
                    currentPlanet={currentPlanet}
                    activeTab={activeTab}
                    onTabChange={handleSetActiveTab}
                    activeMoonIndex={activeMoonIndex}
                    onSelectMoon={handleSelectMoon}
                    onUpdatePlanet={updatePlanet}
                />
            );
        }

        return null;
    };

    return (
        <div className={`galaxy-studio-container ${isInteracting ? "galaxy-studio-container--zen" : ""}`}>
            <div className="studio-header-area">
                <StudioToolbar
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

            <div className="studio-workspace-area">
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
                        <StudioSidebarHeader
                            selectedId={selectedId}
                            targetLabel={targetLabel}
                            currentPlanet={currentPlanet}
                            draftDefaultPlanetId={draftDefaultPlanetId}
                            onResetSun={handleResetSun}
                            onResetBelt={handleResetBelt}
                            onResetCurrentPlanet={handleResetCurrentPlanet}
                            onSetDefaultPlanetId={handleSetDefaultPlanetId}
                        />

                        {renderInspectorContent()}
                    </div>
                </aside>
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

            <StudioConfirmExitDialog
                isOpen={isConfirmExitOpen}
                onClose={() => setIsConfirmExitOpen(false)}
                onKeepDraftAndExit={() => {
                    markSaved();
                    navigate("/");
                }}
                onDiscardAndExit={() => {
                    handleConfirmDiscardAndExit();
                    navigate("/");
                }}
            />

            {toastMessage && (
                <div className="studio-toast" role="status">
                    {toastMessage}
                </div>
            )}

            <StudioDataDialog
                isOpen={isDataModalOpen}
                planets={draftPlanets}
                asteroidBelt={draftBelt}
                sun={draftSun}
                defaultPlanetId={draftDefaultPlanetId}
                onClose={() => setIsDataModalOpen(false)}
                onImport={handleImportData}
            />
        </div>
    );
}

export default GalaxyStudio;
