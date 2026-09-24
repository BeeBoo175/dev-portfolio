import { getBodyNumeral, type OrbitConfig } from "../../galaxy";
import { CloseIcon, ResetIcon, ShipIcon } from "../../../components/ui/Icons";

export interface StudioSidebarHeaderProps {
    selectedId: string;
    targetLabel: string;
    currentPlanet: OrbitConfig | null | undefined;
    draftDefaultPlanetId: string;
    onResetSun: () => void;
    onResetBelt: () => void;
    onResetCurrentPlanet: (label: string) => void;
    onSetDefaultPlanetId: (id: string, label: string) => void;
    onClose: () => void;
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
    onClose,
}: StudioSidebarHeaderProps) {
    const isStar = selectedId === "home" || selectedId === "sun";
    const isBelt = selectedId === "asteroid-belt";
    const targetType = isStar ? "Star" : isBelt ? "Debris Belt" : "Planet";
    const numeral = getBodyNumeral(currentPlanet?.id ?? selectedId);
    const isShipBase = Boolean(currentPlanet && draftDefaultPlanetId === currentPlanet.id);

    const handleReset = () => {
        if (isStar) onResetSun();
        else if (isBelt) onResetBelt();
        else onResetCurrentPlanet(targetLabel);
    };

    return (
        <div className="studio-sidebar__header">
            <div className="studio-sidebar__header-info">
                <h2 className="studio-sidebar__target-name">{targetLabel}</h2>
                <span className="studio-sidebar__target-type">
                    {[numeral, targetType].filter(Boolean).join(" \u00b7 ")}
                </span>
            </div>

            <div className="studio-sidebar__header-actions">
                {currentPlanet && (
                    <button
                        type="button"
                        className={`studio-btn studio-btn--outline ${isShipBase ? "studio-btn--station-active" : ""}`}
                        onClick={() => onSetDefaultPlanetId(currentPlanet.id, targetLabel)}
                        title={
                            isShipBase
                                ? "Current default starting base for spaceship"
                                : "Set this planet as spaceship default starting base"
                        }
                        aria-pressed={isShipBase}
                    >
                        <ShipIcon />
                        {isShipBase ? "Ship Base" : "Set Base"}
                    </button>
                )}
                <button
                    type="button"
                    className="studio-btn studio-btn--ghost studio-btn--icon"
                    onClick={handleReset}
                    title={`Reset ${targetLabel} to original default configuration`}
                    aria-label={`Reset ${targetLabel}`}
                >
                    <ResetIcon />
                </button>
                <button
                    type="button"
                    className="studio-btn studio-btn--ghost studio-btn--icon"
                    onClick={onClose}
                    title="Close inspector"
                    aria-label="Close inspector"
                >
                    <CloseIcon />
                </button>
            </div>
        </div>
    );
}

export default StudioSidebarHeader;
