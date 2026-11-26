import { useRef } from "react";
import { useFrame } from "@react-three/fiber";
import { SAMPLE_SIZE, typicalFrame } from "../utils/renderQuality";

/** Seconds given to loading and shader compiling before frames are judged. */
const WARM_UP = 4;
/** A gap this long is a hidden tab or a one-off stall, not the frame rate. */
const IGNORE_OVER = 0.25;

/** Watches frame times, without limiting them, and reports the typical one for each batch. */
export function QualityGovernor({ onSample }: { onSample: (typical: number) => boolean }) {
    const elapsed = useRef(0);
    const samples = useRef<number[]>([]);

    useFrame((_, delta) => {
        if (delta > IGNORE_OVER) return;
        elapsed.current += delta;
        if (elapsed.current < WARM_UP) return;
        samples.current.push(delta);
        if (samples.current.length < SAMPLE_SIZE) return;
        const changed = onSample(typicalFrame(samples.current));
        samples.current = [];
        // a new resolution gets its own warm-up
        if (changed) elapsed.current = 0;
    });

    return null;
}

export default QualityGovernor;
