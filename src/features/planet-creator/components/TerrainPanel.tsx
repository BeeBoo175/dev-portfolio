import type { OrbitConfig } from "../../galaxy";

interface TerrainPanelProps {
    draftPlanet: OrbitConfig;
    onTerrainChange: (key: keyof NonNullable<OrbitConfig["terrain"]>, val: number) => void;
}

export function TerrainPanel({ draftPlanet, onTerrainChange }: TerrainPanelProps) {
    const roughness = draftPlanet.terrain?.roughness ?? 0.2;
    const waterLevel = draftPlanet.terrain?.waterLevel ?? 0.4;
    const noiseScale = draftPlanet.terrain?.noiseScale ?? 1.4;
    const seed = draftPlanet.terrain?.seed ?? 42;

    return (
        <div className="planet-studio__card">
            <div className="planet-studio__row">
                <label className="planet-studio__slider-label">
                    <span>Mountain Roughness</span>
                    <span className="planet-studio__slider-value">{roughness.toFixed(2)}</span>
                </label>
            </div>
            <input
                type="range"
                min="0.0"
                max="0.45"
                step="0.01"
                value={roughness}
                onChange={(e) => onTerrainChange("roughness", parseFloat(e.target.value))}
                className="planet-studio__range"
            />

            <div className="planet-studio__row">
                <label className="planet-studio__slider-label">
                    <span>Sea Level / Ocean Coverage</span>
                    <span className="planet-studio__slider-value">{waterLevel.toFixed(2)}</span>
                </label>
            </div>
            <input
                type="range"
                min="0.0"
                max="0.75"
                step="0.02"
                value={waterLevel}
                onChange={(e) => onTerrainChange("waterLevel", parseFloat(e.target.value))}
                className="planet-studio__range"
            />

            <div className="planet-studio__row">
                <label className="planet-studio__slider-label">
                    <span>Continent Scale</span>
                    <span className="planet-studio__slider-value">{noiseScale.toFixed(2)}</span>
                </label>
            </div>
            <input
                type="range"
                min="0.5"
                max="3.0"
                step="0.1"
                value={noiseScale}
                onChange={(e) => onTerrainChange("noiseScale", parseFloat(e.target.value))}
                className="planet-studio__range"
            />

            <div className="planet-studio__row">
                <label className="planet-studio__slider-label">
                    <span>Procedural Seed</span>
                    <span className="planet-studio__slider-value">{seed}</span>
                </label>
            </div>
            <input
                type="range"
                min="1"
                max="500"
                step="1"
                value={seed}
                onChange={(e) => onTerrainChange("seed", parseInt(e.target.value, 10))}
                className="planet-studio__range"
            />
        </div>
    );
}

export default TerrainPanel;
