import type { OrbitConfig } from "../../galaxy";
import { Tooltip } from "../../../components/ui/Tooltip";

export interface Orbit3DPanelProps {
    planet: OrbitConfig;
    onChange: (updater: (prev: OrbitConfig) => OrbitConfig) => void;
    isMoon?: boolean;
    minRadius?: number;
    maxRadius?: number;
}

const RAD_TO_DEG = 180 / Math.PI;
const DEG_TO_RAD = Math.PI / 180;

export function Orbit3DPanel({
    planet,
    onChange,
    isMoon = false,
    minRadius = 5.0,
    maxRadius = 35.0,
}: Orbit3DPanelProps) {
    const orbitRadius = planet.orbitRadius ?? 0;
    const orbitSpeed = planet.orbitSpeed ?? 0;
    const initialAngle = planet.initialAngle ?? 0;
    const orbitInclination = (planet.orbitInclination ?? 0) * RAD_TO_DEG;
    const orbitAscendingNode = (planet.orbitAscendingNode ?? 0) * RAD_TO_DEG;
    const orbitArgument = (planet.orbitArgument ?? 0) * RAD_TO_DEG;
    const axialTilt = (planet.axialTilt ?? 0) * RAD_TO_DEG;

    return (
        <div className="studio-panel">
            <div className="studio-panel__section">
                <span className="studio-panel__title">3D Orbital Dynamics</span>

                <div className="studio-field">
                    <div className="studio-field__label-row">
                        <label htmlFor="orbit-radius">{isMoon ? "Local Orbit Distance" : "Orbit Radius"}</label>
                        <span className="studio-field__value">{orbitRadius.toFixed(1)} AU</span>
                        <Tooltip text={isMoon ? "Orbital distance from the host planet center in 3D world units." : "Distance from the central star in 3D world units."} />
                    </div>
                    <input
                        id="orbit-radius"
                        type="range"
                        min={minRadius}
                        max={maxRadius}
                        step={isMoon ? 0.05 : 0.2}
                        value={orbitRadius}
                        onChange={(e) => {
                            const val = parseFloat(e.target.value);
                            onChange((prev) => ({ ...prev, orbitRadius: val }));
                        }}
                    />
                </div>

                <div className="studio-field">
                    <div className="studio-field__label-row">
                        <label htmlFor="orbit-speed">Orbital Speed</label>
                        <span className="studio-field__value">{orbitSpeed.toFixed(3)} rad/s</span>
                        <Tooltip text={isMoon ? "Velocity at which the satellite revolves around the host planet." : "Velocity at which the planet revolves along its orbit path."} />
                    </div>
                    <input
                        id="orbit-speed"
                        type="range"
                        min={isMoon ? -2.5 : -0.6}
                        max={isMoon ? 2.5 : 0.6}
                        step={isMoon ? 0.05 : 0.01}
                        value={orbitSpeed}
                        onChange={(e) => {
                            const val = parseFloat(e.target.value);
                            onChange((prev) => ({ ...prev, orbitSpeed: val }));
                        }}
                    />
                </div>

                <div className="studio-field">
                    <div className="studio-field__label-row">
                        <label htmlFor="initial-angle">Starting Phase Angle</label>
                        <span className="studio-field__value">{(initialAngle * RAD_TO_DEG).toFixed(0)} deg</span>
                        <Tooltip text="Initial angular offset along the orbital ellipse at time zero." />
                    </div>
                    <input
                        id="initial-angle"
                        type="range"
                        min="0"
                        max={Math.PI * 2}
                        step="0.05"
                        value={initialAngle}
                        onChange={(e) => {
                            const val = parseFloat(e.target.value);
                            onChange((prev) => ({ ...prev, initialAngle: val }));
                        }}
                    />
                </div>
            </div>

            <div className="studio-panel__section">
                <span className="studio-panel__title">3D Plane Orientation</span>

                <div className="studio-field">
                    <div className="studio-field__label-row">
                        <label htmlFor="orbit-inclination">Plane Inclination (Tilt X)</label>
                        <span className="studio-field__value">{orbitInclination.toFixed(1)} deg</span>
                        <Tooltip text="Vertical tilt angle of the orbital plane relative to the solar ecliptic (X axis)." />
                    </div>
                    <input
                        id="orbit-inclination"
                        type="range"
                        min="-45"
                        max="45"
                        step="0.5"
                        value={orbitInclination}
                        onChange={(e) => {
                            const val = parseFloat(e.target.value) * DEG_TO_RAD;
                            onChange((prev) => ({ ...prev, orbitInclination: val }));
                        }}
                    />
                </div>

                <div className="studio-field">
                    <div className="studio-field__label-row">
                        <label htmlFor="orbit-node">Ascending Node (Rotation Y)</label>
                        <span className="studio-field__value">{orbitAscendingNode.toFixed(1)} deg</span>
                        <Tooltip text="Longitude rotation of the orbit plane around the vertical galactic pole (Y axis)." />
                    </div>
                    <input
                        id="orbit-node"
                        type="range"
                        min="-180"
                        max="180"
                        step="1"
                        value={orbitAscendingNode}
                        onChange={(e) => {
                            const val = parseFloat(e.target.value) * DEG_TO_RAD;
                            onChange((prev) => ({ ...prev, orbitAscendingNode: val }));
                        }}
                    />
                </div>

                <div className="studio-field">
                    <div className="studio-field__label-row">
                        <label htmlFor="orbit-argument">Plane Argument (Roll Z)</label>
                        <span className="studio-field__value">{orbitArgument.toFixed(1)} deg</span>
                        <Tooltip text="In-plane roll angle aligning the periapsis ellipse vector (Z axis)." />
                    </div>
                    <input
                        id="orbit-argument"
                        type="range"
                        min="-45"
                        max="45"
                        step="0.5"
                        value={orbitArgument}
                        onChange={(e) => {
                            const val = parseFloat(e.target.value) * DEG_TO_RAD;
                            onChange((prev) => ({ ...prev, orbitArgument: val }));
                        }}
                    />
                </div>
            </div>

            <div className="studio-panel__section">
                <span className="studio-panel__title">Body Physical Spin</span>

                <div className="studio-field">
                    <div className="studio-field__label-row">
                        <label htmlFor="axial-tilt">Axial Obliquity (Tilt)</label>
                        <span className="studio-field__value">{axialTilt.toFixed(1)} deg</span>
                        <Tooltip text="Angle between the planet's rotational axis and its orbital plane normal." />
                    </div>
                    <input
                        id="axial-tilt"
                        type="range"
                        min="-180"
                        max="180"
                        step="1"
                        value={axialTilt}
                        onChange={(e) => {
                            const val = parseFloat(e.target.value) * DEG_TO_RAD;
                            onChange((prev) => ({ ...prev, axialTilt: val }));
                        }}
                    />
                </div>

                <div className="studio-field">
                    <div className="studio-field__label-row">
                        <label htmlFor="rotation-speed">Day Rotation Speed</label>
                        <span className="studio-field__value">{planet.rotationSpeed.toFixed(2)}</span>
                        <Tooltip text="Self-spinning rotation speed of the planet around its own axis." />
                    </div>
                    <input
                        id="rotation-speed"
                        type="range"
                        min="-1.5"
                        max="1.5"
                        step="0.05"
                        value={planet.rotationSpeed}
                        onChange={(e) => {
                            const val = parseFloat(e.target.value);
                            onChange((prev) => ({ ...prev, rotationSpeed: val }));
                        }}
                    />
                </div>
            </div>
        </div>
    );
}

export default Orbit3DPanel;
