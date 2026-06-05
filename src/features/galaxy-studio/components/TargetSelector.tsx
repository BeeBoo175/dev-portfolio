import type { AsteroidBeltConfig, OrbitConfig, SunConfig } from "../../galaxy";

export interface TargetItem {
    id: string;
    label: string;
    type: "sun" | "planet" | "belt";
    color?: string;
    badge?: string;
}

export interface TargetSelectorProps {
    targets: TargetItem[];
    selectedId: string;
    onSelectTarget: (id: string) => void;
    sun: SunConfig;
    planets: OrbitConfig[];
    asteroidBelt?: AsteroidBeltConfig;
    defaultPlanetId?: string;
}

export function TargetSelector({
    targets,
    selectedId,
    onSelectTarget,
    sun,
    planets,
    asteroidBelt,
    defaultPlanetId,
}: TargetSelectorProps) {
    const getColor = (target: TargetItem) => {
        if (target.id === "home" || target.id === "sun") return sun.color;
        if (target.id === "asteroid-belt") return asteroidBelt?.color || "#9ca3af";
        const planet = planets.find((p) => p.id === target.id);
        return planet?.color || target.color || "#38bdf8";
    };

    return (
        <nav className="studio-target-dock" aria-label="Celestial Body Selector">
            <div className="studio-target-dock__track">
                {targets.map((target) => {
                    const isSelected = selectedId === target.id;
                    const color = getColor(target);
                    const isSpaceshipBase = target.id === defaultPlanetId;

                    return (
                        <button
                            key={target.id}
                            type="button"
                            className={`studio-target-chip ${
                                isSelected ? "studio-target-chip--active" : ""
                            }`}
                            onClick={() => onSelectTarget(target.id)}
                            style={
                                isSelected
                                    ? {
                                          borderColor: color,
                                          boxShadow: `0 0 16px ${color}55`,
                                      }
                                    : undefined
                            }
                        >
                            <span
                                className="studio-target-chip__dot"
                                style={{ backgroundColor: color }}
                            />
                            <span className="studio-target-chip__label">{target.label}</span>
                            {isSpaceshipBase && (
                                <span className="studio-target-chip__badge studio-target-chip__badge--station" title="Spaceship Default Station">
                                    Ship Base
                                </span>
                            )}
                            {target.badge && (
                                <span className="studio-target-chip__badge">{target.badge}</span>
                            )}
                        </button>
                    );
                })}
            </div>
        </nav>
    );
}

export default TargetSelector;
