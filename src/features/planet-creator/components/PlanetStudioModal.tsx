import { useState, useEffect } from "react";
import type { OrbitConfig, PaletteConfig } from "../../galaxy";
import { galaxyStore, useGalaxyPlanets, useGalaxyVisuals } from "../../galaxy";
import { BIOME_PRESETS, generateRandomTerrain } from "../presets";
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

    const [selectedId, setSelectedId] = useState<string>("about");
    const [activeTab, setActiveTab] = useState<CategoryTab>("terrain");
    const [activeMoonIndex, setActiveMoonIndex] = useState<number>(0);
    const [isDataModalOpen, setIsDataModalOpen] = useState(false);

    const [draftPlanet, setDraftPlanet] = useState<OrbitConfig | null>(() => {
        const targetId = focusId && EDITABLE_TARGETS.some((t) => t.id === focusId) ? focusId : "about";
        const found = planets.find((p) => p.id === targetId) ?? planets[0];
        return found ? JSON.parse(JSON.stringify(found)) : null;
    });
    const [toastMessage, setToastMessage] = useState<string | null>(null);
    const [importJsonText, setImportJsonText] = useState("");

    useEffect(() => {
        if (!isOpen) return;

        const html = document.documentElement;
        const { body } = document;
        const prevHtmlOverflow = html.style.overflow;
        const prevBodyOverflow = body.style.overflow;
        const scrollbarWidth = Math.max(0, window.innerWidth - html.clientWidth);

        html.classList.add("planet-studio-open");
        html.style.setProperty("--studio-scroll-lock", `${scrollbarWidth}px`);
        html.style.overflow = "hidden";
        body.style.overflow = "hidden";

        return () => {
            html.classList.remove("planet-studio-open");
            html.style.removeProperty("--studio-scroll-lock");
            html.style.overflow = prevHtmlOverflow;
            body.style.overflow = prevBodyOverflow;
        };
    }, [isOpen]);

    const handleOpen = () => {
        const targetId = focusId && EDITABLE_TARGETS.some((t) => t.id === focusId) ? focusId : "about";
        setSelectedId(targetId);
        const found = planets.find((p) => p.id === targetId) ?? planets[0];
        if (found) {
            setDraftPlanet(JSON.parse(JSON.stringify(found)));
        }
        setActiveMoonIndex(0);
        setIsOpen(true);
    };

    const handleSelectTarget = (id: string) => {
        setSelectedId(id);
        const found = planets.find((p) => p.id === id);
        if (found) {
            setDraftPlanet(JSON.parse(JSON.stringify(found)));
        }
        setActiveMoonIndex(0);
    };

    useEffect(() => {
        if (!toastMessage) return;
        const timer = setTimeout(() => setToastMessage(null), 2500);
        return () => clearTimeout(timer);
    }, [toastMessage]);

    if (!draftPlanet && isOpen) return null;

    const handleRandomize = () => {
        if (!draftPlanet) return;
        const { terrain, palette, color } = generateRandomTerrain();
        setDraftPlanet({
            ...draftPlanet,
            terrain,
            palette,
            color,
            ring: draftPlanet.ring
                ? {
                      ...draftPlanet.ring,
                      color: palette.coast ?? palette.land ?? color,
                  }
                : undefined,
        });
    };

    const handleSelectBiome = (preset: typeof BIOME_PRESETS[0]) => {
        if (!draftPlanet) return;
        setDraftPlanet({
            ...draftPlanet,
            terrain: { ...preset.terrain },
            palette: { ...preset.palette },
            color: preset.color,
            ring: draftPlanet.ring
                ? {
                      ...draftPlanet.ring,
                      color: preset.palette.coast ?? preset.color,
                  }
                : undefined,
        });
    };

    const handleTerrainChange = (key: keyof NonNullable<OrbitConfig["terrain"]>, val: number) => {
        if (!draftPlanet) return;
        setDraftPlanet({
            ...draftPlanet,
            terrain: {
                ...draftPlanet.terrain,
                [key]: val,
            },
        });
    };

    const handlePaletteChange = (key: keyof PaletteConfig, val: string) => {
        if (!draftPlanet) return;
        setDraftPlanet({
            ...draftPlanet,
            palette: {
                ...draftPlanet.palette,
                [key]: val,
            },
        });
    };

    const handleRingColorChange = (val: string) => {
        if (!draftPlanet || !draftPlanet.ring) return;
        setDraftPlanet({
            ...draftPlanet,
            ring: {
                ...draftPlanet.ring,
                color: val,
            },
        });
    };

    const handleRingParamChange = (key: "innerRadius" | "outerRadius" | "opacity", val: number) => {
        if (!draftPlanet || !draftPlanet.ring) return;
        setDraftPlanet({
            ...draftPlanet,
            ring: {
                ...draftPlanet.ring,
                [key]: val,
            },
        });
    };

    const handleRingToggle = () => {
        if (!draftPlanet) return;
        if (draftPlanet.ring) {
            setDraftPlanet({
                ...draftPlanet,
                ring: undefined,
            });
        } else {
            const rad = draftPlanet.radius ?? 1;
            setDraftPlanet({
                ...draftPlanet,
                ring: {
                    innerRadius: Number((rad * 1.5).toFixed(2)),
                    outerRadius: Number((rad * 2.3).toFixed(2)),
                    color: draftPlanet.palette?.coast ?? draftPlanet.color ?? "#38bdf8",
                    opacity: 0.8,
                    tilt: [Math.PI / 3, 0, Math.PI / 6],
                },
            });
            setActiveTab("appearance");
        }
    };

    const handleOrbitalChange = (
        key: "radius" | "orbitRadius" | "orbitSpeed" | "rotationSpeed" | "initialAngle" | "axialTilt" | "orbitInclination",
        val: number
    ) => {
        if (!draftPlanet) return;
        setDraftPlanet({
            ...draftPlanet,
            [key]: val,
        });
    };

    const handleAddMoon = () => {
        if (!draftPlanet) return;
        const currentMoons = draftPlanet.children ?? [];
        const baseRad = draftPlanet.radius ?? 1.0;
        const orbitDist = Number((baseRad * 1.8 + currentMoons.length * 0.9).toFixed(2));

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
        setDraftPlanet({
            ...draftPlanet,
            children: updated,
        });
        setActiveMoonIndex(updated.length - 1);
        setToastMessage(`Added Moon #${updated.length}`);
    };

    const handleRemoveMoon = (moonId: string) => {
        if (!draftPlanet || !draftPlanet.children) return;
        const updated = draftPlanet.children.filter((m) => m.id !== moonId);
        setDraftPlanet({
            ...draftPlanet,
            children: updated,
        });
        setActiveMoonIndex(Math.max(0, updated.length - 1));
    };

    const handleMoonChange = (moonId: string, updates: Partial<OrbitConfig>) => {
        if (!draftPlanet || !draftPlanet.children) return;
        setDraftPlanet({
            ...draftPlanet,
            children: draftPlanet.children.map((m) => {
                if (m.id === moonId) {
                    return {
                        ...m,
                        ...updates,
                        terrain: updates.terrain ? { ...m.terrain, ...updates.terrain } : m.terrain,
                        palette: updates.palette ? { ...m.palette, ...updates.palette } : m.palette,
                    };
                }
                return m;
            }),
        });
    };

    const handleApply = () => {
        if (!draftPlanet) return;
        galaxyStore.updatePlanet(draftPlanet.id, draftPlanet);
        setToastMessage(`Saved ${draftPlanet.id.toUpperCase()} to Galaxy`);
    };

    const clonePlanetFromStore = (id: string) => {
        const snapshot = galaxyStore.getSnapshot();
        const found = snapshot.find((p) => p.id === id) ?? snapshot[0];
        return found ? (JSON.parse(JSON.stringify(found)) as OrbitConfig) : null;
    };

    const handleReset = () => {
        if (!draftPlanet) return;
        galaxyStore.resetPlanet(draftPlanet.id);
        const resetTarget = clonePlanetFromStore(draftPlanet.id);
        if (resetTarget) {
            setDraftPlanet(resetTarget);
        }
        setToastMessage(`Restored default ${draftPlanet.id.toUpperCase()}`);
    };

    const handleResetAll = () => {
        galaxyStore.resetAll();
        const resetTarget = clonePlanetFromStore(selectedId);
        if (resetTarget) {
            setDraftPlanet(resetTarget);
        }
        setToastMessage("Restored default galaxy");
    };

    const handleExportJSON = () => {
        const json = galaxyStore.exportJSON();
        navigator.clipboard.writeText(json);
        setToastMessage("Galaxy JSON copied to clipboard");
    };

    const handleImportJSON = () => {
        if (!importJsonText.trim()) return;
        const success = galaxyStore.importJSON(importJsonText);
        if (success) {
            setToastMessage("Galaxy JSON imported successfully");
            setImportJsonText("");
            setIsDataModalOpen(false);
            const updated = clonePlanetFromStore(selectedId);
            if (updated) setDraftPlanet(updated);
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
                    onClick={() => setIsOpen(false)}
                    onWheel={(e) => e.stopPropagation()}
                    onTouchMove={(e) => e.stopPropagation()}
                >
                    <div className="planet-studio" onClick={(e) => e.stopPropagation()}>
                        <div className="planet-studio__header">
                            <div className="planet-studio__title">
                                <span className="planet-studio__title-badge">Studio</span>
                                <span>Planet &amp; Moon Customizer</span>
                            </div>
                            <div className="planet-studio__header-actions">
                                <button
                                    className={`planet-studio__toggle-btn ${
                                        visuals.showOrbitPaths ? "planet-studio__toggle-btn--active" : ""
                                    }`}
                                    onClick={() => galaxyStore.toggleOrbitPaths()}
                                    title="Toggle 3D Circular Orbit Trajectories"
                                >
                                    Orbits: {visuals.showOrbitPaths ? "ON" : "OFF"}
                                </button>
                                <button
                                    className={`planet-studio__toggle-btn ${
                                        visuals.showOrbitalAxes ? "planet-studio__toggle-btn--active" : ""
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
                                    onClick={() => setIsOpen(false)}
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
                                        {draftPlanet.ring ? "Remove Ring" : "Add Ring"}
                                    </button>
                                </div>

                                <div className="planet-studio__biomes">
                                    <span className="planet-studio__section-label">Biome Presets</span>
                                    <div className="planet-studio__biome-grid">
                                        {BIOME_PRESETS.map((preset) => (
                                            <button
                                                key={preset.id}
                                                className="planet-studio__biome-chip"
                                                onClick={() => handleSelectBiome(preset)}
                                            >
                                                <span
                                                    className="planet-studio__biome-dot"
                                                    style={{ background: preset.color }}
                                                />
                                                <span>{preset.name}</span>
                                            </button>
                                        ))}
                                    </div>
                                </div>
                            </div>

                            <div className="planet-studio__controls-pane">
                                <div className="planet-studio__target-tabs">
                                    {EDITABLE_TARGETS.map((t) => (
                                        <button
                                            key={t.id}
                                            className={`planet-studio__target-tab ${
                                                selectedId === t.id ? "planet-studio__target-tab--active" : ""
                                            }`}
                                            onClick={() => handleSelectTarget(t.id)}
                                        >
                                            {t.label}
                                        </button>
                                    ))}
                                </div>

                                <div className="planet-studio__category-nav">
                                    <button
                                        className={`planet-studio__category-btn ${
                                            activeTab === "terrain" ? "planet-studio__category-btn--active" : ""
                                        }`}
                                        onClick={() => setActiveTab("terrain")}
                                    >
                                        Terrain
                                    </button>
                                    <button
                                        className={`planet-studio__category-btn ${
                                            activeTab === "appearance" ? "planet-studio__category-btn--active" : ""
                                        }`}
                                        onClick={() => setActiveTab("appearance")}
                                    >
                                        Appearance
                                    </button>
                                    <button
                                        className={`planet-studio__category-btn ${
                                            activeTab === "moons" ? "planet-studio__category-btn--active" : ""
                                        }`}
                                        onClick={() => setActiveTab("moons")}
                                    >
                                        Moons ({(draftPlanet.children ?? []).length})
                                    </button>
                                    <button
                                        className={`planet-studio__category-btn ${
                                            activeTab === "orbit" ? "planet-studio__category-btn--active" : ""
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
                                            onTerrainChange={handleTerrainChange}
                                        />
                                    )}

                                    {activeTab === "appearance" && (
                                        <AppearancePanel
                                            draftPlanet={draftPlanet}
                                            onPaletteChange={handlePaletteChange}
                                            onRingColorChange={handleRingColorChange}
                                            onRingParamChange={handleRingParamChange}
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
                                            allPlanets={planets}
                                            onOrbitalChange={handleOrbitalChange}
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
                            </div>

                            <div className="planet-studio__footer-right">
                                {toastMessage && (
                                    <span className="planet-studio__toast">
                                        {toastMessage}
                                    </span>
                                )}
                                <button
                                    className="planet-studio__btn planet-studio__btn--primary planet-studio__btn--footer"
                                    onClick={handleApply}
                                >
                                    Apply to Galaxy
                                </button>
                            </div>
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
