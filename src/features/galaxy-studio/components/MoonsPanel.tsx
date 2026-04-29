import { useState } from "react";
import type { OrbitConfig } from "../../galaxy";
import { generateRandomMoon } from "../presets";
import AppearancePanel from "./AppearancePanel";
import Orbit3DPanel from "./Orbit3DPanel";
import TerrainPanel from "./TerrainPanel";

export interface MoonsPanelProps {
    planet: OrbitConfig;
    activeMoonIndex: number;
    onSelectMoon: (index: number) => void;
    onChange: (updater: (prev: OrbitConfig) => OrbitConfig) => void;
}

type MoonSubTab = "appearance" | "orbit" | "terrain";

export function MoonsPanel({
    planet,
    activeMoonIndex,
    onSelectMoon,
    onChange,
}: MoonsPanelProps) {
    const [subTab, setSubTab] = useState<MoonSubTab>("appearance");
    const moons = planet.children || [];
    const activeMoon = moons[activeMoonIndex] || moons[0];

    const handleAddMoon = () => {
        const newMoon = generateRandomMoon(planet.id, moons.length);
        onChange((prev) => ({
            ...prev,
            children: [...(prev.children || []), newMoon],
        }));
        onSelectMoon(moons.length);
    };

    const handleRemoveMoon = (indexToRemove: number) => {
        onChange((prev) => {
            const nextMoons = (prev.children || []).filter((_, i) => i !== indexToRemove);
            return {
                ...prev,
                children: nextMoons.length > 0 ? nextMoons : undefined,
            };
        });
        if (activeMoonIndex >= moons.length - 1) {
            onSelectMoon(Math.max(0, moons.length - 2));
        }
    };

    const updateActiveMoon = (updater: (prevMoon: OrbitConfig) => OrbitConfig) => {
        onChange((prev) => ({
            ...prev,
            children: (prev.children || []).map((m, i) =>
                i === activeMoonIndex ? updater(m) : m
            ),
        }));
    };

    return (
        <div className="studio-panel">
            <div className="studio-panel__section">
                <div className="studio-panel__header-row">
                    <span className="studio-panel__title">Natural Satellites ({moons.length})</span>
                    <button
                        type="button"
                        className="studio-btn studio-btn--primary studio-btn--sm"
                        onClick={handleAddMoon}
                        disabled={moons.length >= 4}
                    >
                        + Add Moon
                    </button>
                </div>

                {moons.length === 0 ? (
                    <div className="studio-empty-state">
                        <p>No moons orbiting {planet.id}.</p>
                        <button
                            type="button"
                            className="studio-btn studio-btn--secondary studio-btn--sm"
                            onClick={handleAddMoon}
                        >
                            Spawn Moon
                        </button>
                    </div>
                ) : (
                    <>
                        <div className="studio-moons-tabs">
                            {moons.map((moon, idx) => (
                                <button
                                    key={moon.id}
                                    type="button"
                                    className={`studio-moon-tab ${
                                        idx === activeMoonIndex ? "studio-moon-tab--active" : ""
                                    }`}
                                    onClick={() => onSelectMoon(idx)}
                                >
                                    <span
                                        className="studio-moon-tab__dot"
                                        style={{ backgroundColor: moon.color || "#cbd5e1" }}
                                    />
                                    <span>Moon {idx + 1}</span>
                                    <button
                                        type="button"
                                        className="studio-moon-tab__remove"
                                        onClick={(e) => {
                                            e.stopPropagation();
                                            handleRemoveMoon(idx);
                                        }}
                                        title="Delete moon"
                                        aria-label="Delete moon"
                                    >
                                        x
                                    </button>
                                </button>
                            ))}
                        </div>

                        {activeMoon && (
                            <>
                                <nav className="studio-subtabs" aria-label="Moon categories">
                                    {[
                                        { id: "appearance", label: "Appearance" },
                                        { id: "orbit", label: "Orbit 3D" },
                                        { id: "terrain", label: "Terrain" },
                                    ].map((tab) => (
                                        <button
                                            key={tab.id}
                                            type="button"
                                            className={`studio-subtab ${
                                                subTab === tab.id ? "studio-subtab--active" : ""
                                            }`}
                                            onClick={() => setSubTab(tab.id as MoonSubTab)}
                                        >
                                            {tab.label}
                                        </button>
                                    ))}
                                </nav>

                                {subTab === "appearance" && (
                                    <AppearancePanel
                                        planet={activeMoon}
                                        onChange={updateActiveMoon}
                                        isMoon={true}
                                        minRadius={0.1}
                                        maxRadius={0.6}
                                    />
                                )}

                                {subTab === "orbit" && (
                                    <Orbit3DPanel
                                        planet={activeMoon}
                                        onChange={updateActiveMoon}
                                        isMoon={true}
                                        minRadius={Number((planet.radius + 0.5).toFixed(2))}
                                        maxRadius={Number((planet.radius + 6.0).toFixed(2))}
                                    />
                                )}

                                {subTab === "terrain" && (
                                    <TerrainPanel
                                        planet={activeMoon}
                                        onChange={updateActiveMoon}
                                    />
                                )}
                            </>
                        )}
                    </>
                )}
            </div>
        </div>
    );
}

export default MoonsPanel;
