import type { AsteroidBeltConfig, OrbitConfig, SunConfig } from "../../galaxy";
import { DockedNavigation, type DockedTargetItem } from "../../../components/navigation";

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
    isSidebarOpen?: boolean;
    onToggleSidebar?: () => void;
}

export function TargetSelector({
    targets,
    selectedId,
    onSelectTarget,
    sun,
    planets,
    asteroidBelt,
    defaultPlanetId,
    isSidebarOpen,
    onToggleSidebar,
}: TargetSelectorProps) {
    const getColor = (target: TargetItem) => {
        if (target.id === "home" || target.id === "sun") return sun.color;
        if (target.id === "asteroid-belt") return asteroidBelt?.color || "#9ca3af";
        const planet = planets.find((p) => p.id === target.id);
        return planet?.color || target.color || "#38bdf8";
    };

    const resolvedTargets: DockedTargetItem[] = targets.map((t) => ({
        ...t,
        color: getColor(t),
    }));

    return (
        <DockedNavigation
            targets={resolvedTargets}
            selectedId={selectedId}
            onSelectTarget={onSelectTarget}
            defaultPlanetId={defaultPlanetId}
            isSidebarOpen={isSidebarOpen}
            onToggleSidebar={onToggleSidebar}
            className="studio-target-dock"
        />
    );
}

export default TargetSelector;
