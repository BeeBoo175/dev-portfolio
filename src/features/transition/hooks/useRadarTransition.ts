import { useContext, useRef } from "react";
import { RadarTransitionContext } from "../context/transitionContextDef";
import type { RadarStateRefValue, RadarTransitionContextValue } from "../types";

const DEFAULT_RADAR_STATE: RadarStateRefValue = {
    currentRadius: 32,
    isComplete: true,
    duration: 0.65,
    maxRadius: 32,
    sweepBandWidth: 3.5,
};

export function useRadarTransition(): RadarTransitionContextValue {
    const fallbackRef = useRef<RadarStateRefValue>(DEFAULT_RADAR_STATE);
    const context = useContext(RadarTransitionContext);

    if (!context) {
        return {
            isRadarComplete: true,
            radarStateRef: fallbackRef,
            triggerSweep: () => {},
            notifyComplete: () => {},
        };
    }

    return context;
}
