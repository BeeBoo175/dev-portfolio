import type { OrbitConfig, PaletteConfig } from "../../galaxy";

interface AppearancePanelProps {
    draftPlanet: OrbitConfig;
    onPaletteChange: (key: keyof PaletteConfig, val: string) => void;
    onRingColorChange: (val: string) => void;
    onRingParamChange: (key: "innerRadius" | "outerRadius" | "opacity", val: number) => void;
}

export function AppearancePanel({
    draftPlanet,
    onPaletteChange,
    onRingColorChange,
    onRingParamChange,
}: AppearancePanelProps) {
    const baseRadius = draftPlanet.radius ?? 1;

    return (
        <>
            <div className="planet-studio__card">
                <span className="planet-studio__section-label">Elevation Palette</span>
                <div className="planet-studio__palette-grid">
                    <div className="planet-studio__color-item">
                        <input
                            type="color"
                            value={draftPlanet.palette?.water ?? "#0284c7"}
                            onChange={(e) => onPaletteChange("water", e.target.value)}
                            className="planet-studio__color-input"
                        />
                        <span className="planet-studio__color-label">Ocean</span>
                    </div>
                    <div className="planet-studio__color-item">
                        <input
                            type="color"
                            value={draftPlanet.palette?.coast ?? "#38bdf8"}
                            onChange={(e) => onPaletteChange("coast", e.target.value)}
                            className="planet-studio__color-input"
                        />
                        <span className="planet-studio__color-label">Coast</span>
                    </div>
                    <div className="planet-studio__color-item">
                        <input
                            type="color"
                            value={draftPlanet.palette?.land ?? "#10b981"}
                            onChange={(e) => onPaletteChange("land", e.target.value)}
                            className="planet-studio__color-input"
                        />
                        <span className="planet-studio__color-label">Land</span>
                    </div>
                    <div className="planet-studio__color-item">
                        <input
                            type="color"
                            value={draftPlanet.palette?.mountain ?? "#047857"}
                            onChange={(e) => onPaletteChange("mountain", e.target.value)}
                            className="planet-studio__color-input"
                        />
                        <span className="planet-studio__color-label">Mountain</span>
                    </div>
                    <div className="planet-studio__color-item">
                        <input
                            type="color"
                            value={draftPlanet.palette?.peak ?? "#f8fafc"}
                            onChange={(e) => onPaletteChange("peak", e.target.value)}
                            className="planet-studio__color-input"
                        />
                        <span className="planet-studio__color-label">Peaks</span>
                    </div>
                    {draftPlanet.ring && (
                        <div className="planet-studio__color-item">
                            <input
                                type="color"
                                value={draftPlanet.ring.color}
                                onChange={(e) => onRingColorChange(e.target.value)}
                                className="planet-studio__color-input"
                            />
                            <span className="planet-studio__color-label">Ring</span>
                        </div>
                    )}
                </div>
            </div>

            {draftPlanet.ring && (
                <div className="planet-studio__card">
                    <span className="planet-studio__section-label">Planetary Ring Dimensions</span>

                    <div className="planet-studio__row">
                        <label className="planet-studio__slider-label">
                            <span>Inner Radius</span>
                            <span className="planet-studio__slider-value">
                                {draftPlanet.ring.innerRadius.toFixed(2)}
                            </span>
                        </label>
                    </div>
                    <input
                        type="range"
                        min={baseRadius * 1.1}
                        max={baseRadius * 2.5}
                        step="0.05"
                        value={draftPlanet.ring.innerRadius}
                        onChange={(e) => onRingParamChange("innerRadius", parseFloat(e.target.value))}
                        className="planet-studio__range"
                    />

                    <div className="planet-studio__row">
                        <label className="planet-studio__slider-label">
                            <span>Outer Radius</span>
                            <span className="planet-studio__slider-value">
                                {draftPlanet.ring.outerRadius.toFixed(2)}
                            </span>
                        </label>
                    </div>
                    <input
                        type="range"
                        min={draftPlanet.ring.innerRadius + 0.2}
                        max={baseRadius * 4.0}
                        step="0.05"
                        value={draftPlanet.ring.outerRadius}
                        onChange={(e) => onRingParamChange("outerRadius", parseFloat(e.target.value))}
                        className="planet-studio__range"
                    />

                    <div className="planet-studio__row">
                        <label className="planet-studio__slider-label">
                            <span>Ring Opacity</span>
                            <span className="planet-studio__slider-value">
                                {draftPlanet.ring.opacity?.toFixed(2) ?? "0.80"}
                            </span>
                        </label>
                    </div>
                    <input
                        type="range"
                        min="0.2"
                        max="1.0"
                        step="0.05"
                        value={draftPlanet.ring.opacity ?? 0.8}
                        onChange={(e) => onRingParamChange("opacity", parseFloat(e.target.value))}
                        className="planet-studio__range"
                    />
                </div>
            )}
        </>
    );
}

export default AppearancePanel;
