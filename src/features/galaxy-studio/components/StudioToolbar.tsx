import { useEffect, useState } from "react";
import type { GalaxyVisualSettings } from "../../galaxy";
import { RedoIcon, ResetIcon, TuneIcon, UndoIcon } from "../../../components/ui/Icons";

export interface StudioToolbarProps {
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
    onToggleBackgroundPhenomena?: () => void;
    onRandomizeAll: () => void;
    onResetGalaxy: () => void;
    onOpenDataModal: () => void;
    onSaveAndApply: () => void;
    onDiscard: () => void;
    onExit: () => void;
}

export type GalaxyToolbarProps = StudioToolbarProps;

export function StudioToolbar({
    visuals = {
        showOrbitPaths: false,
        showOrbitalAxes: false,
        showSelectionGlow: true,
        showPlanetNames: true,
        freezeCameraOrbit: true,
        showBackgroundPhenomena: true,
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
    onToggleBackgroundPhenomena,
    onRandomizeAll,
    onResetGalaxy,
    onOpenDataModal,
    onSaveAndApply,
    onDiscard,
    onExit,
}: GalaxyToolbarProps) {
    const [isMobileToolsOpen, setIsMobileToolsOpen] = useState(false);
    useEffect(() => {
        document.body.dataset.studioTools = isMobileToolsOpen ? "open" : "closed";
        return () => {
            delete document.body.dataset.studioTools;
        };
    }, [isMobileToolsOpen]);

    const isSelectionGlowActive = visuals?.showSelectionGlow !== false;
    const isPlanetNamesActive = visuals?.showPlanetNames !== false;
    const isBackgroundPhenomenaActive = visuals?.showBackgroundPhenomena !== false;

    return (
        <header className={`studio-toolbar ${isMobileToolsOpen ? "studio-toolbar--mobile-open" : ""}`}>
            <div className="studio-toolbar__brand-row">
                <h1 className="studio-toolbar__brand-text">Galaxy Studio</h1>
            </div>

            <div className="studio-toolbar__primary-actions">
                <button
                    type="button"
                    className={`studio-btn studio-btn--outline studio-btn--icon studio-toolbar__mobile-toggle-btn ${isMobileToolsOpen ? "studio-toolbar__mobile-toggle-btn--active" : ""}`}
                    onClick={() => setIsMobileToolsOpen(!isMobileToolsOpen)}
                    aria-expanded={isMobileToolsOpen}
                    aria-controls="studio-toolbar-tools-panel"
                    aria-label="Toggle studio tools ribbon"
                    title={isMobileToolsOpen ? "Hide Tools Menu" : "Show Tools Menu"}
                >
                    <TuneIcon />
                </button>

                <div className="studio-toolbar__history-group">
                    <button
                        type="button"
                        className="studio-btn studio-btn--ghost studio-btn--icon"
                        onClick={onUndo}
                        disabled={!canUndo}
                        title="Undo change (Ctrl+Z)"
                        aria-label="Undo change"
                    >
                        <UndoIcon />
                        <span className="sr-only">Undo</span>
                    </button>
                    <button
                        type="button"
                        className="studio-btn studio-btn--ghost studio-btn--icon"
                        onClick={onRedo}
                        disabled={!canRedo}
                        title="Redo change (Ctrl+Y or Ctrl+Shift+Z)"
                        aria-label="Redo change"
                    >
                        <RedoIcon />
                        <span className="sr-only">Redo</span>
                    </button>
                </div>
            </div>

            <div className="studio-toolbar__right">
                {isDirty && (
                    <button
                        type="button"
                        className="studio-btn studio-btn--ghost studio-toolbar__revert-btn"
                        onClick={onDiscard}
                        title="Discard working changes and revert to your saved galaxy in storage"
                        aria-label="Revert changes"
                    >
                        <ResetIcon />
                        <span className="studio-toolbar__revert-text">Revert</span>
                    </button>
                )}
                <button type="button" className="studio-btn studio-btn--ghost" onClick={onExit}>
                    <span className="studio-btn__label--desktop">Exit Studio</span>
                    <span className="studio-btn__label--mobile">Exit</span>
                </button>
                <button
                    type="button"
                    className="studio-btn studio-btn--primary"
                    onClick={onSaveAndApply}
                    disabled={!isDirty}
                    title="Save & apply changes to galaxy"
                >
                    <span className="studio-btn__label--desktop">Save & Apply</span>
                    <span className="studio-btn__label--mobile">Save</span>
                </button>
            </div>

            <div
                id="studio-toolbar-tools-panel"
                className={`studio-toolbar__center ${isMobileToolsOpen ? "studio-toolbar__center--visible" : ""}`}
            >
                <div className="studio-toolbar__group">
                    <span className="studio-toolbar__caption">Galaxy</span>
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

                <div
                    className="studio-toolbar__group studio-toolbar__group--toggles"
                    role="toolbar"
                    aria-label="Visual Display Toggles"
                >
                    <span className="studio-toolbar__caption">View options</span>
                        <button
                            type="button"
                            className={`studio-toolbar__toggle-btn ${visuals.showOrbitPaths ? "studio-toolbar__toggle-btn--active" : ""}`}
                            onClick={onToggleOrbitPaths}
                            aria-pressed={visuals.showOrbitPaths}
                            title="Toggle orbital ellipse trail lines"
                        >
                            Orbit Lines
                        </button>
                        <button
                            type="button"
                            className={`studio-toolbar__toggle-btn ${visuals.showOrbitalAxes ? "studio-toolbar__toggle-btn--active" : ""}`}
                            onClick={onToggleOrbitalAxes}
                            aria-pressed={visuals.showOrbitalAxes}
                            title="Toggle planetary axial tilt lines"
                        >
                            Axial Poles
                        </button>
                        <button
                            type="button"
                            className={`studio-toolbar__toggle-btn ${isSelectionGlowActive ? "studio-toolbar__toggle-btn--active" : ""}`}
                            onClick={onToggleSelectionGlow}
                            aria-pressed={isSelectionGlowActive}
                            title="Toggle the selection reticle around the focused body"
                        >
                            Selection Glow
                        </button>
                        <button
                            type="button"
                            className={`studio-toolbar__toggle-btn ${isPlanetNamesActive ? "studio-toolbar__toggle-btn--active" : ""}`}
                            onClick={onTogglePlanetNames}
                            aria-pressed={isPlanetNamesActive}
                            title="Toggle celestial body name labels"
                        >
                            Names
                        </button>
                        <button
                            type="button"
                            className={`studio-toolbar__toggle-btn ${isBackgroundPhenomenaActive ? "studio-toolbar__toggle-btn--active" : ""}`}
                            onClick={onToggleBackgroundPhenomena}
                            aria-pressed={isBackgroundPhenomenaActive}
                            title="Toggle starfield, nebulae, and shooting stars in the background"
                        >
                            Cosmic BG
                        </button>
                        <button
                            type="button"
                            className={`studio-toolbar__toggle-btn ${isCameraOrbitPaused ? "studio-toolbar__toggle-btn--active" : ""}`}
                            onClick={onTogglePauseCameraOrbit}
                            aria-pressed={Boolean(isCameraOrbitPaused)}
                            title="Freeze camera orbit in editor only to observe planetary motion (editor preview only, not saved)"
                        >
                            Freeze Cam
                        </button>
                </div>

                <div className="studio-toolbar__group">
                    <span className="studio-toolbar__caption">Data</span>
                    <button
                        type="button"
                        className="studio-toolbar__action-btn"
                        onClick={onOpenDataModal}
                        title="Import or Export JSON system configurations"
                    >
                        Data JSON
                    </button>
                </div>
            </div>
        </header>
    );
}

export const GalaxyToolbar = StudioToolbar;
export default StudioToolbar;
