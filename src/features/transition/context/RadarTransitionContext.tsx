import { useCallback, useRef, useState } from "react";
import { RadarTransitionContext } from "./transitionContext";
import type { RadarStateRefValue, RadarTransitionContextValue } from "../types";

export interface RadarTransitionProviderProps {
    children: React.ReactNode;
    duration?: number;
    maxRadius?: number;
    sweepBandWidth?: number;
}

export function RadarTransitionProvider({
    children,
    duration = 0.8,
    maxRadius = 44.0,
    sweepBandWidth = 3.5,
}: RadarTransitionProviderProps) {
    const [isRadarComplete, setIsRadarComplete] = useState(false);

    const radarStateRef = useRef<RadarStateRefValue>({
        currentRadius: 0,
        isComplete: false,
        duration,
        maxRadius,
        sweepBandWidth,
    });

    const triggerSweep = useCallback(() => {
        radarStateRef.current.currentRadius = 0;
        radarStateRef.current.isComplete = false;
        setIsRadarComplete(false);
    }, []);

    const notifyComplete = useCallback(() => {
        radarStateRef.current.isComplete = true;
        radarStateRef.current.currentRadius = radarStateRef.current.maxRadius;
        setIsRadarComplete(true);
    }, []);

    const contextValue: RadarTransitionContextValue = {
        isRadarComplete,
        radarStateRef,
        triggerSweep,
        notifyComplete,
    };

    return (
        <RadarTransitionContext.Provider value={contextValue}>
            {children}
        </RadarTransitionContext.Provider>
    );
}
