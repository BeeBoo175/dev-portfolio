import type { OrbitConfig } from "../../galaxy";
import { DEFAULT_RING_CONFIG } from "../../galaxy";
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
                    opacity: DEFAULT_RING_CONFIG.opacity,
                    emissiveIntensity: DEFAULT_RING_CONFIG.emissiveIntensity,
                    gapPosition: DEFAULT_RING_CONFIG.gapPosition,
                    gapWidth: DEFAULT_RING_CONFIG.gapWidth,
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
                                        id={`palette-${layer.key}`}
                                        type="color"
                                        aria-label={layer.label}
                                        value={currentColor}
                                        onChange={(e) => {
                                            const val = e.target.value;
                                            onChange((prev) => ({
                                                ...prev,
                                                palette: { ...prev.palette, [layer.key]: val },
                                            }));
                                        }}
                                    />
                                    <label htmlFor={`palette-${layer.key}`} className="studio-color-picker__label">{layer.label}</label>
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
                        <label className="studio-switch" aria-label="Toggle Planetary Rings">
                            <input
                                type="checkbox"
                                checked={!!ring}
                                onChange={handleToggleRing}
                                aria-label="Toggle Planetary Rings"
                            />
                            <span className="studio-switch__slider" aria-hidden="true" />
                        </label>
                    </div>

                    {ring && (
                        <>
                            <div className="studio-field">
                                <div className="studio-field__label-row">
                                    <label htmlFor="ring-seed">Procedural Seed</label>
                                    <span className="studio-field__value">{ring.seed ?? 42}</span>
                                    <Tooltip text="Deterministic seed configuring the concentric band frequency, striation patterns, and harmonic density." />
                                </div>
                                <div className="studio-field__input-with-btn">
                                    <input
                                        id="ring-seed"
                                        type="number"
                                        value={ring.seed ?? 42}
                                        onChange={(e) => {
                                            const val = parseInt(e.target.value, 10) || 1;
                                            onChange((prev) => ({
                                                ...prev,
                                                ring: prev.ring ? { ...prev.ring, seed: val } : undefined,
                                            }));
                                        }}
                                    />
                                    <button
                                        type="button"
                                        className="studio-btn studio-btn--ghost studio-btn--sm"
                                        onClick={() => {
                                            const nextSeed = Math.floor(Math.random() * 9999) + 1;
                                            onChange((prev) => ({
                                                ...prev,
                                                ring: prev.ring ? { ...prev.ring, seed: nextSeed } : undefined,
                                            }));
                                        }}
                                    >
                                        Shuffle
                                    </button>
                                </div>
                            </div>

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
                                    <label htmlFor="ring-emissive">Ring Emissive Glow</label>
                                    <span className="studio-field__value">{(ring.emissiveIntensity ?? 0.15).toFixed(2)}</span>
                                    <Tooltip text="Self-illumination glow intensity of the ring dust against dark space." />
                                </div>
                                <input
                                    id="ring-emissive"
                                    type="range"
                                    min="0.0"
                                    max="1.0"
                                    step="0.02"
                                    value={ring.emissiveIntensity ?? 0.15}
                                    onChange={(e) => {
                                        const val = parseFloat(e.target.value);
                                        onChange((prev) => ({
                                            ...prev,
                                            ring: prev.ring ? { ...prev.ring, emissiveIntensity: val } : undefined,
                                        }));
                                    }}
                                />
                            </div>

                            <div className="studio-field">
                                <div className="studio-field__label-row">
                                    <label htmlFor="ring-gap-pos">Ring Gap Position</label>
                                    <span className="studio-field__value">{Math.round((ring.gapPosition ?? 0.615) * 100)}%</span>
                                    <Tooltip text="Radial position of the Cassini division / major optical gap within the ring span." />
                                </div>
                                <input
                                    id="ring-gap-pos"
                                    type="range"
                                    min="0.15"
                                    max="0.85"
                                    step="0.01"
                                    value={ring.gapPosition ?? 0.615}
                                    onChange={(e) => {
                                        const val = parseFloat(e.target.value);
                                        onChange((prev) => ({
                                            ...prev,
                                            ring: prev.ring ? { ...prev.ring, gapPosition: val } : undefined,
                                        }));
                                    }}
                                />
                            </div>

                            <div className="studio-field">
                                <div className="studio-field__label-row">
                                    <label htmlFor="ring-gap-width">Ring Gap Width</label>
                                    <span className="studio-field__value">{(ring.gapWidth ?? 0.07).toFixed(2)}</span>
                                    <Tooltip text="Thickness and clearance of the optical ring gap (set to 0 for a continuous ring)." />
                                </div>
                                <input
                                    id="ring-gap-width"
                                    type="range"
                                    min="0.0"
                                    max="0.25"
                                    step="0.01"
                                    value={ring.gapWidth ?? 0.07}
                                    onChange={(e) => {
                                        const val = parseFloat(e.target.value);
                                        onChange((prev) => ({
                                            ...prev,
                                            ring: prev.ring ? { ...prev.ring, gapWidth: val } : undefined,
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
                                        aria-label="Ring Color"
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
