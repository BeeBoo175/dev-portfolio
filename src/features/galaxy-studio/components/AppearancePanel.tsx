import type { OrbitConfig } from "../../galaxy";
import { BIOME_PRESETS, generateRandomPlanet } from "../presets";
import { Tooltip } from "../../../components/ui/Tooltip";

export interface AppearancePanelProps {
    planet: OrbitConfig;
    onChange: (updater: (prev: OrbitConfig) => OrbitConfig) => void;
    isMoon?: boolean;
    minRadius?: number;
    maxRadius?: number;
}

export function AppearancePanel({
    planet,
    onChange,
    isMoon = false,
    minRadius = 0.5,
    maxRadius = 2.5,
}: AppearancePanelProps) {
    const palette = planet.palette || {};
    const ring = planet.ring;

    const handleApplyBiome = (presetId: string) => {
        const preset = BIOME_PRESETS.find((p) => p.id === presetId);
        if (!preset) return;
        onChange((prev) => ({
            ...prev,
            color: preset.color,
            palette: { ...preset.palette },
            terrain: { ...prev.terrain, ...preset.terrain },
        }));
    };

    const handleRandomizePlanet = () => {
        const randomized = generateRandomPlanet(planet);
        onChange(() => randomized);
    };

    const handleToggleRing = () => {
        onChange((prev) => {
            if (prev.ring) {
                return { ...prev, ring: undefined };
            }
            return {
                ...prev,
                ring: {
                    innerRadius: Number((prev.radius * 1.35 + 0.1).toFixed(2)),
                    outerRadius: Number((prev.radius * 1.95 + 0.3).toFixed(2)),
                    color: prev.palette?.coast ?? prev.color ?? "#38bdf8",
                    opacity: 0.75,
                },
            };
        });
    };

    return (
        <div className="studio-panel">
            <div className="studio-panel__section">
                <div className="studio-panel__header-row">
                    <span className="studio-panel__title">{isMoon ? "Satellite Palette & Size" : "Biome & Palette"}</span>
                    <div className="studio-panel__actions">
                        <button
                            type="button"
                            className="studio-btn studio-btn--secondary studio-btn--sm"
                            onClick={handleRandomizePlanet}
                        >
                            {isMoon ? "Randomize Moon" : "Randomize Planet"}
                        </button>
                    </div>
                </div>

                <div className="studio-field">
                    <div className="studio-field__label-row">
                        <label htmlFor="planet-radius">{isMoon ? "Moon Radius" : "Planet Radius"}</label>
                        <span className="studio-field__value">{planet.radius.toFixed(2)}</span>
                        <Tooltip text={isMoon ? "Physical radius of the satellite sphere." : "Physical radius of the planet's terrain sphere."} />
                    </div>
                    <input
                        id="planet-radius"
                        type="range"
                        min={minRadius}
                        max={maxRadius}
                        step="0.02"
                        value={planet.radius}
                        onChange={(e) => {
                            const val = parseFloat(e.target.value);
                            onChange((prev) => ({
                                ...prev,
                                radius: val,
                                ring: prev.ring
                                    ? {
                                          ...prev.ring,
                                          innerRadius: Number((val * 1.35 + 0.1).toFixed(2)),
                                          outerRadius: Number((val * 1.95 + 0.3).toFixed(2)),
                                      }
                                    : undefined,
                            }));
                        }}
                    />
                </div>

                <div className="studio-field">
                    <div className="studio-field__label-row">
                        <span>Biome Presets</span>
                        <Tooltip text="One-click procedural biomes with tailored palettes and elevation curves." />
                    </div>
                    <div className="studio-presets-grid">
                        {BIOME_PRESETS.map((preset) => (
                            <button
                                key={preset.id}
                                type="button"
                                className="studio-preset-chip"
                                style={{
                                    borderLeftColor: preset.color,
                                }}
                                onClick={() => handleApplyBiome(preset.id)}
                            >
                                <span
                                    className="studio-preset-chip__dot"
                                    style={{ backgroundColor: preset.color }}
                                />
                                <span className="studio-preset-chip__name">{preset.name}</span>
                            </button>
                        ))}
                    </div>
                </div>

                <div className="studio-field">
                    <div className="studio-field__label-row">
                        <span>Elevation Layer Colors</span>
                        <Tooltip text="Custom chromatic gradient mapping from oceanic abyss to alpine peaks." />
                    </div>
                    <div className="studio-palette-grid">
                        {[
                            { key: "water", label: "Water / Ocean", default: "#0284c7" },
                            { key: "coast", label: "Coast / Beach", default: "#38bdf8" },
                            { key: "land", label: "Lowland / Plain", default: "#10b981" },
                            { key: "mountain", label: "Highland / Rock", default: "#047857" },
                            { key: "peak", label: "Snow / Peak", default: "#f8fafc" },
                        ].map((layer) => {
                            const currentColor =
                                (palette as Record<string, string | undefined>)[layer.key] || layer.default;
                            return (
                                <div key={layer.key} className="studio-color-picker studio-color-picker--compact">
                                    <input
                                        type="color"
                                        value={currentColor}
                                        onChange={(e) => {
                                            const val = e.target.value;
                                            onChange((prev) => ({
                                                ...prev,
                                                palette: { ...prev.palette, [layer.key]: val },
                                            }));
                                        }}
                                    />
                                    <span className="studio-color-picker__label">{layer.label}</span>
                                </div>
                            );
                        })}
                    </div>
                </div>
            </div>

            {!isMoon && (
                <div className="studio-panel__section">
                    <div className="studio-panel__header-row">
                        <span className="studio-panel__title">Planetary Rings</span>
                        <label className="studio-switch">
                            <input
                                type="checkbox"
                                checked={!!ring}
                                onChange={handleToggleRing}
                            />
                            <span className="studio-switch__slider" />
                        </label>
                    </div>

                    {ring && (
                        <>
                            <div className="studio-field">
                                <div className="studio-field__label-row">
                                    <label htmlFor="ring-inner">Inner Ring Radius</label>
                                    <span className="studio-field__value">{ring.innerRadius.toFixed(2)}</span>
                                    <Tooltip text="Inner clearance boundary of the ring disc relative to planetary core." />
                                </div>
                                <input
                                    id="ring-inner"
                                    type="range"
                                    min={planet.radius + 0.1}
                                    max={planet.radius + 2.5}
                                    step="0.05"
                                    value={ring.innerRadius}
                                    onChange={(e) => {
                                        const val = parseFloat(e.target.value);
                                        onChange((prev) => ({
                                            ...prev,
                                            ring: prev.ring ? { ...prev.ring, innerRadius: val } : undefined,
                                        }));
                                    }}
                                />
                            </div>

                            <div className="studio-field">
                                <div className="studio-field__label-row">
                                    <label htmlFor="ring-outer">Outer Ring Radius</label>
                                    <span className="studio-field__value">{ring.outerRadius.toFixed(2)}</span>
                                    <Tooltip text="Outer boundary radius of the particle debris ring system." />
                                </div>
                                <input
                                    id="ring-outer"
                                    type="range"
                                    min={ring.innerRadius + 0.2}
                                    max={planet.radius + 4.0}
                                    step="0.05"
                                    value={ring.outerRadius}
                                    onChange={(e) => {
                                        const val = parseFloat(e.target.value);
                                        onChange((prev) => ({
                                            ...prev,
                                            ring: prev.ring ? { ...prev.ring, outerRadius: val } : undefined,
                                        }));
                                    }}
                                />
                            </div>

                            <div className="studio-field">
                                <div className="studio-field__label-row">
                                    <label htmlFor="ring-opacity">Ring Opacity</label>
                                    <span className="studio-field__value">{(ring.opacity ?? 0.75).toFixed(2)}</span>
                                    <Tooltip text="Translucency factor of the ring disc." />
                                </div>
                                <input
                                    id="ring-opacity"
                                    type="range"
                                    min="0.1"
                                    max="1.0"
                                    step="0.05"
                                    value={ring.opacity ?? 0.75}
                                    onChange={(e) => {
                                        const val = parseFloat(e.target.value);
                                        onChange((prev) => ({
                                            ...prev,
                                            ring: prev.ring ? { ...prev.ring, opacity: val } : undefined,
                                        }));
                                    }}
                                />
                            </div>

                            <div className="studio-field">
                                <div className="studio-field__label-row">
                                    <label htmlFor="ring-color">Ring Color</label>
                                    <Tooltip text="Diffuse tint color of the planetary dust particles." />
                                </div>
                                <div className="studio-color-picker">
                                    <input
                                        id="ring-color"
                                        type="color"
                                        value={ring.color || "#38bdf8"}
                                        onChange={(e) => {
                                            const val = e.target.value;
                                            onChange((prev) => ({
                                                ...prev,
                                                ring: prev.ring ? { ...prev.ring, color: val } : undefined,
                                            }));
                                        }}
                                    />
                                    <span className="studio-color-picker__hex">{ring.color || "#38bdf8"}</span>
                                </div>
                            </div>
                        </>
                    )}
                </div>
            )}
        </div>
    );
}

export default AppearancePanel;
