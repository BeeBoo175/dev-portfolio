import { useState, useEffect } from "react";
import type { OrbitConfig, PaletteConfig } from "../../galaxy";
import { galaxyStore, useGalaxyPlanets } from "../../galaxy";
import { BIOME_PRESETS, generateRandomTerrain } from "../presets";
import PlanetPreviewCanvas from "./PlanetPreviewCanvas";
import "../PlanetStudio.css";

const EDITABLE_TARGETS = [
    { id: "about", label: "About" },
    { id: "skills", label: "Skills" },
    { id: "projects", label: "Projects" },
    { id: "contact", label: "Contact" },
];

export function PlanetStudioModal() {
    const [isOpen, setIsOpen] = useState(false);
    const planets = useGalaxyPlanets();
    const [selectedId, setSelectedId] = useState<string>("projects");
    const [draftPlanet, setDraftPlanet] = useState<OrbitConfig | null>(() => {
        const found = planets.find((p) => p.id === "projects") ?? planets[0];
        return found ? JSON.parse(JSON.stringify(found)) : null;
    });
    const [toastMessage, setToastMessage] = useState<string | null>(null);

    const handleOpen = () => {
        const found = planets.find((p) => p.id === selectedId) ?? planets[0];
        if (found) {
            setDraftPlanet(JSON.parse(JSON.stringify(found)));
        }
        setIsOpen(true);
    };

    const handleSelectTarget = (id: string) => {
        setSelectedId(id);
        const found = planets.find((p) => p.id === id);
        if (found) {
            setDraftPlanet(JSON.parse(JSON.stringify(found)));
        }
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
        });
    };

    const handleSelectBiome = (preset: typeof BIOME_PRESETS[0]) => {
        if (!draftPlanet) return;
        setDraftPlanet({
            ...draftPlanet,
            terrain: { ...preset.terrain },
            palette: { ...preset.palette },
            color: preset.color,
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
                    innerRadius: rad * 1.5,
                    outerRadius: rad * 2.2,
                    color: draftPlanet.palette?.coast ?? draftPlanet.color ?? "#38bdf8",
                    opacity: 0.8,
                    tilt: [Math.PI / 3, 0, Math.PI / 6],
                },
            });
        }
    };

    const handleApply = () => {
        if (!draftPlanet) return;
        galaxyStore.updatePlanet(draftPlanet.id, draftPlanet);
        setToastMessage(`Saved ${draftPlanet.id.toUpperCase()} to your Galaxy!`);
    };

    const handleReset = () => {
        if (!draftPlanet) return;
        galaxyStore.resetPlanet(draftPlanet.id);
        const resetTarget = planets.find((p) => p.id === draftPlanet.id);
        if (resetTarget) {
            setDraftPlanet(JSON.parse(JSON.stringify(resetTarget)));
        }
        setToastMessage(`Restored default ${draftPlanet.id.toUpperCase()}`);
    };

    const handleResetAll = () => {
        galaxyStore.resetAll();
        setToastMessage("Restored default portfolio galaxy");
    };

    return (
        <>
            <button
                className="planet-lab-trigger"
                onClick={handleOpen}
                title="Open Planet Creator Studio"
            >
                <span className="planet-lab-trigger__icon">🪐</span>
                <span>Planet Lab</span>
            </button>

            {isOpen && draftPlanet && (
                <div className="planet-studio-backdrop" onClick={() => setIsOpen(false)}>
                    <div className="planet-studio" onClick={(e) => e.stopPropagation()}>
                        <div className="planet-studio__header">
                            <div className="planet-studio__title">
                                <span>🪐</span>
                                <span>Planet Creator Studio</span>
                            </div>
                            <button
                                className="planet-studio__close-btn"
                                onClick={() => setIsOpen(false)}
                            >
                                ✕
                            </button>
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
                                    >
                                        🎲 Roll Random
                                    </button>
                                    <button
                                        className="planet-studio__btn planet-studio__btn--secondary"
                                        onClick={handleRingToggle}
                                    >
                                        {draftPlanet.ring ? "🪐 Remove Ring" : "🪐 Add Ring"}
                                    </button>
                                </div>

                                <div className="planet-studio__biomes">
                                    <span className="planet-studio__section-label">Biome Archetypes</span>
                                    <div className="planet-studio__biome-grid">
                                        {BIOME_PRESETS.map((preset) => (
                                            <button
                                                key={preset.id}
                                                className="planet-studio__biome-chip"
                                                onClick={() => handleSelectBiome(preset)}
                                            >
                                                <span>{preset.icon}</span>
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

                                <div className="planet-studio__group">
                                    <span className="planet-studio__section-label">Terrain Sculpting</span>

                                    <div className="planet-studio__row">
                                        <label className="planet-studio__slider-label">
                                            <span>Mountain Roughness</span>
                                            <span className="planet-studio__slider-value">
                                                {draftPlanet.terrain?.roughness?.toFixed(2) ?? 0.2}
                                            </span>
                                        </label>
                                    </div>
                                    <input
                                        type="range"
                                        min="0.0"
                                        max="0.45"
                                        step="0.01"
                                        value={draftPlanet.terrain?.roughness ?? 0.2}
                                        onChange={(e) => handleTerrainChange("roughness", parseFloat(e.target.value))}
                                        className="planet-studio__range"
                                    />

                                    <div className="planet-studio__row">
                                        <label className="planet-studio__slider-label">
                                            <span>Sea Level / Ocean Depth</span>
                                            <span className="planet-studio__slider-value">
                                                {draftPlanet.terrain?.waterLevel?.toFixed(2) ?? 0.4}
                                            </span>
                                        </label>
                                    </div>
                                    <input
                                        type="range"
                                        min="0.0"
                                        max="0.75"
                                        step="0.02"
                                        value={draftPlanet.terrain?.waterLevel ?? 0.4}
                                        onChange={(e) => handleTerrainChange("waterLevel", parseFloat(e.target.value))}
                                        className="planet-studio__range"
                                    />

                                    <div className="planet-studio__row">
                                        <label className="planet-studio__slider-label">
                                            <span>Continent Scale</span>
                                            <span className="planet-studio__slider-value">
                                                {draftPlanet.terrain?.noiseScale?.toFixed(2) ?? 1.4}
                                            </span>
                                        </label>
                                    </div>
                                    <input
                                        type="range"
                                        min="0.5"
                                        max="3.0"
                                        step="0.1"
                                        value={draftPlanet.terrain?.noiseScale ?? 1.4}
                                        onChange={(e) => handleTerrainChange("noiseScale", parseFloat(e.target.value))}
                                        className="planet-studio__range"
                                    />
                                </div>

                                <div className="planet-studio__group">
                                    <span className="planet-studio__section-label">Color Layers</span>
                                    <div className="planet-studio__palette-grid">
                                        <div className="planet-studio__color-item">
                                            <input
                                                type="color"
                                                value={draftPlanet.palette?.water ?? "#0284c7"}
                                                onChange={(e) => handlePaletteChange("water", e.target.value)}
                                                className="planet-studio__color-input"
                                            />
                                            <span className="planet-studio__color-label">Ocean</span>
                                        </div>
                                        <div className="planet-studio__color-item">
                                            <input
                                                type="color"
                                                value={draftPlanet.palette?.coast ?? "#38bdf8"}
                                                onChange={(e) => handlePaletteChange("coast", e.target.value)}
                                                className="planet-studio__color-input"
                                            />
                                            <span className="planet-studio__color-label">Coast</span>
                                        </div>
                                        <div className="planet-studio__color-item">
                                            <input
                                                type="color"
                                                value={draftPlanet.palette?.land ?? "#10b981"}
                                                onChange={(e) => handlePaletteChange("land", e.target.value)}
                                                className="planet-studio__color-input"
                                            />
                                            <span className="planet-studio__color-label">Land</span>
                                        </div>
                                        <div className="planet-studio__color-item">
                                            <input
                                                type="color"
                                                value={draftPlanet.palette?.mountain ?? "#047857"}
                                                onChange={(e) => handlePaletteChange("mountain", e.target.value)}
                                                className="planet-studio__color-input"
                                            />
                                            <span className="planet-studio__color-label">Mountain</span>
                                        </div>
                                        <div className="planet-studio__color-item">
                                            <input
                                                type="color"
                                                value={draftPlanet.palette?.peak ?? "#f8fafc"}
                                                onChange={(e) => handlePaletteChange("peak", e.target.value)}
                                                className="planet-studio__color-input"
                                            />
                                            <span className="planet-studio__color-label">Peaks</span>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>

                        <div className="planet-studio__footer">
                            <div style={{ display: "flex", gap: "8px" }}>
                                <button
                                    className="planet-studio__btn planet-studio__btn--secondary"
                                    onClick={handleReset}
                                >
                                    Reset Planet
                                </button>
                                <button
                                    className="planet-studio__btn planet-studio__btn--secondary"
                                    onClick={handleResetAll}
                                >
                                    Reset All Defaults
                                </button>
                            </div>

                            <div style={{ display: "flex", alignItems: "center", gap: "14px" }}>
                                {toastMessage && (
                                    <span style={{ color: "#38bdf8", fontSize: "13px", fontWeight: "600" }}>
                                        {toastMessage}
                                    </span>
                                )}
                                <button
                                    className="planet-studio__btn planet-studio__btn--primary"
                                    onClick={handleApply}
                                >
                                    🚀 Apply to Galaxy
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </>
    );
}

export default PlanetStudioModal;
