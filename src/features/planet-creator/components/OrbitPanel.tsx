import type { OrbitConfig } from "../../galaxy";

interface OrbitPanelProps {
    draftPlanet: OrbitConfig;
    onOrbitalChange: (
        key: "radius" | "orbitRadius" | "orbitSpeed" | "rotationSpeed" | "initialAngle" | "axialTilt" | "orbitInclination",
        val: number
    ) => void;
}

export function OrbitPanel({ draftPlanet, onOrbitalChange }: OrbitPanelProps) {
    const axialTiltDeg = (((draftPlanet.axialTilt ?? 0) * 180) / Math.PI).toFixed(1);
    const orbitInclinationDeg = (((draftPlanet.orbitInclination ?? 0) * 180) / Math.PI).toFixed(1);

    return (
        <div className="planet-studio__card">

            <div className="planet-studio__row">
                <label className="planet-studio__slider-label">
                    <span>Planet Radius / Size</span>
                    <span className="planet-studio__slider-value">{draftPlanet.radius.toFixed(2)}</span>
                </label>
            </div>
            <input
                type="range"
                min="0.4"
                max="4.0"
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
                max="40.0"
                step="0.2"
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
                min="0.01"
                max="0.8"
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
                min="-1.2"
                max="1.2"
                step="0.01"
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
                min="0.02"
                max="2.5"
                step="0.02"
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
                max="3.14"
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
                step="0.05"
                value={draftPlanet.initialAngle ?? 0}
                onChange={(e) => onOrbitalChange("initialAngle", parseFloat(e.target.value))}
                className="planet-studio__range"
            />
        </div>
    );
}

export default OrbitPanel;
