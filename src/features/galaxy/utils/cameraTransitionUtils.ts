export interface CameraTransitionCheckParams {
    focusId: string;
    lastFocusId: string | null;
    isExitingEditor: boolean;
    isTransitioning: boolean;
    userThetaOffset: number;
    userPhiOffset: number;
    userZoomOffset: number;
}

export interface CameraTransitionDecision {
    shouldTransition: boolean;
    isInitial: boolean;
    isFocusChanged: boolean;
}

export function shouldTriggerCameraTransition(
    params: CameraTransitionCheckParams
): CameraTransitionDecision {
    const isInitial = params.lastFocusId === null;
    const isFocusChanged = params.focusId !== params.lastFocusId;
    const hasManualOffset =
        Math.abs(params.userThetaOffset) > 0.001 ||
        Math.abs(params.userPhiOffset) > 0.001 ||
        Math.abs(params.userZoomOffset) > 0.01;
    const shouldTransitionOnExit =
        params.isExitingEditor && (hasManualOffset || params.isTransitioning);

    return {
        shouldTransition: isFocusChanged || shouldTransitionOnExit,
        isInitial,
        isFocusChanged,
    };
}
