import type { SunConfig } from "../../galaxy";
import { generateRandomSun } from "../presets";
import { Tooltip } from "../../../components/ui/Tooltip";

export interface SunPanelProps {
    sun: SunConfig;
    onChange: (updater: (prev: SunConfig) => SunConfig) => void;
}

export function SunPanel({ sun, onChange }: SunPanelProps) {
    const handleRandomize = () => {
        const randomSun = generateRandomSun(sun);
        onChange(() => randomSun);
    };

    return (
        <div className="studio-panel">
            <div className="studio-panel__section">
                <div className="studio-panel__header-row">
                    <span className="studio-panel__title">Central Star Configuration</span>
                    <div className="studio-panel__actions">
                        <button
                            type="button"
                            className="studio-btn studio-btn--secondary studio-btn--sm"
                            onClick={handleRandomize}
                        >
                            Randomize Sun
                        </button>
                    </div>
                </div>

                <div className="studio-field">
                    <div className="studio-field__label-row">
                        <label htmlFor="sun-radius">Core Radius</label>
                        <span className="studio-field__value">{sun.radius.toFixed(2)}</span>
                        <Tooltip text="Size of the star's central sphere in 3D world units." />
                    </div>
                    <input
                        id="sun-radius"
                        type="range"
                        min="1.5"
                        max="6.0"
                        step="0.1"
                        value={sun.radius}
                        onChange={(e) => {
                            const val = parseFloat(e.target.value);
                            onChange((prev) => ({ ...prev, radius: val }));
                        }}
                    />
                </div>

                <div className="studio-field">
                    <div className="studio-field__label-row">
                        <label htmlFor="sun-rotation">Rotation Speed</label>
                        <span className="studio-field__value">{sun.rotationSpeed.toFixed(3)}</span>
                        <Tooltip text="Angular velocity at which the sun rotates on its central axis." />
                    </div>
                    <input
                        id="sun-rotation"
                        type="range"
                        min="0"
                        max="0.8"
                        step="0.01"
                        value={sun.rotationSpeed}
                        onChange={(e) => {
                            const val = parseFloat(e.target.value);
                            onChange((prev) => ({ ...prev, rotationSpeed: val }));
                        }}
                    />
                </div>

                <div className="studio-field">
                    <div className="studio-field__label-row">
                        <label htmlFor="sun-glow">Corona Glow Intensity</label>
                        <span className="studio-field__value">{(sun.glowIntensity ?? 1.0).toFixed(2)}</span>
                        <Tooltip text="Atmospheric corona glow opacity and radiant volumetric brightness." />
                    </div>
                    <input
                        id="sun-glow"
                        type="range"
                        min="0.1"
                        max="2.5"
                        step="0.05"
                        value={sun.glowIntensity ?? 1.0}
                        onChange={(e) => {
                            const val = parseFloat(e.target.value);
                            onChange((prev) => ({ ...prev, glowIntensity: val }));
                        }}
                    />
                </div>

                <div className="studio-field">
                    <div className="studio-field__label-row">
                        <label htmlFor="sun-light">Point Light Output</label>
                        <span className="studio-field__value">{(sun.lightIntensity ?? 6.0).toFixed(1)}</span>
                        <Tooltip text="Brightness of the point light cast onto orbiting planets and moons." />
                    </div>
                    <input
                        id="sun-light"
                        type="range"
                        min="1.0"
                        max="15.0"
                        step="0.5"
                        value={sun.lightIntensity ?? 6.0}
                        onChange={(e) => {
                            const val = parseFloat(e.target.value);
                            onChange((prev) => ({ ...prev, lightIntensity: val }));
                        }}
                    />
                </div>
            </div>

            <div className="studio-panel__section">
                <span className="studio-panel__title">System View Camera Orbit</span>
                <div className="studio-field">
                    <div className="studio-field__label-row">
                        <label htmlFor="sun-camera-orbit">Camera Orbit Speed</label>
                        <span className="studio-field__value">{(sun.cameraOrbitSpeed ?? -0.045).toFixed(3)}</span>
                        <Tooltip text="Ambient camera revolution speed around the solar system in system overview." />
                    </div>
                    <input
                        id="sun-camera-orbit"
                        type="range"
                        min="-0.15"
                        max="0.15"
                        step="0.005"
                        value={sun.cameraOrbitSpeed ?? -0.045}
                        onChange={(e) => {
                            const val = parseFloat(e.target.value);
                            onChange((prev) => ({ ...prev, cameraOrbitSpeed: val }));
                        }}
                    />
                </div>
            </div>

            <div className="studio-panel__section">
                <span className="studio-panel__title">Stellar Palette</span>

                <div className="studio-palette-grid">
                    <div className="studio-color-picker studio-color-picker--compact">
                        <input
                            id="sun-color"
                            type="color"
                            value={sun.color || "#ffd76b"}
                            onChange={(e) => {
                                const val = e.target.value;
                                onChange((prev) => ({
                                    ...prev,
                                    color: val,
                                    palette: { ...prev.palette, water: val },
                                }));
                            }}
                        />
                        <span className="studio-color-picker__label">Core Color</span>
                        <span className="studio-color-picker__hex">{sun.color || "#ffd76b"}</span>
                    </div>

                    <div className="studio-color-picker studio-color-picker--compact">
                        <input
                            id="sun-flare-color"
                            type="color"
                            value={sun.palette?.peak || "#fffbeb"}
                            onChange={(e) => {
                                const val = e.target.value;
                                onChange((prev) => ({
                                    ...prev,
                                    palette: { ...prev.palette, peak: val },
                                }));
                            }}
                        />
                        <span className="studio-color-picker__label">Flare Highlight</span>
                        <span className="studio-color-picker__hex">{sun.palette?.peak || "#fffbeb"}</span>
                    </div>
                </div>
            </div>
        </div>
    );
}

export default SunPanel;
