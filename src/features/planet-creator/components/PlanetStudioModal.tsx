import { useState, useEffect } from "react";
import type { OrbitConfig, PaletteConfig } from "../../galaxy";
import {
    galaxyStore,
    useGalaxyPlanets,
    useGalaxyVisuals,
    ORBIT_LAYOUT,
    detectAllGalaxyCollisions,
    resolveGalaxyCollisions,
} from "../../galaxy";
import { BIOME_PRESETS, generateRandomTerrain, generateRandomGalaxy } from "../presets";
import PlanetPreviewCanvas from "./PlanetPreviewCanvas";
import TerrainPanel from "./TerrainPanel";
import AppearancePanel from "./AppearancePanel";
import MoonsPanel from "./MoonsPanel";
import OrbitPanel from "./OrbitPanel";
import GalaxyDataDialog from "./GalaxyDataDialog";
import "../PlanetStudio.css";

const EDITABLE_TARGETS = [
    { id: "about", label: "About" },
    { id: "skills", label: "Skills" },
    { id: "projects", label: "Projects" },
    { id: "contact", label: "Contact" },
];

type CategoryTab = "terrain" | "appearance" | "moons" | "orbit";

export interface PlanetStudioModalProps {
    focusId?: string;
}

export function PlanetStudioModal({ focusId }: PlanetStudioModalProps) {
    const [isOpen, setIsOpen] = useState(false);
    const planets = useGalaxyPlanets();
    const visuals = useGalaxyVisuals();

    const [draftPlanets, setDraftPlanets] = useState<OrbitConfig[]>(() =>
        JSON.parse(JSON.stringify(planets))
    );
    const [savedSnapshot, setSavedSnapshot] = useState<string>(() =>
        JSON.stringify(planets)
    );
    const [selectedId, setSelectedId] = useState<string>("about");
    const [activeTab, setActiveTab] = useState<CategoryTab>("terrain");
    const [activeMoonIndex, setActiveMoonIndex] = useState<number>(0);
    const [isDataModalOpen, setIsDataModalOpen] = useState(false);
    const [isConfirmCloseOpen, setIsConfirmCloseOpen] = useState(false);

    const [toastMessage, setToastMessage] = useState<string | null>(null);
    const [importJsonText, setImportJsonText] = useState("");

    const isDirty = JSON.stringify(draftPlanets) !== savedSnapshot;
    const draftPlanet =
        draftPlanets.find((p) => p.id === selectedId) ?? draftPlanets[0];
    const allGalaxyWarnings = detectAllGalaxyCollisions(draftPlanets);

    const updateDraftPlanet = (updater: (prev: OrbitConfig) => OrbitConfig) => {
        setDraftPlanets((prevList) =>
            prevList.map((p) => (p.id === selectedId ? updater(p) : p))
        );
    };

    const requestClose = () => {
        if (isDirty) {
            setIsConfirmCloseOpen(true);
        } else {
            setIsOpen(false);
        }
    };

    const handleConfirmDiscard = () => {
        setIsConfirmCloseOpen(false);
        setIsOpen(false);
    };

    useEffect(() => {
        if (!isOpen) return;

        const html = document.documentElement;
        html.classList.add("planet-studio-open");

        const handleKeyDown = (e: KeyboardEvent) => {
            if (e.key === "Escape") {
                if (isConfirmCloseOpen) {
                    setIsConfirmCloseOpen(false);
                } else if (isDataModalOpen) {
                    setIsDataModalOpen(false);
                } else {
                    requestClose();
                }
            }
        };

        window.addEventListener("keydown", handleKeyDown);

        return () => {
            html.classList.remove("planet-studio-open");
            window.removeEventListener("keydown", handleKeyDown);
        };
    }, [isOpen, isDirty, isConfirmCloseOpen, isDataModalOpen]);

    const handleOpen = () => {
        const fresh = JSON.parse(JSON.stringify(planets));
        setDraftPlanets(fresh);
        setSavedSnapshot(JSON.stringify(planets));
        const targetId =
            focusId && EDITABLE_TARGETS.some((t) => t.id === focusId)
                ? focusId
                : "about";
        setSelectedId(targetId);
        setActiveMoonIndex(0);
        setIsConfirmCloseOpen(false);
        setIsOpen(true);
    };

    const handleSelectTarget = (id: string) => {
        setSelectedId(id);
        setActiveMoonIndex(0);
    };

    useEffect(() => {
        if (!toastMessage) return;
        const timer = setTimeout(() => setToastMessage(null), 2500);
        return () => clearTimeout(timer);
    }, [toastMessage]);

    if (!draftPlanet && isOpen) return null;

    const handleRandomize = () => {
        const { terrain, palette, color } = generateRandomTerrain();
        updateDraftPlanet((prev) => ({
            ...prev,
            terrain,
            palette,
            color,
            ring: prev.ring
                ? {
                    ...prev.ring,
                    color: palette.coast ?? palette.land ?? color,
                }
                : undefined,
        }));
    };

    const handleSelectBiome = (preset: (typeof BIOME_PRESETS)[0]) => {
        updateDraftPlanet((prev) => ({
            ...prev,
            terrain: { ...preset.terrain },
            palette: { ...preset.palette },
            color: preset.color,
            ring: prev.ring
                ? {
                    ...prev.ring,
                    color: preset.palette.coast ?? preset.color,
                }
                : undefined,
        }));
    };

    const handleTerrainChange = (
        key: keyof NonNullable<OrbitConfig["terrain"]>,
        val: number
    ) => {
        updateDraftPlanet((prev) => ({
            ...prev,
            terrain: {
                ...prev.terrain,
                [key]: val,
            },
        }));
    };

    const handlePaletteChange = (key: keyof PaletteConfig, val: string) => {
        updateDraftPlanet((prev) => ({
            ...prev,
            palette: {
                ...prev.palette,
                [key]: val,
            },
        }));
    };

    const handleRingColorChange = (val: string) => {
        updateDraftPlanet((prev) => {
            if (!prev.ring) return prev;
            return {
                ...prev,
                ring: {
                    ...prev.ring,
                    color: val,
                },
            };
        });
    };

    const handleRingParamChange = (
        key: "innerRadius" | "outerRadius" | "opacity",
        val: number
    ) => {
        updateDraftPlanet((prev) => {
            if (!prev.ring) return prev;
            return {
                ...prev,
                ring: {
                    ...prev.ring,
                    [key]: val,
                },
            };
        });
    };

    const handleRingToggle = () => {
        updateDraftPlanet((prev) => {
            if (prev.ring) {
                return {
                    ...prev,
                    ring: undefined,
                };
            }
            const rad = prev.radius ?? 1;
            return {
                ...prev,
                ring: {
                    innerRadius: Number((rad * 1.5).toFixed(2)),
                    outerRadius: Number((rad * 2.3).toFixed(2)),
                    color: prev.palette?.coast ?? prev.color ?? "#38bdf8",
                    opacity: 0.8,
                    tilt: [Math.PI / 3, 0, Math.PI / 6],
                },
            };
        });
        setActiveTab("appearance");
    };

    const handleOrbitalChange = (
        key:
            | "radius"
            | "orbitRadius"
            | "orbitSpeed"
            | "rotationSpeed"
            | "initialAngle"
            | "axialTilt"
            | "orbitInclination",
        val: number
    ) => {
        updateDraftPlanet((prev) => ({
            ...prev,
            [key]: val,
        }));
    };

    const handleAddMoon = () => {
        const currentMoons = draftPlanet.children ?? [];
        const baseRad = draftPlanet.radius ?? 1.0;
        const orbitDist = Number(
            (baseRad * 1.8 + currentMoons.length * 0.9).toFixed(2)
        );

        const newMoon: OrbitConfig = {
            id: `${draftPlanet.id}-moon-${Date.now().toString().slice(-4)}`,
            radius: 0.22,
            rotationSpeed: 0.5,
            orbitRadius: orbitDist,
            orbitSpeed: Number((0.9 - currentMoons.length * 0.15).toFixed(2)),
            color: "#cbd5e1",
            terrain: {
                seed: Math.floor(Math.random() * 200),
                noiseScale: 2.0,
                roughness: 0.2,
                waterLevel: 0,
                detail: 2,
            },
            palette: {
                land: "#94a3b8",
                mountain: "#64748b",
                peak: "#e2e8f0",
            },
        };

        const updated = [...currentMoons, newMoon];
        updateDraftPlanet((prev) => ({
            ...prev,
            children: updated,
        }));
        setActiveMoonIndex(updated.length - 1);
        setToastMessage(`Added Moon #${updated.length}`);
    };

    const handleRemoveMoon = (moonId: string) => {
        const updated = (draftPlanet.children ?? []).filter(
            (m) => m.id !== moonId
        );
        updateDraftPlanet((prev) => ({
            ...prev,
            children: updated,
        }));
        setActiveMoonIndex(Math.max(0, updated.length - 1));
    };

    const handleMoonChange = (
        moonId: string,
        updates: Partial<OrbitConfig>
    ) => {
        updateDraftPlanet((prev) => ({
            ...prev,
            children: (prev.children ?? []).map((m) => {
                if (m.id === moonId) {
                    return {
                        ...m,
                        ...updates,
                        terrain: updates.terrain
                            ? { ...m.terrain, ...updates.terrain }
                            : m.terrain,
                        palette: updates.palette
                            ? { ...m.palette, ...updates.palette }
                            : m.palette,
                    };
                }
                return m;
            }),
        }));
    };

    const handleApply = () => {
        galaxyStore.setPlanets(draftPlanets);
        setSavedSnapshot(JSON.stringify(draftPlanets));
        setToastMessage("Applied changes to Galaxy!");
    };

    const handleReset = () => {
        const defaultPlanet = ORBIT_LAYOUT.find((p) => p.id === selectedId);
        if (defaultPlanet) {
            updateDraftPlanet(() => JSON.parse(JSON.stringify(defaultPlanet)));
            setToastMessage(`Reset ${selectedId.toUpperCase()} to defaults (Unsaved)`);
        }
    };

    const handleResetAll = () => {
        setDraftPlanets(JSON.parse(JSON.stringify(ORBIT_LAYOUT)));
        setToastMessage("Reset all planets to defaults (Unsaved)");
    };

    const handleRandomizeGalaxy = () => {
        const randomized = generateRandomGalaxy(draftPlanets);
        setDraftPlanets(randomized);
        setToastMessage("Galaxy randomized! Click Apply to save.");
    };

    const handleResolveCollisions = () => {
        const { resolvedPlanets, changedCount } = resolveGalaxyCollisions(draftPlanets);
        if (changedCount > 0) {
            setDraftPlanets(resolvedPlanets);
            setToastMessage(`Resolved ${changedCount} orbital path(s)! Click Apply to save.`);
        } else {
            setToastMessage("All orbital paths are already clear!");
        }
    };

    const handleExportJSON = () => {
        const json = JSON.stringify(draftPlanets, null, 2);
        navigator.clipboard.writeText(json);
        setToastMessage("Draft Galaxy JSON copied to clipboard");
    };

    const handleImportJSON = () => {
        if (!importJsonText.trim()) return;
        const success = galaxyStore.importJSON(importJsonText);
        if (success) {
            const imported = galaxyStore.getSnapshot();
            setDraftPlanets(JSON.parse(JSON.stringify(imported)));
            setSavedSnapshot(JSON.stringify(imported));
            setToastMessage("Galaxy JSON imported successfully");
            setImportJsonText("");
            setIsDataModalOpen(false);
        } else {
            setToastMessage("Invalid JSON format");
        }
    };

    return (
        <>
            <button
                className="planet-lab-trigger"
                onClick={handleOpen}
                title="Open Planet Studio"
            >
                <span className="planet-lab-trigger__dot" />
                <span>Planet Lab</span>
            </button>

            {isOpen && draftPlanet && (
                <div
                    className="planet-studio-backdrop"
                    onClick={requestClose}
                    onWheel={(e) => e.stopPropagation()}
                    onTouchMove={(e) => e.stopPropagation()}
                >
                    <div
                        className="planet-studio"
                        onClick={(e) => e.stopPropagation()}
                    >
                        {toastMessage && (
                            <div className="planet-studio__toast-container">
                                <div className="planet-studio__toast">
                                    {toastMessage}
                                </div>
                            </div>
                        )}
                        <div className="planet-studio__header">
                            <div className="planet-studio__title">
                                <span>Planet Lab</span>
                            </div>
                            <div className="planet-studio__header-actions">
                                <button
                                    className={`planet-studio__toggle-btn ${visuals.showOrbitPaths
                                            ? "planet-studio__toggle-btn--active"
                                            : ""
                                        }`}
                                    onClick={() => galaxyStore.toggleOrbitPaths()}
                                    title="Toggle 3D Circular Orbit Trajectories"
                                >
                                    Orbits: {visuals.showOrbitPaths ? "ON" : "OFF"}
                                </button>
                                <button
                                    className={`planet-studio__toggle-btn ${visuals.showOrbitalAxes
                                            ? "planet-studio__toggle-btn--active"
                                            : ""
                                        }`}
                                    onClick={() => galaxyStore.toggleOrbitalAxes()}
                                    title="Toggle Polar Rotational Spin Axes"
                                >
                                    Axes: {visuals.showOrbitalAxes ? "ON" : "OFF"}
                                </button>
                                <button
                                    className="planet-studio__data-btn"
                                    onClick={() => setIsDataModalOpen(true)}
                                    title="Import or Export Galaxy JSON"
                                >
                                    Backup / Data
                                </button>
                                <button
                                    className="planet-studio__close-btn"
                                    onClick={requestClose}
                                    aria-label="Close"
                                >
                                    &times;
                                </button>
                            </div>
                        </div>

                        <div className="planet-studio__body">
                            <div className="planet-studio__preview-pane">
                                <div className="planet-studio__canvas-wrapper">
                                    <PlanetPreviewCanvas planet={draftPlanet} />
                                </div>

                                <div className="planet-studio__quick-actions">
                                    <button
                                        className="planet-studio__btn planet-studio__btn--primary"
                                        onClick={handleRandomize}
                                        style={{ flex: 1 }}
                                    >
                                        Roll Random
                                    </button>
                                    <button
                                        className="planet-studio__btn planet-studio__btn--secondary"
                                        onClick={handleRingToggle}
                                        style={{ flex: 1 }}
                                    >
                                        {draftPlanet.ring
                                            ? "Remove Ring"
                                            : "Add Ring"}
                                    </button>
                                </div>

                                <div className="planet-studio__biomes">
                                    <span className="planet-studio__section-label">
                                        Biome Presets
                                    </span>
                                    <div className="planet-studio__biome-grid">
                                        {BIOME_PRESETS.map((preset) => (
                                            <button
                                                key={preset.id}
                                                className="planet-studio__biome-chip"
                                                onClick={() =>
                                                    handleSelectBiome(preset)
                                                }
                                            >
                                                <span
                                                    className="planet-studio__biome-dot"
                                                    style={{
                                                        background:
                                                            preset.color,
                                                    }}
                                                />
                                                <span>{preset.name}</span>
                                            </button>
                                        ))}
                                    </div>
                                </div>
                            </div>

                            <div className="planet-studio__controls-pane">
                                <div className="planet-studio__target-tabs">
                                    {EDITABLE_TARGETS.map((t) => {
                                        const isWarned = allGalaxyWarnings.some(
                                            (w) =>
                                                w.id.toLowerCase().includes(t.id) ||
                                                w.description.toLowerCase().includes(t.id)
                                        );
                                        return (
                                            <button
                                                key={t.id}
                                                className={`planet-studio__target-tab ${selectedId === t.id
                                                        ? "planet-studio__target-tab--active"
                                                        : ""
                                                    }`}
                                                onClick={() =>
                                                    handleSelectTarget(t.id)
                                                }
                                            >
                                                <span>{t.label}</span>
                                                {isWarned && (
                                                    <span
                                                        className="planet-studio__tab-warn-badge"
                                                        title="This planet has an orbital conflict"
                                                    >
                                                        ⚠️
                                                    </span>
                                                )}
                                            </button>
                                        );
                                    })}
                                </div>

                                {allGalaxyWarnings.length > 0 && (
                                    <div className="planet-studio__global-collision-banner">
                                        <div className="planet-studio__global-collision-header">
                                            <div className="planet-studio__global-collision-title">
                                                <span>⚠️</span>
                                                <span>
                                                    {allGalaxyWarnings.length} Orbital Collision
                                                    {allGalaxyWarnings.length > 1 ? "s" : ""} Detected
                                                </span>
                                            </div>
                                            <button
                                                className="planet-studio__global-resolve-btn"
                                                onClick={handleResolveCollisions}
                                                title="Automatically adjust orbits minimally to clear all collisions"
                                            >
                                                Auto-Resolve Orbits
                                            </button>
                                        </div>
                                        <div className="planet-studio__global-collision-list">
                                            {allGalaxyWarnings.map((w, idx) => (
                                                <div
                                                    key={`${w.id}-${idx}`}
                                                    className="planet-studio__global-collision-item"
                                                >
                                                    <strong>{w.title}:</strong> {w.description}
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                )}

                                <div className="planet-studio__category-nav">
                                    <button
                                        className={`planet-studio__category-btn ${activeTab === "terrain"
                                                ? "planet-studio__category-btn--active"
                                                : ""
                                            }`}
                                        onClick={() => setActiveTab("terrain")}
                                    >
                                        Terrain
                                    </button>
                                    <button
                                        className={`planet-studio__category-btn ${activeTab === "appearance"
                                                ? "planet-studio__category-btn--active"
                                                : ""
                                            }`}
                                        onClick={() =>
                                            setActiveTab("appearance")
                                        }
                                    >
                                        Appearance
                                    </button>
                                    <button
                                        className={`planet-studio__category-btn ${activeTab === "moons"
                                                ? "planet-studio__category-btn--active"
                                                : ""
                                            }`}
                                        onClick={() => setActiveTab("moons")}
                                    >
                                        Moons (
                                        {(draftPlanet.children ?? []).length})
                                    </button>
                                    <button
                                        className={`planet-studio__category-btn ${activeTab === "orbit"
                                                ? "planet-studio__category-btn--active"
                                                : ""
                                            }`}
                                        onClick={() => setActiveTab("orbit")}
                                    >
                                        Orbit &amp; Spin
                                    </button>
                                </div>

                                <div className="planet-studio__tab-content">
                                    {activeTab === "terrain" && (
                                        <TerrainPanel
                                            draftPlanet={draftPlanet}
                                            onTerrainChange={
                                                handleTerrainChange
                                            }
                                        />
                                    )}

                                    {activeTab === "appearance" && (
                                        <AppearancePanel
                                            draftPlanet={draftPlanet}
                                            onPaletteChange={
                                                handlePaletteChange
                                            }
                                            onRingColorChange={
                                                handleRingColorChange
                                            }
                                            onRingParamChange={
                                                handleRingParamChange
                                            }
                                        />
                                    )}

                                    {activeTab === "moons" && (
                                        <MoonsPanel
                                            draftPlanet={draftPlanet}
                                            activeMoonIndex={activeMoonIndex}
                                            onSelectMoon={setActiveMoonIndex}
                                            onAddMoon={handleAddMoon}
                                            onRemoveMoon={handleRemoveMoon}
                                            onMoonChange={handleMoonChange}
                                        />
                                    )}

                                    {activeTab === "orbit" && (
                                        <OrbitPanel
                                            draftPlanet={draftPlanet}
                                            onOrbitalChange={
                                                handleOrbitalChange
                                            }
                                        />
                                    )}
                                </div>
                            </div>
                        </div>

                        <div className="planet-studio__footer">
                            <div className="planet-studio__footer-left">
                                <button
                                    className="planet-studio__btn planet-studio__btn--secondary planet-studio__btn--footer"
                                    onClick={handleReset}
                                >
                                    Reset Planet
                                </button>
                                <button
                                    className="planet-studio__btn planet-studio__btn--secondary planet-studio__btn--footer"
                                    onClick={handleResetAll}
                                >
                                    Reset All Defaults
                                </button>
                                <button
                                    className="planet-studio__btn planet-studio__btn--secondary planet-studio__btn--footer"
                                    onClick={handleRandomizeGalaxy}
                                    title="Procedurally randomize all planets, biomes, orbits, and moons across the entire galaxy"
                                >
                                    Randomize Galaxy
                                </button>
                                <button
                                    className="planet-studio__btn planet-studio__btn--secondary planet-studio__btn--footer"
                                    onClick={handleResolveCollisions}
                                    title="Automatically adjust orbital distances to resolve all collisions with minimal changes"
                                >
                                    Resolve Collisions
                                </button>
                            </div>

                            <div className="planet-studio__footer-right">
                                <button
                                    className="planet-studio__btn planet-studio__btn--primary planet-studio__btn--footer"
                                    onClick={handleApply}
                                    disabled={!isDirty}
                                >
                                    Apply to Galaxy
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {isConfirmCloseOpen && (
                <div
                    className="planet-studio__dialog-backdrop"
                    onClick={() => setIsConfirmCloseOpen(false)}
                >
                    <div
                        className="planet-studio__confirm-dialog"
                        onClick={(e) => e.stopPropagation()}
                    >
                        <div className="planet-studio__confirm-title">
                            <span>⚠️</span>
                            <span>Unsaved Changes</span>
                        </div>
                        <div className="planet-studio__confirm-text">
                            You have unsaved modifications in Planet Lab. Are you sure you want to discard them and exit?
                        </div>
                        <div className="planet-studio__confirm-actions">
                            <button
                                className="planet-studio__btn planet-studio__btn--secondary"
                                onClick={() => setIsConfirmCloseOpen(false)}
                            >
                                Keep Editing
                            </button>
                            <button
                                className="planet-studio__btn planet-studio__btn--primary"
                                style={{
                                    background: "var(--destructive)",
                                    borderColor: "var(--destructive)",
                                }}
                                onClick={handleConfirmDiscard}
                            >
                                Discard &amp; Exit
                            </button>
                        </div>
                    </div>
                </div>
            )}

            <GalaxyDataDialog
                isOpen={isDataModalOpen}
                importJsonText={importJsonText}
                onTextChange={setImportJsonText}
                onExportJSON={handleExportJSON}
                onImportJSON={handleImportJSON}
                onClose={() => setIsDataModalOpen(false)}
            />
        </>
    );
}

export default PlanetStudioModal;
