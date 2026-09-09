import type { OrbitConfig } from "../../galaxy";

export interface StudioSidebarHeaderProps {
    selectedId: string;
    targetLabel: string;
    currentPlanet: OrbitConfig | null | undefined;
    draftDefaultPlanetId: string;
    onResetSun: () => void;
    onResetBelt: () => void;
    onResetCurrentPlanet: (label: string) => void;
    onSetDefaultPlanetId: (id: string, label: string) => void;
}

export function StudioSidebarHeader({
    selectedId,
    targetLabel,
    currentPlanet,
    draftDefaultPlanetId,
    onResetSun,
    onResetBelt,
    onResetCurrentPlanet,
    onSetDefaultPlanetId,
}: StudioSidebarHeaderProps) {
    return (
        <div className="studio-sidebar__header">
            <div className="studio-sidebar__header-info">
                <span className="studio-sidebar__target-type">
                    {selectedId === "home" || selectedId === "sun"
                        ? "Star"
                        : selectedId === "asteroid-belt"
                            ? "Debris Belt"
                            : "Planet"}
                </span>
                <h2 className="studio-sidebar__target-name">
                    {targetLabel}
                </h2>
            </div>

            <div className="studio-sidebar__header-actions">
                {(selectedId === "home" || selectedId === "sun") && (
                    <button
                        type="button"
                        className="studio-btn studio-btn--ghost studio-btn--sm"
                        onClick={onResetSun}
                        title="Reset star to original default configuration"
                    >
                        Reset
                    </button>
                )}
                {selectedId === "asteroid-belt" && (
                    <button
                        type="button"
                        className="studio-btn studio-btn--ghost studio-btn--sm"
                        onClick={onResetBelt}
                        title="Reset asteroid belt to original default configuration"
                    >
                        Reset
                    </button>
                )}
                {currentPlanet && (
                    <>
                        <button
                            type="button"
                            className={`studio-btn studio-btn--sm ${draftDefaultPlanetId === currentPlanet.id
                                    ? "studio-btn--station-active"
                                    : "studio-btn--ghost"
                                }`}
                            onClick={() => onSetDefaultPlanetId(currentPlanet.id, targetLabel)}
                            title={
                                draftDefaultPlanetId === currentPlanet.id
                                    ? "Current default starting base for spaceship"
                                    : "Set this planet as spaceship default starting base"
                            }
                            aria-pressed={draftDefaultPlanetId === currentPlanet.id}
                        >
                            {draftDefaultPlanetId === currentPlanet.id ? "Ship Base" : "Set Ship Base"}
                        </button>
                        <button
                            type="button"
                            className="studio-btn studio-btn--ghost studio-btn--sm"
                            onClick={() => onResetCurrentPlanet(targetLabel)}
                            title="Reset this planet to original default configuration"
                        >
                            Reset
                        </button>
                    </>
                )}
            </div>
        </div>
    );
}

export default StudioSidebarHeader;
