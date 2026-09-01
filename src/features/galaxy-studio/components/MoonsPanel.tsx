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
                    <div className="studio-moons-empty">
                        <div className="studio-moons-empty__icon" aria-hidden="true">
                            <span className="studio-moons-empty__ring" />
                            <span className="studio-moons-empty__planet" />
                        </div>
                        <div className="studio-moons-empty__title">No Satellites Configured</div>
                        <p className="studio-moons-empty__desc">
                            {planet.id.toUpperCase()} has no orbiting moons. Spawn procedural moons to configure custom orbital radii, terrain profiles, and axial spins.
                        </p>
                        <button
                            type="button"
                            className="studio-btn studio-btn--primary studio-btn--sm"
                            onClick={handleAddMoon}
                        >
                            + Spawn First Moon
                        </button>
                    </div>
                ) : (
                    <>
                        <div className="studio-moons-tabs" role="tablist" aria-label="Moons list">
                            {moons.map((moon, idx) => (
                                <div
                                    key={moon.id}
                                    className={`studio-moon-tab ${
                                        idx === activeMoonIndex ? "studio-moon-tab--active" : ""
                                    }`}
                                    onClick={() => onSelectMoon(idx)}
                                    role="tab"
                                    aria-selected={idx === activeMoonIndex}
                                    aria-controls="moon-subtab-panel"
                                    id={`moon-tab-${idx}`}
                                    tabIndex={0}
                                    onKeyDown={(e) => {
                                        if (e.key === "Enter" || e.key === " ") {
                                            e.preventDefault();
                                            onSelectMoon(idx);
                                        }
                                    }}
                                >
                                    <span
                                        className="studio-moon-tab__dot"
                                        style={{ backgroundColor: moon.color || "#cbd5e1" }}
                                        aria-hidden="true"
                                    />
                                    <span className="studio-moon-tab__label">Moon {idx + 1}</span>
                                    <button
                                        type="button"
                                        className="studio-moon-tab__remove"
                                        onClick={(e) => {
                                            e.stopPropagation();
                                            handleRemoveMoon(idx);
                                        }}
                                        title={`Delete Moon ${idx + 1}`}
                                        aria-label={`Delete Moon ${idx + 1}`}
                                    >
                                        x
                                    </button>
                                </div>
                            ))}
                        </div>

                        {activeMoon && (
                            <>
                                <div className="studio-subtabs" role="tablist" aria-label="Moon configuration subtabs">
                                    {[
                                        { id: "appearance", label: "Appearance" },
                                        { id: "orbit", label: "Orbit 3D" },
                                        { id: "terrain", label: "Terrain" },
                                    ].map((tab) => (
                                        <button
                                            key={tab.id}
                                            type="button"
                                            role="tab"
                                            id={`moon-subtab-${tab.id}`}
                                            aria-selected={subTab === tab.id}
                                            aria-controls="moon-subtab-panel"
                                            className={`studio-subtab ${
                                                subTab === tab.id ? "studio-subtab--active" : ""
                                            }`}
                                            onClick={() => setSubTab(tab.id as MoonSubTab)}
                                        >
                                            {tab.label}
                                        </button>
                                    ))}
                                </div>

                                <div
                                    id="moon-subtab-panel"
                                    role="tabpanel"
                                    aria-labelledby={`moon-subtab-${subTab}`}
                                >
                                    {subTab === "appearance" && (
                                        <AppearancePanel
                                            key={`appearance-${activeMoon.id}`}
                                            planet={activeMoon}
                                            onChange={updateActiveMoon}
                                            isMoon={true}
                                            minRadius={0.1}
                                            maxRadius={0.9}
                                        />
                                    )}

                                    {subTab === "orbit" && (
                                        <Orbit3DPanel
                                            key={`orbit-${activeMoon.id}`}
                                            planet={activeMoon}
                                            onChange={updateActiveMoon}
                                            isMoon={true}
                                            minRadius={1.2}
                                            maxRadius={6.0}
                                        />
                                    )}

                                    {subTab === "terrain" && (
                                        <TerrainPanel
                                            key={`terrain-${activeMoon.id}`}
                                            planet={activeMoon}
                                            onChange={updateActiveMoon}
                                        />
                                    )}
                                </div>
                            </>
                        )}
                    </>
                )}
            </div>
        </div>
    );
}

export default MoonsPanel;
