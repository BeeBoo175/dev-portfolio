import type { OrbitConfig } from "../../galaxy";
import { generateRandomTerrain } from "../presets";
import { Tooltip } from "../../../components/ui/Tooltip";

export interface TerrainPanelProps {
    planet: OrbitConfig;
    onChange: (updater: (prev: OrbitConfig) => OrbitConfig) => void;
}

export function TerrainPanel({ planet, onChange }: TerrainPanelProps) {
    const terrain = planet.terrain || {
        seed: 12,
        noiseScale: 1.5,
        roughness: 0.25,
        waterLevel: 0.4,
        detail: 3,
    };

    const handleRandomSeed = () => {
        const newSeed = Math.floor(Math.random() * 9999) + 1;
        onChange((prev) => ({
            ...prev,
            terrain: { ...prev.terrain, seed: newSeed },
        }));
    };

    const handleRandomizeAllTerrain = () => {
        const newTerrain = generateRandomTerrain();
        onChange((prev) => ({
            ...prev,
            terrain: newTerrain,
        }));
    };

    return (
        <div className="studio-panel">
            <div className="studio-panel__section">
                <div className="studio-panel__header-row">
                    <span className="studio-panel__title">Procedural Elevation & Noise</span>
                    <div className="studio-panel__actions">
                        <button
                            type="button"
                            className="studio-btn studio-btn--secondary studio-btn--sm"
                            onClick={handleRandomizeAllTerrain}
                        >
                            Randomize Terrain
                        </button>
                    </div>
                </div>

                <div className="studio-field">
                    <div className="studio-field__label-row">
                        <label htmlFor="terrain-seed">Procedural Seed</label>
                        <span className="studio-field__value">{terrain.seed ?? 1}</span>
                        <Tooltip text="Integer seed determining the Simplex noise mathematical permutation map." />
                    </div>
                    <div className="studio-field__input-with-btn">
                        <input
                            id="terrain-seed"
                            type="number"
                            value={terrain.seed ?? 1}
                            onChange={(e) => {
                                const val = parseInt(e.target.value, 10) || 1;
                                onChange((prev) => ({
                                    ...prev,
                                    terrain: { ...prev.terrain, seed: val },
                                }));
                            }}
                        />
                        <button
                            type="button"
                            className="studio-btn studio-btn--ghost studio-btn--sm"
                            onClick={handleRandomSeed}
                        >
                            Shuffle
                        </button>
                    </div>
                </div>

                <div className="studio-field">
                    <div className="studio-field__label-row">
                        <label htmlFor="terrain-scale">Feature Scale / Frequency</label>
                        <span className="studio-field__value">{(terrain.noiseScale ?? 1.5).toFixed(2)}</span>
                        <Tooltip text="Continental feature size. Higher values yield denser islands and jagged crags." />
                    </div>
                    <input
                        id="terrain-scale"
                        type="range"
                        min="0.5"
                        max="4.0"
                        step="0.05"
                        value={terrain.noiseScale ?? 1.5}
                        onChange={(e) => {
                            const val = parseFloat(e.target.value);
                            onChange((prev) => ({
                                ...prev,
                                terrain: { ...prev.terrain, noiseScale: val },
                            }));
                        }}
                    />
                </div>

                <div className="studio-field">
                    <div className="studio-field__label-row">
                        <label htmlFor="terrain-roughness">Mountain Peak Roughness</label>
                        <span className="studio-field__value">{(terrain.roughness ?? 0.25).toFixed(2)}</span>
                        <Tooltip text="Vertical displacement amplitude multiplier for mountain ranges and canyons." />
                    </div>
                    <input
                        id="terrain-roughness"
                        type="range"
                        min="0.0"
                        max="0.6"
                        step="0.01"
                        value={terrain.roughness ?? 0.25}
                        onChange={(e) => {
                            const val = parseFloat(e.target.value);
                            onChange((prev) => ({
                                ...prev,
                                terrain: { ...prev.terrain, roughness: val },
                            }));
                        }}
                    />
                </div>

                <div className="studio-field">
                    <div className="studio-field__label-row">
                        <label htmlFor="terrain-water">Sea Level / Water Height</label>
                        <span className="studio-field__value">{(terrain.waterLevel ?? 0.4).toFixed(2)}</span>
                        <Tooltip text="Spherical threshold radius where oceanic surface flattens over underlying terrain." />
                    </div>
                    <input
                        id="terrain-water"
                        type="range"
                        min="0.0"
                        max="0.8"
                        step="0.02"
                        value={terrain.waterLevel ?? 0.4}
                        onChange={(e) => {
                            const val = parseFloat(e.target.value);
                            onChange((prev) => ({
                                ...prev,
                                terrain: { ...prev.terrain, waterLevel: val },
                            }));
                        }}
                    />
                </div>

                <div className="studio-field">
                    <div className="studio-field__label-row">
                        <label htmlFor="terrain-detail">Mesh Polygon Detail</label>
                        <span className="studio-field__value">{terrain.detail ?? 3} (Ico Subdivs)</span>
                        <Tooltip text="Geometric polygon density for the low-poly icosahedron sphere." />
                    </div>
                    <input
                        id="terrain-detail"
                        type="range"
                        min="1"
                        max="4"
                        step="1"
                        value={terrain.detail ?? 3}
                        onChange={(e) => {
                            const val = parseInt(e.target.value, 10);
                            onChange((prev) => ({
                                ...prev,
                                terrain: { ...prev.terrain, detail: val },
                            }));
                        }}
                    />
                </div>
            </div>
        </div>
    );
}

export default TerrainPanel;
