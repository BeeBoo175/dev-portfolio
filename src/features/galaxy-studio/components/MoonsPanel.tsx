import type { OrbitConfig } from "../../galaxy";
import { generateRandomMoon } from "../presets";
import { Tooltip } from "../../../components/ui/Tooltip";

export interface MoonsPanelProps {
    planet: OrbitConfig;
    activeMoonIndex: number;
    onSelectMoon: (index: number) => void;
    onChange: (updater: (prev: OrbitConfig) => OrbitConfig) => void;
}

const RAD_TO_DEG = 180 / Math.PI;
const DEG_TO_RAD = Math.PI / 180;

export function MoonsPanel({
    planet,
    activeMoonIndex,
    onSelectMoon,
    onChange,
}: MoonsPanelProps) {
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

    const handleRandomizeActiveMoon = () => {
        if (!activeMoon) return;
        const randomized = generateRandomMoon(planet.id, activeMoonIndex);
        onChange((prev) => ({
            ...prev,
            children: (prev.children || []).map((m, i) =>
                i === activeMoonIndex ? { ...randomized, id: m.id } : m
            ),
        }));
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
                                <div className="studio-panel__header-row" style={{ marginTop: "1rem" }}>
                                    <span className="studio-panel__subtitle">Moon {activeMoonIndex + 1} Settings</span>
                                    <button
                                        type="button"
                                        className="studio-btn studio-btn--secondary studio-btn--sm"
                                        onClick={handleRandomizeActiveMoon}
                                    >
                                        Randomize This Moon
                                    </button>
                                </div>

                                <div className="studio-field">
                                    <div className="studio-field__label-row">
                                        <label htmlFor="moon-radius">Moon Radius</label>
                                        <span className="studio-field__value">{activeMoon.radius.toFixed(2)}</span>
                                        <Tooltip text="Size of the spherical satellite." />
                                    </div>
                                    <input
                                        id="moon-radius"
                                        type="range"
                                        min="0.1"
                                        max="0.6"
                                        step="0.02"
                                        value={activeMoon.radius}
                                        onChange={(e) => {
                                            const val = parseFloat(e.target.value);
                                            updateActiveMoon((m) => ({ ...m, radius: val }));
                                        }}
                                    />
                                </div>

                                <div className="studio-field">
                                    <div className="studio-field__label-row">
                                        <label htmlFor="moon-orbit-radius">Local Orbit Distance</label>
                                        <span className="studio-field__value">{(activeMoon.orbitRadius ?? 1.5).toFixed(2)}</span>
                                        <Tooltip text="Orbital altitude above the host planet surface." />
                                    </div>
                                    <input
                                        id="moon-orbit-radius"
                                        type="range"
                                        min={planet.radius + 0.5}
                                        max={planet.radius + 6.0}
                                        step="0.1"
                                        value={activeMoon.orbitRadius ?? 1.5}
                                        onChange={(e) => {
                                            const val = parseFloat(e.target.value);
                                            updateActiveMoon((m) => ({ ...m, orbitRadius: val }));
                                        }}
                                    />
                                </div>

                                <div className="studio-field">
                                    <div className="studio-field__label-row">
                                        <label htmlFor="moon-orbit-speed">Orbital Velocity</label>
                                        <span className="studio-field__value">{(activeMoon.orbitSpeed ?? 0.8).toFixed(2)}</span>
                                        <Tooltip text="Revolution speed around the host planet." />
                                    </div>
                                    <input
                                        id="moon-orbit-speed"
                                        type="range"
                                        min="0.1"
                                        max="2.5"
                                        step="0.05"
                                        value={activeMoon.orbitSpeed ?? 0.8}
                                        onChange={(e) => {
                                            const val = parseFloat(e.target.value);
                                            updateActiveMoon((m) => ({ ...m, orbitSpeed: val }));
                                        }}
                                    />
                                </div>

                                <div className="studio-field">
                                    <div className="studio-field__label-row">
                                        <label htmlFor="moon-inclination">3D Orbit Inclination</label>
                                        <span className="studio-field__value">
                                            {((activeMoon.orbitInclination ?? 0) * RAD_TO_DEG).toFixed(1)} deg
                                        </span>
                                        <Tooltip text="Inclination angle of the moon's orbit plane in 3D." />
                                    </div>
                                    <input
                                        id="moon-inclination"
                                        type="range"
                                        min="-60"
                                        max="60"
                                        step="1"
                                        value={(activeMoon.orbitInclination ?? 0) * RAD_TO_DEG}
                                        onChange={(e) => {
                                            const val = parseFloat(e.target.value) * DEG_TO_RAD;
                                            updateActiveMoon((m) => ({ ...m, orbitInclination: val }));
                                        }}
                                    />
                                </div>

                                <div className="studio-field">
                                    <div className="studio-field__label-row">
                                        <label htmlFor="moon-color">Surface Color</label>
                                        <Tooltip text="Base regolith color tone of the satellite." />
                                    </div>
                                    <div className="studio-color-picker">
                                        <input
                                            id="moon-color"
                                            type="color"
                                            value={activeMoon.color || "#cbd5e1"}
                                            onChange={(e) => {
                                                const val = e.target.value;
                                                updateActiveMoon((m) => ({
                                                    ...m,
                                                    color: val,
                                                    palette: { ...m.palette, land: val },
                                                }));
                                            }}
                                        />
                                        <span className="studio-color-picker__hex">{activeMoon.color || "#cbd5e1"}</span>
                                    </div>
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
