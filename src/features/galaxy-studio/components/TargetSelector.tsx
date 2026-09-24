import { DockedNavigation, type DockedTargetItem } from "../../../components/navigation";

export interface TargetItem {
    id: string;
    label: string;
    type: "sun" | "planet" | "belt";
    badge?: string;
}

export interface TargetSelectorProps {
    targets: TargetItem[];
    selectedId: string;
    onSelectTarget: (id: string) => void;
    defaultPlanetId?: string;
    ref?: React.Ref<HTMLElement>;
}

export function TargetSelector({
    targets,
    selectedId,
    onSelectTarget,
    defaultPlanetId,
    ref,
}: TargetSelectorProps) {
    const resolvedTargets: DockedTargetItem[] = targets;

    return (
        <DockedNavigation
            ref={ref}
            targets={resolvedTargets}
            selectedId={selectedId}
            onSelectTarget={onSelectTarget}
            defaultPlanetId={defaultPlanetId}
            className="studio-target-dock"
        />
    );
}

export default TargetSelector;
