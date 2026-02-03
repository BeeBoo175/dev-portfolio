import type { OrbitConfig } from "../../galaxy";
import { detectPlanetCollisions } from "../../galaxy";

interface OrbitPanelProps {
    draftPlanet: OrbitConfig;
    allPlanets?: OrbitConfig[];
    onOrbitalChange: (
        key: "radius" | "orbitRadius" | "orbitSpeed" | "rotationSpeed" | "initialAngle" | "axialTilt" | "orbitInclination",
        val: number
    ) => void;
}

export function OrbitPanel({ draftPlanet, allPlanets = [], onOrbitalChange }: OrbitPanelProps) {
    const warnings = detectPlanetCollisions(draftPlanet, allPlanets);
    const axialTiltDeg = (((draftPlanet.axialTilt ?? 0) * 180) / Math.PI).toFixed(1);
    const orbitInclinationDeg = (((draftPlanet.orbitInclination ?? 0) * 180) / Math.PI).toFixed(1);

    return (
        <div className="planet-studio__card">
            {warnings.length > 0 && (
                <div className="planet-studio__collision-warning">
                    <div className="planet-studio__collision-title">
                        Orbital Intersection Warning ({warnings.length})
                    </div>
                    {warnings.map((w) => (
                        <div key={w.id} className="planet-studio__collision-desc">
                            <strong>{w.title}:</strong> {w.description}
                        </div>
                    ))}
                </div>
            )}

            <div className="planet-studio__row">
                <label className="planet-studio__slider-label">
                    <span>Planet Radius / Size</span>
                    <span className="planet-studio__slider-value">{draftPlanet.radius.toFixed(2)}</span>
                </label>
            </div>
            <input
                type="range"
                min="0.6"
                max="2.5"
                step="0.05"
                value={draftPlanet.radius}
                onChange={(e) => onOrbitalChange("radius", parseFloat(e.target.value))}
                className="planet-studio__range"
            />

            <div className="planet-studio__row">
                <label className="planet-studio__slider-label">
                    <span>Solar Orbit Distance</span>
                    <span className="planet-studio__slider-value">
                        {(draftPlanet.orbitRadius ?? 10.0).toFixed(1)}
                    </span>
                </label>
            </div>
            <input
                type="range"
                min="4.0"
                max="26.0"
                step="0.5"
                value={draftPlanet.orbitRadius ?? 10.0}
                onChange={(e) => onOrbitalChange("orbitRadius", parseFloat(e.target.value))}
                className="planet-studio__range"
            />

            <div className="planet-studio__row">
                <label className="planet-studio__slider-label">
                    <span>Solar Orbit Speed</span>
                    <span className="planet-studio__slider-value">
                        {(draftPlanet.orbitSpeed ?? 0.15).toFixed(2)}
                    </span>
                </label>
            </div>
            <input
                type="range"
                min="0.02"
                max="0.5"
                step="0.01"
                value={draftPlanet.orbitSpeed ?? 0.15}
                onChange={(e) => onOrbitalChange("orbitSpeed", parseFloat(e.target.value))}
                className="planet-studio__range"
            />

            <div className="planet-studio__row">
                <label className="planet-studio__slider-label">
                    <span>Orbit Plane Inclination</span>
                    <span className="planet-studio__slider-value">{orbitInclinationDeg}&deg;</span>
                </label>
            </div>
            <input
                type="range"
                min="-0.78"
                max="0.78"
                step="0.02"
                value={draftPlanet.orbitInclination ?? 0}
                onChange={(e) => onOrbitalChange("orbitInclination", parseFloat(e.target.value))}
                className="planet-studio__range"
            />

            <div className="planet-studio__row">
                <label className="planet-studio__slider-label">
                    <span>Axial Spin Speed</span>
                    <span className="planet-studio__slider-value">{draftPlanet.rotationSpeed.toFixed(2)}</span>
                </label>
            </div>
            <input
                type="range"
                min="0.05"
                max="1.5"
                step="0.05"
                value={draftPlanet.rotationSpeed}
                onChange={(e) => onOrbitalChange("rotationSpeed", parseFloat(e.target.value))}
                className="planet-studio__range"
            />

            <div className="planet-studio__row">
                <label className="planet-studio__slider-label">
                    <span>Axial Polar Tilt</span>
                    <span className="planet-studio__slider-value">{axialTiltDeg}&deg;</span>
                </label>
            </div>
            <input
                type="range"
                min="0.0"
                max="1.57"
                step="0.02"
                value={draftPlanet.axialTilt ?? 0}
                onChange={(e) => onOrbitalChange("axialTilt", parseFloat(e.target.value))}
                className="planet-studio__range"
            />

            <div className="planet-studio__row">
                <label className="planet-studio__slider-label">
                    <span>Initial Orbit Angle</span>
                    <span className="planet-studio__slider-value">
                        {(draftPlanet.initialAngle ?? 0).toFixed(2)} rad
                    </span>
                </label>
            </div>
            <input
                type="range"
                min="0.0"
                max="6.28"
                step="0.1"
                value={draftPlanet.initialAngle ?? 0}
                onChange={(e) => onOrbitalChange("initialAngle", parseFloat(e.target.value))}
                className="planet-studio__range"
            />
        </div>
    );
}

export default OrbitPanel;
