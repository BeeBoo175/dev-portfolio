import type { AsteroidBeltConfig } from "../../galaxy";
import { generateRandomAsteroidBelt } from "../presets";
import { Tooltip } from "../../../components/ui/Tooltip";

export interface AsteroidBeltPanelProps {
    config: AsteroidBeltConfig;
    onChange: (updater: (prev: AsteroidBeltConfig) => AsteroidBeltConfig) => void;
    onReset: () => void;
}

const RAD_TO_DEG = 180 / Math.PI;
const DEG_TO_RAD = Math.PI / 180;

export function AsteroidBeltPanel({
    config,
    onChange,
    onReset,
}: AsteroidBeltPanelProps) {
    const handleRandomize = () => {
        const randomized = generateRandomAsteroidBelt(config);
        onChange(() => randomized);
    };

    const handleShuffleSeed = () => {
        const nextSeed = Math.floor(Math.random() * 9999) + 1;
        onChange((prev) => ({ ...prev, seed: nextSeed }));
    };

    return (
        <div className="studio-panel">
            <div className="studio-panel__section">
                <div className="studio-panel__header-row">
                    <span className="studio-panel__title">Asteroid Belt System</span>
                    <div className="studio-panel__actions">
                        <label className="studio-switch" style={{ marginRight: "0.5rem" }}>
                            <input
                                type="checkbox"
                                checked={config.enabled}
                                onChange={(e) => {
                                    const checked = e.target.checked;
                                    onChange((prev) => ({ ...prev, enabled: checked }));
                                }}
                            />
                            <span className="studio-switch__slider" />
                        </label>
                        <button
                            type="button"
                            className="studio-btn studio-btn--secondary studio-btn--sm"
                            onClick={handleRandomize}
                        >
                            Randomize Belt
                        </button>
                        <button
                            type="button"
                            className="studio-btn studio-btn--ghost studio-btn--sm"
                            onClick={onReset}
                        >
                            Reset
                        </button>
                    </div>
                </div>

                <div className="studio-field">
                    <div className="studio-field__label-row">
                        <label htmlFor="belt-count">Asteroid Count</label>
                        <span className="studio-field__value">{config.count}</span>
                        <Tooltip text="Total number of instanced rock meshes distributed in the ring." />
                    </div>
                    <input
                        id="belt-count"
                        type="range"
                        min="50"
                        max="800"
                        step="25"
                        value={config.count}
                        onChange={(e) => {
                            const val = parseInt(e.target.value, 10);
                            onChange((prev) => ({ ...prev, count: val }));
                        }}
                    />
                </div>

                <div className="studio-field">
                    <div className="studio-field__label-row">
                        <label htmlFor="belt-inner">Inner Radius</label>
                        <span className="studio-field__value">{config.innerRadius.toFixed(1)} AU</span>
                        <Tooltip text="Inner orbital boundary of the asteroid field." />
                    </div>
                    <input
                        id="belt-inner"
                        type="range"
                        min="5.0"
                        max="25.0"
                        step="0.2"
                        value={config.innerRadius}
                        onChange={(e) => {
                            const val = parseFloat(e.target.value);
                            onChange((prev) => ({
                                ...prev,
                                innerRadius: val,
                                outerRadius: Math.max(val + 0.5, prev.outerRadius),
                            }));
                        }}
                    />
                </div>

                <div className="studio-field">
                    <div className="studio-field__label-row">
                        <label htmlFor="belt-outer">Outer Radius</label>
                        <span className="studio-field__value">{config.outerRadius.toFixed(1)} AU</span>
                        <Tooltip text="Outer orbital boundary of the asteroid field." />
                    </div>
                    <input
                        id="belt-outer"
                        type="range"
                        min={config.innerRadius + 0.5}
                        max="32.0"
                        step="0.2"
                        value={config.outerRadius}
                        onChange={(e) => {
                            const val = parseFloat(e.target.value);
                            onChange((prev) => ({ ...prev, outerRadius: val }));
                        }}
                    />
                </div>

                <div className="studio-field">
                    <div className="studio-field__label-row">
                        <label htmlFor="belt-spread">Vertical Thickness (Spread)</label>
                        <span className="studio-field__value">{config.heightSpread.toFixed(2)}</span>
                        <Tooltip text="Vertical scatter thickness across the orbital plane." />
                    </div>
                    <input
                        id="belt-spread"
                        type="range"
                        min="0.1"
                        max="2.5"
                        step="0.05"
                        value={config.heightSpread}
                        onChange={(e) => {
                            const val = parseFloat(e.target.value);
                            onChange((prev) => ({ ...prev, heightSpread: val }));
                        }}
                    />
                </div>

                <div className="studio-field">
                    <div className="studio-field__label-row">
                        <label htmlFor="belt-speed">Orbital Drift Speed</label>
                        <span className="studio-field__value">{config.orbitSpeed.toFixed(3)}</span>
                        <Tooltip text="Collective rotational drift velocity around the sun." />
                    </div>
                    <input
                        id="belt-speed"
                        type="range"
                        min="-0.3"
                        max="0.3"
                        step="0.005"
                        value={config.orbitSpeed}
                        onChange={(e) => {
                            const val = parseFloat(e.target.value);
                            onChange((prev) => ({ ...prev, orbitSpeed: val }));
                        }}
                    />
                </div>

                <div className="studio-field">
                    <div className="studio-field__label-row">
                        <label htmlFor="belt-inclination">3D Plane Tilt (X)</label>
                        <span className="studio-field__value">{((config.inclination ?? 0) * RAD_TO_DEG).toFixed(1)} deg</span>
                        <Tooltip text="Tilt angle of the asteroid ring relative to the ecliptic plane." />
                    </div>
                    <input
                        id="belt-inclination"
                        type="range"
                        min="-30"
                        max="30"
                        step="0.5"
                        value={(config.inclination ?? 0) * RAD_TO_DEG}
                        onChange={(e) => {
                            const val = parseFloat(e.target.value) * DEG_TO_RAD;
                            onChange((prev) => ({ ...prev, inclination: val }));
                        }}
                    />
                </div>

                <div className="studio-field">
                    <div className="studio-field__label-row">
                        <label htmlFor="belt-node">3D Ascending Node (Y)</label>
                        <span className="studio-field__value">{((config.ascendingNode ?? 0) * RAD_TO_DEG).toFixed(1)} deg</span>
                        <Tooltip text="Rotational longitude orientation of the asteroid field in 3D." />
                    </div>
                    <input
                        id="belt-node"
                        type="range"
                        min="-180"
                        max="180"
                        step="1"
                        value={(config.ascendingNode ?? 0) * RAD_TO_DEG}
                        onChange={(e) => {
                            const val = parseFloat(e.target.value) * DEG_TO_RAD;
                            onChange((prev) => ({ ...prev, ascendingNode: val }));
                        }}
                    />
                </div>

                <div className="studio-field">
                    <div className="studio-field__label-row">
                        <label htmlFor="belt-primary-color">Primary Mineral Color</label>
                        <Tooltip text="Main rock surface color tone." />
                    </div>
                    <div className="studio-color-picker">
                        <input
                            id="belt-primary-color"
                            type="color"
                            value={config.color || "#9ca3af"}
                            onChange={(e) => {
                                const val = e.target.value;
                                onChange((prev) => ({ ...prev, color: val }));
                            }}
                        />
                        <span className="studio-color-picker__hex">{config.color || "#9ca3af"}</span>
                    </div>
                </div>

                <div className="studio-field">
                    <div className="studio-field__label-row">
                        <label htmlFor="belt-secondary-color">Secondary Mineral Accent</label>
                        <Tooltip text="Secondary variation color blended across asteroids." />
                    </div>
                    <div className="studio-color-picker">
                        <input
                            id="belt-secondary-color"
                            type="color"
                            value={config.secondaryColor || "#57534e"}
                            onChange={(e) => {
                                const val = e.target.value;
                                onChange((prev) => ({ ...prev, secondaryColor: val }));
                            }}
                        />
                        <span className="studio-color-picker__hex">{config.secondaryColor || "#57534e"}</span>
                    </div>
                </div>

                <div className="studio-field">
                    <div className="studio-field__label-row">
                        <label htmlFor="belt-seed">Distribution Seed</label>
                        <span className="studio-field__value">{config.seed ?? 101}</span>
                        <Tooltip text="Seed controlling the pseudo-random positioning and tumbling of each asteroid." />
                    </div>
                    <div className="studio-field__input-with-btn">
                        <input
                            id="belt-seed"
                            type="number"
                            value={config.seed ?? 101}
                            onChange={(e) => {
                                const val = parseInt(e.target.value, 10) || 1;
                                onChange((prev) => ({ ...prev, seed: val }));
                            }}
                        />
                        <button
                            type="button"
                            className="studio-btn studio-btn--ghost studio-btn--sm"
                            onClick={handleShuffleSeed}
                        >
                            Shuffle
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
}

export default AsteroidBeltPanel;
