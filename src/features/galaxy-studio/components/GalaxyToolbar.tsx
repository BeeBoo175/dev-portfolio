import type { GalaxyVisualSettings } from "../../galaxy";

export interface GalaxyToolbarProps {
    visuals: GalaxyVisualSettings;
    isDirty: boolean;
    warningCount: number;
    onToggleOrbitPaths: () => void;
    onToggleOrbitalAxes: () => void;
    onRandomizeAll: () => void;
    onResetGalaxy: () => void;
    onResolveCollisions: () => void;
    onOpenDataModal: () => void;
    onSaveAndApply: () => void;
    onDiscard: () => void;
    onExit: () => void;
}

export function GalaxyToolbar({
    visuals,
    isDirty,
    warningCount,
    onToggleOrbitPaths,
    onToggleOrbitalAxes,
    onRandomizeAll,
    onResetGalaxy,
    onResolveCollisions,
    onOpenDataModal,
    onSaveAndApply,
    onDiscard,
    onExit,
}: GalaxyToolbarProps) {
    return (
        <header className="studio-toolbar">
            <div className="studio-toolbar__left">
                <span className="studio-toolbar__brand-text">Galaxy Studio</span>

                {warningCount > 0 && (
                    <button
                        type="button"
                        className="studio-toolbar__warning-btn"
                        onClick={onResolveCollisions}
                        title="Click to automatically space out intersecting orbits"
                    >
                        {warningCount} Collision{warningCount > 1 ? "s" : ""} detected - Auto-Fix
                    </button>
                )}
            </div>

            <div className="studio-toolbar__center">
                <button
                    type="button"
                    className="studio-toolbar__action-btn studio-toolbar__action-btn--glow"
                    onClick={onRandomizeAll}
                >
                    Randomize Galaxy
                </button>

                <button
                    type="button"
                    className="studio-toolbar__action-btn"
                    onClick={onResetGalaxy}
                    title="Reset all planets, star, and asteroid belt to original default configuration"
                >
                    Reset to Defaults
                </button>

                <div className="studio-toolbar__divider" />

                <button
                    type="button"
                    className={`studio-toolbar__toggle-btn ${
                        visuals.showOrbitPaths ? "studio-toolbar__toggle-btn--active" : ""
                    }`}
                    onClick={onToggleOrbitPaths}
                    title="Toggle orbital ellipse trail lines"
                >
                    Orbit Lines
                </button>

                <button
                    type="button"
                    className={`studio-toolbar__toggle-btn ${
                        visuals.showOrbitalAxes ? "studio-toolbar__toggle-btn--active" : ""
                    }`}
                    onClick={onToggleOrbitalAxes}
                    title="Toggle planetary axial tilt lines"
                >
                    Axial Poles
                </button>

                <div className="studio-toolbar__divider" />

                <button
                    type="button"
                    className="studio-toolbar__icon-btn"
                    onClick={onOpenDataModal}
                    title="Import or Export JSON system configurations"
                >
                    <span>Data JSON</span>
                </button>
            </div>

            <div className="studio-toolbar__right">
                {isDirty && (
                    <button
                        type="button"
                        className="studio-btn studio-btn--ghost studio-btn--sm"
                        onClick={onDiscard}
                        title="Discard working changes and revert to your saved galaxy in storage"
                    >
                        Revert to Saved
                    </button>
                )}

                <button
                    type="button"
                    className="studio-btn studio-btn--primary studio-btn--sm"
                    onClick={onSaveAndApply}
                    disabled={!isDirty}
                >
                    Save & Apply
                </button>

                <button
                    type="button"
                    className="studio-btn studio-btn--outline studio-btn--sm"
                    onClick={onExit}
                >
                    Exit Studio
                </button>
            </div>
        </header>
    );
}

export default GalaxyToolbar;
