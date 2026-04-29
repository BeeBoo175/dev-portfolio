import { useState, useCallback } from "react";
import type { AsteroidBeltConfig, OrbitConfig, SunConfig } from "../../galaxy";
import {
    galaxyStore,
    useGalaxyPlanets,
    useGalaxyAsteroidBelt,
    useGalaxySun,
    useGalaxyVisuals,
    detectAllGalaxyCollisions,
    resolveGalaxyCollisions,
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

export interface GalaxyStudioProps {
    focusId: string;
    onFocusChange: (id: string) => void;
}

export function GalaxyStudio({ focusId, onFocusChange }: GalaxyStudioProps) {
    const storePlanets = useGalaxyPlanets();
    const storeBelt = useGalaxyAsteroidBelt();
    const storeSun = useGalaxySun();
    const visuals = useGalaxyVisuals();

    const [draftPlanets, setDraftPlanets] = useState<OrbitConfig[]>(() =>
        structuredClone(storePlanets)
    );
    const [draftBelt, setDraftBelt] = useState<AsteroidBeltConfig>(() =>
        structuredClone(storeBelt)
    );
    const [draftSun, setDraftSun] = useState<SunConfig>(() =>
        structuredClone(storeSun)
    );
    const [savedSnapshot, setSavedSnapshot] = useState<string>(() =>
        JSON.stringify({ planets: storePlanets, asteroidBelt: storeBelt, sun: storeSun })
    );

    const selectedId = focusId || "home";
    const [activeTab, setActiveTab] = useState<PlanetTab>("appearance");
    const [activeMoonIndex, setActiveMoonIndex] = useState<number>(0);
    const [isSidebarOpen, setIsSidebarOpen] = useState<boolean>(true);
    const [isDataModalOpen, setIsDataModalOpen] = useState<boolean>(false);
    const [toastMessage, setToastMessage] = useState<string | null>(null);

    const isDirty =
        JSON.stringify({ planets: draftPlanets, asteroidBelt: draftBelt, sun: draftSun }) !==
        savedSnapshot;

    const currentPlanet = draftPlanets.find((p) => p.id === selectedId);
    const allWarnings = detectAllGalaxyCollisions(draftPlanets, draftBelt);

    const showToast = (msg: string) => {
        setToastMessage(msg);
        setTimeout(() => setToastMessage(null), 2500);
    };

    const handleSelectTarget = useCallback((id: string) => {
        onFocusChange(id);
    }, [onFocusChange]);

    const updatePlanet = useCallback((updater: (prev: OrbitConfig) => OrbitConfig) => {
        setDraftPlanets((prevList) => {
            const nextList = prevList.map((p) => (p.id === selectedId ? updater(p) : p));
            galaxyStore.setPlanets(nextList);
            return nextList;
        });
    }, [selectedId]);

    const updateBelt = useCallback((updater: (prev: AsteroidBeltConfig) => AsteroidBeltConfig) => {
        setDraftBelt((prev) => {
            const next = updater(prev);
            galaxyStore.setAsteroidBelt(next);
            return next;
        });
    }, []);

    const updateSun = useCallback((updater: (prev: SunConfig) => SunConfig) => {
        setDraftSun((prev) => {
            const next = updater(prev);
            galaxyStore.setSun(next);
            return next;
        });
    }, []);

    const handleSaveAndApply = () => {
        galaxyStore.setPlanets(draftPlanets);
        galaxyStore.setAsteroidBelt(draftBelt);
        galaxyStore.setSun(draftSun);
        setSavedSnapshot(JSON.stringify({ planets: draftPlanets, asteroidBelt: draftBelt, sun: draftSun }));
        showToast("Galaxy changes saved successfully.");
    };

    const handleDiscard = () => {
        const snap = JSON.parse(savedSnapshot);
        setDraftPlanets(snap.planets);
        setDraftBelt(snap.asteroidBelt);
        setDraftSun(snap.sun);
        galaxyStore.setPlanets(snap.planets);
        galaxyStore.setAsteroidBelt(snap.asteroidBelt);
        galaxyStore.setSun(snap.sun);
        showToast("Changes discarded.");
    };

    const handleRandomizeAll = () => {
        const randomized = generateRandomGalaxy(draftPlanets, draftBelt, draftSun);
        setDraftPlanets(randomized.planets);
        setDraftBelt(randomized.asteroidBelt);
        setDraftSun(randomized.sun);
        galaxyStore.setPlanets(randomized.planets);
        galaxyStore.setAsteroidBelt(randomized.asteroidBelt);
        galaxyStore.setSun(randomized.sun);
        showToast("Generated new procedural galaxy.");
    };

    const handleResolveCollisions = () => {
        const { resolvedPlanets } = resolveGalaxyCollisions(draftPlanets, draftBelt);
        setDraftPlanets(resolvedPlanets);
        galaxyStore.setPlanets(resolvedPlanets);
        showToast("Auto-adjusted orbits to eliminate collisions.");
    };

    const handleImportData = (data: {
        planets?: OrbitConfig[];
        asteroidBelt?: AsteroidBeltConfig;
        sun?: SunConfig;
    }) => {
        if (data.planets) {
            setDraftPlanets(data.planets);
            galaxyStore.setPlanets(data.planets);
        }
        if (data.asteroidBelt) {
            setDraftBelt(data.asteroidBelt);
            galaxyStore.setAsteroidBelt(data.asteroidBelt);
        }
        if (data.sun) {
            setDraftSun(data.sun);
            galaxyStore.setSun(data.sun);
        }
        showToast("System JSON imported successfully.");
    };

    const handleResetAllDefaults = () => {
        galaxyStore.resetAll();
        const freshPlanets = galaxyStore.getSnapshot();
        const freshBelt = galaxyStore.getAsteroidBeltSnapshot();
        const freshSun = galaxyStore.getSunSnapshot();
        setDraftPlanets(structuredClone(freshPlanets));
        setDraftBelt(structuredClone(freshBelt));
        setDraftSun(structuredClone(freshSun));
        setSavedSnapshot(JSON.stringify({ planets: freshPlanets, asteroidBelt: freshBelt, sun: freshSun }));
        showToast("Reset entire system to defaults.");
    };

    return (
        <div className="galaxy-studio-container">
            <GalaxyToolbar
                visuals={visuals}
                isDirty={isDirty}
                warningCount={allWarnings.length}
                onToggleOrbitPaths={() => galaxyStore.toggleOrbitPaths()}
                onToggleOrbitalAxes={() => galaxyStore.toggleOrbitalAxes()}
                onRandomizeAll={handleRandomizeAll}
                onResolveCollisions={handleResolveCollisions}
                onOpenDataModal={() => setIsDataModalOpen(true)}
                onSaveAndApply={handleSaveAndApply}
                onDiscard={handleDiscard}
            />

            <TargetSelector
                targets={TARGET_LIST}
                selectedId={selectedId}
                onSelectTarget={handleSelectTarget}
                sun={draftSun}
                planets={draftPlanets}
            />

            <aside className={`studio-sidebar ${isSidebarOpen ? "studio-sidebar--open" : "studio-sidebar--collapsed"}`}>
                <button
                    type="button"
                    className="studio-sidebar__toggle-btn"
                    onClick={() => setIsSidebarOpen(!isSidebarOpen)}
                    title={isSidebarOpen ? "Collapse Inspector" : "Expand Inspector"}
                    aria-label="Toggle inspector panel"
                >
                    {isSidebarOpen ? ">" : "<"}
                </button>

                {isSidebarOpen && (
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
                        </div>

                        {selectedId === "home" || selectedId === "sun" ? (
                            <div className="studio-tab-body">
                                <SunPanel
                                    sun={draftSun}
                                    onChange={updateSun}
                                    onReset={() => {
                                        galaxyStore.resetSun();
                                        setDraftSun(galaxyStore.getSunSnapshot());
                                    }}
                                />
                            </div>
                        ) : selectedId === "asteroid-belt" ? (
                            <div className="studio-tab-body">
                                <AsteroidBeltPanel
                                    config={draftBelt}
                                    onChange={updateBelt}
                                    onReset={() => {
                                        galaxyStore.resetAsteroidBelt();
                                        setDraftBelt(galaxyStore.getAsteroidBeltSnapshot());
                                    }}
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
                                            className={`studio-tab ${
                                                activeTab === tab.id ? "studio-tab--active" : ""
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
                                            onReset={() => {
                                                galaxyStore.resetPlanet(currentPlanet.id);
                                                const resetPlanet = galaxyStore
                                                    .getSnapshot()
                                                    .find((p) => p.id === currentPlanet.id);
                                                if (resetPlanet) {
                                                    setDraftPlanets((prev) =>
                                                        prev.map((p) => (p.id === currentPlanet.id ? resetPlanet : p))
                                                    );
                                                }
                                            }}
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
                )}
            </aside>

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
                onClose={() => setIsDataModalOpen(false)}
                onImport={handleImportData}
                onResetDefaults={handleResetAllDefaults}
            />
        </div>
    );
}

export default GalaxyStudio;
