import { Link } from "react-router-dom";
import type { GalaxyVisualSettings } from "../../galaxy";

export interface GalaxyToolbarProps {
    visuals: GalaxyVisualSettings;
    isDirty: boolean;
    warningCount: number;
    onToggleOrbitPaths: () => void;
    onToggleOrbitalAxes: () => void;
    onRandomizeAll: () => void;
    onResolveCollisions: () => void;
    onOpenDataModal: () => void;
    onSaveAndApply: () => void;
    onDiscard: () => void;
}

export function GalaxyToolbar({
    visuals,
    isDirty,
    warningCount,
    onToggleOrbitPaths,
    onToggleOrbitalAxes,
    onRandomizeAll,
    onResolveCollisions,
    onOpenDataModal,
    onSaveAndApply,
    onDiscard,
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
                    >
                        Discard
                    </button>
                )}

                <button
                    type="button"
                    className="studio-btn studio-btn--primary studio-btn--sm"
                    onClick={onSaveAndApply}
                >
                    Save & Apply
                </button>

                <Link
                    to="/"
                    className="studio-btn studio-btn--outline studio-btn--sm"
                >
                    Exit Studio
                </Link>
            </div>
        </header>
    );
}

export default GalaxyToolbar;
