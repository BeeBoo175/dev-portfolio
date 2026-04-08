import type { AsteroidBeltConfig } from "../../galaxy";

interface AsteroidBeltPanelProps {
    draftBelt: AsteroidBeltConfig;
    onBeltChange: (updates: Partial<AsteroidBeltConfig>) => void;
    onRandomizeSeed: () => void;
}

export function AsteroidBeltPanel({
    draftBelt,
    onBeltChange,
    onRandomizeSeed,
}: AsteroidBeltPanelProps) {
    const inclinationDeg = (((draftBelt.inclination ?? 0) * 180) / Math.PI).toFixed(1);

    return (
        <div className="planet-studio__card">
            <div className="planet-studio__belt-header-row">
                <div>
                    <span className="planet-studio__section-label">Main Asteroid Belt</span>
                    <p style={{ fontSize: "11px", color: "var(--text-muted)", margin: "2px 0 0" }}>
                        Procedurally instanced debris field orbiting between terrestrial and outer planets.
                    </p>
                </div>
                <button
                    className={`planet-studio__toggle-btn ${
                        draftBelt.enabled ? "planet-studio__toggle-btn--active" : ""
                    }`}
                    onClick={() => onBeltChange({ enabled: !draftBelt.enabled })}
                    title="Toggle asteroid belt visibility"
                >
                    {draftBelt.enabled ? "Enabled" : "Disabled"}
                </button>
            </div>

            <div className="planet-studio__row" style={{ marginTop: "4px" }}>
                <label className="planet-studio__slider-label">
                    <span>Inner Orbit Radius</span>
                    <span className="planet-studio__slider-value">
                        {draftBelt.innerRadius.toFixed(1)}
                    </span>
                </label>
            </div>
            <input
                type="range"
                min="8.0"
                max="24.0"
                step="0.2"
                value={draftBelt.innerRadius}
                onChange={(e) => {
                    const newInner = parseFloat(e.target.value);
                    onBeltChange({
                        innerRadius: newInner,
                        outerRadius: Math.max(newInner + 0.8, draftBelt.outerRadius),
                    });
                }}
                className="planet-studio__range"
            />

            <div className="planet-studio__row">
                <label className="planet-studio__slider-label">
                    <span>Outer Orbit Radius</span>
                    <span className="planet-studio__slider-value">
                        {draftBelt.outerRadius.toFixed(1)}
                    </span>
                </label>
            </div>
            <input
                type="range"
                min={draftBelt.innerRadius + 0.5}
                max="28.0"
                step="0.2"
                value={draftBelt.outerRadius}
                onChange={(e) => onBeltChange({ outerRadius: parseFloat(e.target.value) })}
                className="planet-studio__range"
            />

            <div className="planet-studio__row">
                <label className="planet-studio__slider-label">
                    <span>Asteroid Density / Count</span>
                    <span className="planet-studio__slider-value">{draftBelt.count}</span>
                </label>
            </div>
            <input
                type="range"
                min="50"
                max="750"
                step="25"
                value={draftBelt.count}
                onChange={(e) => onBeltChange({ count: parseInt(e.target.value, 10) })}
                className="planet-studio__range"
            />

            <div className="planet-studio__row">
                <label className="planet-studio__slider-label">
                    <span>Orbit Speed</span>
                    <span className="planet-studio__slider-value">
                        {draftBelt.orbitSpeed.toFixed(2)}
                    </span>
                </label>
            </div>
            <input
                type="range"
                min="0.01"
                max="0.30"
                step="0.01"
                value={draftBelt.orbitSpeed}
                onChange={(e) => onBeltChange({ orbitSpeed: parseFloat(e.target.value) })}
                className="planet-studio__range"
            />

            <div className="planet-studio__row">
                <label className="planet-studio__slider-label">
                    <span>Vertical Thickness (Height Spread)</span>
                    <span className="planet-studio__slider-value">
                        {draftBelt.heightSpread.toFixed(2)}
                    </span>
                </label>
            </div>
            <input
                type="range"
                min="0.1"
                max="2.0"
                step="0.05"
                value={draftBelt.heightSpread}
                onChange={(e) => onBeltChange({ heightSpread: parseFloat(e.target.value) })}
                className="planet-studio__range"
            />

            <div className="planet-studio__row">
                <label className="planet-studio__slider-label">
                    <span>Belt Inclination Angle</span>
                    <span className="planet-studio__slider-value">{inclinationDeg}&deg;</span>
                </label>
            </div>
            <input
                type="range"
                min="-0.4"
                max="0.4"
                step="0.01"
                value={draftBelt.inclination ?? 0}
                onChange={(e) => onBeltChange({ inclination: parseFloat(e.target.value) })}
                className="planet-studio__range"
            />

            <div className="planet-studio__row">
                <label className="planet-studio__slider-label">
                    <span>Asteroid Max Size</span>
                    <span className="planet-studio__slider-value">
                        {draftBelt.maxSize.toFixed(2)}
                    </span>
                </label>
            </div>
            <input
                type="range"
                min="0.08"
                max="0.4"
                step="0.01"
                value={draftBelt.maxSize}
                onChange={(e) => onBeltChange({ maxSize: parseFloat(e.target.value) })}
                className="planet-studio__range"
            />

            <div style={{ display: "flex", alignItems: "center", gap: "20px", marginTop: "4px" }}>
                <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                    <input
                        type="color"
                        value={draftBelt.color ?? "#9ca3af"}
                        onChange={(e) => onBeltChange({ color: e.target.value })}
                        className="planet-studio__color-input"
                    />
                    <span style={{ fontSize: "11px", color: "var(--text-secondary)" }}>
                        Primary Rock
                    </span>
                </div>
                <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                    <input
                        type="color"
                        value={draftBelt.secondaryColor ?? "#57534e"}
                        onChange={(e) => onBeltChange({ secondaryColor: e.target.value })}
                        className="planet-studio__color-input"
                    />
                    <span style={{ fontSize: "11px", color: "var(--text-secondary)" }}>
                        Secondary Rock
                    </span>
                </div>
                <button
                    className="planet-studio__btn planet-studio__btn--secondary"
                    onClick={onRandomizeSeed}
                    style={{ marginLeft: "auto", fontSize: "11px", padding: "4px 10px" }}
                >
                    Reseed Belt
                </button>
            </div>
        </div>
    );
}

export default AsteroidBeltPanel;
