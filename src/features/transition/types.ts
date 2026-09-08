export interface RadarSweepConfig {
    duration: number;
    maxRadius: number;
    sweepBandWidth: number;
}

export interface RadarStateRefValue {
    currentRadius: number;
    isComplete: boolean;
    duration: number;
    maxRadius: number;
    sweepBandWidth: number;
}

export interface RadarTransitionContextValue {
    isRadarComplete: boolean;
    radarStateRef: React.RefObject<RadarStateRefValue>;
    triggerSweep: () => void;
    notifyComplete: () => void;
}
