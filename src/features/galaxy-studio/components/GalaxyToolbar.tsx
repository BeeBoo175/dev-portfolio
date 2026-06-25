import type { GalaxyVisualSettings } from "../../galaxy";

export interface GalaxyToolbarProps {
    visuals: GalaxyVisualSettings;
    isDirty: boolean;
    warningCount: number;
    canUndo?: boolean;
    canRedo?: boolean;
    onUndo?: () => void;
    onRedo?: () => void;
    isCameraOrbitPaused?: boolean;
    onTogglePauseCameraOrbit?: () => void;
    onToggleOrbitPaths: () => void;
    onToggleOrbitalAxes: () => void;
    onToggleSelectionGlow?: () => void;
    onTogglePlanetNames?: () => void;
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
    canUndo = false,
    canRedo = false,
    onUndo,
    onRedo,
    isCameraOrbitPaused,
    onTogglePauseCameraOrbit,
    onToggleOrbitPaths,
    onToggleOrbitalAxes,
    onToggleSelectionGlow,
    onTogglePlanetNames,
    onRandomizeAll,
    onResetGalaxy,
    onResolveCollisions,
    onOpenDataModal,
    onSaveAndApply,
    onDiscard,
    onExit,
}: GalaxyToolbarProps) {
    const isSelectionGlowActive = visuals.showSelectionGlow !== false;
    const isPlanetNamesActive = visuals.showPlanetNames !== false;

    return (
        <header className="studio-toolbar">
            <div className="studio-toolbar__left">
                <span className="studio-toolbar__brand-text">Galaxy Studio</span>

                <div className="studio-toolbar__history-group">
                    <button
                        type="button"
                        className="studio-btn studio-btn--secondary studio-btn--sm"
                        onClick={onUndo}
                        disabled={!canUndo}
                        title="Undo change (Ctrl+Z)"
                        aria-label="Undo change"
                    >
                        Undo
                    </button>
                    <button
                        type="button"
                        className="studio-btn studio-btn--secondary studio-btn--sm"
                        onClick={onRedo}
                        disabled={!canRedo}
                        title="Redo change (Ctrl+Y or Ctrl+Shift+Z)"
                        aria-label="Redo change"
                    >
                        Redo
                    </button>
                </div>

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
                <div className="studio-toolbar__group">
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
                </div>

                <div className="studio-toolbar__divider" />

                <div className="studio-toolbar__group studio-toolbar__group--toggles">
                    <button
                        type="button"
                        className={`studio-toolbar__toggle-btn ${visuals.showOrbitPaths ? "studio-toolbar__toggle-btn--active" : ""
                            }`}
                        onClick={onToggleOrbitPaths}
                        title="Toggle orbital ellipse trail lines"
                    >
                        Orbit Lines
                    </button>

                    <button
                        type="button"
                        className={`studio-toolbar__toggle-btn ${visuals.showOrbitalAxes ? "studio-toolbar__toggle-btn--active" : ""
                            }`}
                        onClick={onToggleOrbitalAxes}
                        title="Toggle planetary axial tilt lines"
                    >
                        Axial Poles
                    </button>

                    <button
                        type="button"
                        className={`studio-toolbar__toggle-btn ${isSelectionGlowActive ? "studio-toolbar__toggle-btn--active" : ""
                            }`}
                        onClick={onToggleSelectionGlow}
                        title="Toggle selection glow brackets and reticles"
                    >
                        Selection Glow
                    </button>

                    <button
                        type="button"
                        className={`studio-toolbar__toggle-btn ${isPlanetNamesActive ? "studio-toolbar__toggle-btn--active" : ""
                            }`}
                        onClick={onTogglePlanetNames}
                        title="Toggle celestial body name labels"
                    >
                        Names
                    </button>

                    <button
                        type="button"
                        className={`studio-toolbar__toggle-btn ${isCameraOrbitPaused ? "studio-toolbar__toggle-btn--active" : ""
                            }`}
                        onClick={onTogglePauseCameraOrbit}
                        title="Freeze camera orbit in editor only to observe planetary motion (editor preview only, not saved)"
                    >
                        Freeze Cam
                    </button>
                </div>

                <div className="studio-toolbar__divider" />

                <div className="studio-toolbar__group">
                    <button
                        type="button"
                        className="studio-toolbar__icon-btn"
                        onClick={onOpenDataModal}
                        title="Import or Export JSON system configurations"
                    >
                        <span>Data JSON</span>
                    </button>
                </div>
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
