export interface ViewShiftInput {
    width: number;
    height: number;
    isEditorMode: boolean;
    isHome: boolean;
    isInspectorOpen: boolean;
}

/** Fractions of the viewport: positive x moves the scene right, positive y moves it up. */
export interface ViewShift {
    x: number;
    y: number;
}

/** Keeps the subject clear of the plate on the portfolio and of the inspector in the Studio. */
export function getViewShift({ width, height, isEditorMode, isHome, isInspectorOpen }: ViewShiftInput): ViewShift {
    if (width > 960) {
        if (!isEditorMode) return { x: isHome ? 0.13 : 0.14, y: 0 };
        const inspectorWidth = Math.min(392, Math.max(336, width * 0.29));
        return { x: isInspectorOpen ? -inspectorWidth / 2 / width : 0, y: -0.04 };
    }

    if (height <= 500 && width > height) {
        if (!isEditorMode) return { x: 0.2, y: 0 };
        return { x: isInspectorOpen ? -0.2 : 0, y: 0 };
    }

    // plates and their backdrop take the lower two thirds, so the subject goes well into the top one
    if (!isEditorMode) return { x: 0, y: isHome ? 0.27 : 0.31 };
    return { x: 0, y: isInspectorOpen ? 0.18 : 0 };
}

/**
 * Angle that swings a planet view off the sun line so the radius reads on screen.
 * Inner planets swing further, or the sun would sit directly behind them.
 */
export function getPlanetViewAzimuth(orbitRadius: number): number {
    return Math.min(1.25, Math.max(0.62, 0.62 + (16 - orbitRadius) * 0.07));
}

/** Tall screens crop the sides, so planet views step back to keep rings in frame. */
export function getPortraitScale(width: number, height: number): number {
    return width < height ? Math.min(1.5, Math.sqrt(height / width)) : 1;
}
