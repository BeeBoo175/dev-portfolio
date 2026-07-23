import { useState } from "react";
import type { GalaxyVisualSettings } from "../../galaxy";

export interface GalaxyToolbarProps {
    visuals: GalaxyVisualSettings;
    isDirty: boolean;
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
    onOpenDataModal: () => void;
    onSaveAndApply: () => void;
    onDiscard: () => void;
    onExit: () => void;
}

export function GalaxyToolbar({
    visuals = {
        showOrbitPaths: true,
        showOrbitalAxes: false,
        showSelectionGlow: true,
        showPlanetNames: true,
        freezeCameraOrbit: false,
    },
    isDirty,
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
    onOpenDataModal,
    onSaveAndApply,
    onDiscard,
    onExit,
}: GalaxyToolbarProps) {
    const [isMobileToolsOpen, setIsMobileToolsOpen] = useState(false);
    const isSelectionGlowActive = visuals?.showSelectionGlow !== false;
    const isPlanetNamesActive = visuals?.showPlanetNames !== false;

    return (
        <header className={`studio-toolbar ${isMobileToolsOpen ? "studio-toolbar--mobile-open" : ""}`}>
            <div className="studio-toolbar__brand-row">
                <span className="studio-toolbar__brand-text">Galaxy Studio</span>

                <div className="studio-toolbar__brand-actions">
                    {isDirty && (
                        <button
                            type="button"
                            className="studio-btn studio-btn--ghost studio-btn--sm studio-toolbar__revert-btn--mobile"
                            onClick={onDiscard}
                            title="Discard working changes and revert to your saved galaxy in storage"
                        >
                            Revert
                        </button>
                    )}
                </div>
            </div>

            <div className="studio-toolbar__controls-row">
                <div className="studio-toolbar__primary-actions">
                    <button
                        type="button"
                        className={`studio-toolbar__mobile-toggle-btn ${isMobileToolsOpen ? "studio-toolbar__mobile-toggle-btn--active" : ""}`}
                        onClick={(e) => {
                            setIsMobileToolsOpen(!isMobileToolsOpen);
                            e.currentTarget.blur();
                        }}
                        aria-expanded={isMobileToolsOpen}
                        aria-controls="studio-toolbar-tools-panel"
                        aria-label="Toggle studio tools ribbon"
                        title={isMobileToolsOpen ? "Hide Tools Menu" : "Show Tools Menu"}
                    >
                        {isMobileToolsOpen ? "Hide Tools" : "Tools"}
                    </button>

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
                </div>

                <div className="studio-toolbar__right">
                    {isDirty && (
                        <button
                            type="button"
                            className="studio-btn studio-btn--ghost studio-btn--sm studio-toolbar__revert-btn--desktop"
                            onClick={onDiscard}
                            title="Discard working changes and revert to your saved galaxy in storage"
                        >
                            Revert
                        </button>
                    )}

                    <button
                        type="button"
                        className="studio-btn studio-btn--primary studio-btn--sm"
                        onClick={onSaveAndApply}
                        disabled={!isDirty}
                        title="Save & apply changes to galaxy"
                    >
                        <span className="studio-btn__label--desktop">Save & Apply</span>
                        <span className="studio-btn__label--mobile">Save</span>
                    </button>

                    <button
                        type="button"
                        className="studio-btn studio-btn--outline studio-btn--sm"
                        onClick={onExit}
                    >
                        <span className="studio-btn__label--desktop">Exit Studio</span>
                        <span className="studio-btn__label--mobile">Exit</span>
                    </button>
                </div>
            </div>

            <div
                id="studio-toolbar-tools-panel"
                className={`studio-toolbar__center ${isMobileToolsOpen ? "studio-toolbar__center--visible" : ""}`}
            >
                <div className="studio-toolbar__group">
                    <button
                        type="button"
                        className="studio-toolbar__action-btn"
                        onClick={onRandomizeAll}
                        title="Generate random planet sizes, colors, and orbit parameters"
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
        </header>
    );
}

export default GalaxyToolbar;
