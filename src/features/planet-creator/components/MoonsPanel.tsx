import type { OrbitConfig } from "../../galaxy";

interface MoonsPanelProps {
    draftPlanet: OrbitConfig;
    activeMoonIndex: number;
    onSelectMoon: (index: number) => void;
    onAddMoon: () => void;
    onRemoveMoon: (id: string) => void;
    onMoonChange: (id: string, updates: Partial<OrbitConfig>) => void;
}

export function MoonsPanel({
    draftPlanet,
    activeMoonIndex,
    onSelectMoon,
    onAddMoon,
    onRemoveMoon,
    onMoonChange,
}: MoonsPanelProps) {
    const moons = draftPlanet.children ?? [];
    const activeMoon = moons[activeMoonIndex];
    const baseRadius = draftPlanet.radius ?? 1;

    const surfaceCollision = activeMoon
        ? (activeMoon.orbitRadius ?? 2.0) < baseRadius + activeMoon.radius + 0.1
        : false;

    const moonCollision = activeMoon
        ? moons.some((other) => {
              if (other.id === activeMoon.id) return false;
              const dist = Math.abs((activeMoon.orbitRadius ?? 2.0) - (other.orbitRadius ?? 2.0));
              return dist < activeMoon.radius + other.radius + 0.15;
          })
        : false;

    return (
        <div className="planet-studio__card">
            {(surfaceCollision || moonCollision) && (
                <div className="planet-studio__collision-warning">
                    <div className="planet-studio__collision-title">
                        Lunar Collision Warning
                    </div>
                    <div className="planet-studio__collision-desc">
                        {surfaceCollision
                            ? "This moon's orbit passes through the planet surface."
                            : "This moon's orbit intersects another moon's trajectory."}
                        &nbsp;Note: This is cosmetic only &mdash; physical collisions are not simulated.
                    </div>
                </div>
            )}

            <div className="planet-studio__moon-pill-bar">
                {moons.map((moon, mIdx) => (
                    <button
                        key={moon.id}
                        className={`planet-studio__moon-pill ${
                            activeMoonIndex === mIdx ? "planet-studio__moon-pill--active" : ""
                        }`}
                        onClick={() => onSelectMoon(mIdx)}
                    >
                        <span>Moon {mIdx + 1}</span>
                    </button>
                ))}

                <button className="planet-studio__moon-add-pill" onClick={onAddMoon}>
                    <span>+ Add Moon</span>
                </button>
            </div>

            {activeMoon ? (
                <div style={{ display: "flex", flexDirection: "column", gap: "12px", marginTop: "4px" }}>
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                        <span style={{ fontSize: "12px", fontWeight: 600, color: "var(--accent-cyan)" }}>
                            Moon {activeMoonIndex + 1} Settings
                        </span>
                        <button
                            className="planet-studio__moon-remove-btn"
                            onClick={() => onRemoveMoon(activeMoon.id)}
                        >
                            Remove Moon
                        </button>
                    </div>

                    <div className="planet-studio__row">
                        <label className="planet-studio__slider-label">
                            <span>Moon Radius</span>
                            <span className="planet-studio__slider-value">
                                {activeMoon.radius.toFixed(2)}
                            </span>
                        </label>
                    </div>
                    <input
                        type="range"
                        min="0.1"
                        max="0.6"
                        step="0.02"
                        value={activeMoon.radius}
                        onChange={(e) =>
                            onMoonChange(activeMoon.id, {
                                radius: parseFloat(e.target.value),
                            })
                        }
                        className="planet-studio__range"
                    />

                    <div className="planet-studio__row">
                        <label className="planet-studio__slider-label">
                            <span>Orbit Distance</span>
                            <span className="planet-studio__slider-value">
                                {(activeMoon.orbitRadius ?? 2.0).toFixed(2)}
                            </span>
                        </label>
                    </div>
                    <input
                        type="range"
                        min={baseRadius * 0.8}
                        max="7.0"
                        step="0.1"
                        value={activeMoon.orbitRadius ?? 2.0}
                        onChange={(e) =>
                            onMoonChange(activeMoon.id, {
                                orbitRadius: parseFloat(e.target.value),
                            })
                        }
                        className="planet-studio__range"
                    />

                    <div className="planet-studio__row">
                        <label className="planet-studio__slider-label">
                            <span>Orbit Speed</span>
                            <span className="planet-studio__slider-value">
                                {(activeMoon.orbitSpeed ?? 0.8).toFixed(2)}
                            </span>
                        </label>
                    </div>
                    <input
                        type="range"
                        min="0.1"
                        max="2.5"
                        step="0.05"
                        value={activeMoon.orbitSpeed ?? 0.8}
                        onChange={(e) =>
                            onMoonChange(activeMoon.id, {
                                orbitSpeed: parseFloat(e.target.value),
                            })
                        }
                        className="planet-studio__range"
                    />

                    <div className="planet-studio__row">
                        <label className="planet-studio__slider-label">
                            <span>Axial Spin Speed</span>
                            <span className="planet-studio__slider-value">
                                {activeMoon.rotationSpeed.toFixed(2)}
                            </span>
                        </label>
                    </div>
                    <input
                        type="range"
                        min="0.1"
                        max="2.0"
                        step="0.05"
                        value={activeMoon.rotationSpeed}
                        onChange={(e) =>
                            onMoonChange(activeMoon.id, {
                                rotationSpeed: parseFloat(e.target.value),
                            })
                        }
                        className="planet-studio__range"
                    />

                    <div style={{ display: "flex", alignItems: "center", gap: "12px", marginTop: "2px" }}>
                        <span style={{ fontSize: "11px", color: "var(--text-secondary)" }}>Moon Color:</span>
                        <input
                            type="color"
                            value={activeMoon.palette?.land ?? activeMoon.color ?? "#cbd5e1"}
                            onChange={(e) =>
                                onMoonChange(activeMoon.id, {
                                    color: e.target.value,
                                    palette: {
                                        land: e.target.value,
                                        mountain: e.target.value,
                                        peak: "#ffffff",
                                    },
                                })
                            }
                            className="planet-studio__color-input"
                            style={{ width: "32px", height: "32px" }}
                        />
                    </div>
                </div>
            ) : (
                <div style={{ textAlign: "center", padding: "20px 0", color: "var(--text-muted)", fontSize: "12px" }}>
                    No orbiting moons configured. Click &ldquo;+ Add Moon&rdquo; to create one.
                </div>
            )}
        </div>
    );
}

export default MoonsPanel;
