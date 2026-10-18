import { useRef } from "react";
import { useFrame } from "@react-three/fiber";
import { SAMPLE_SIZE, isTooSlow } from "../utils/renderQuality";

/** Seconds given to loading and shader compiling before frames are judged. */
const WARM_UP = 4;
/** A gap this long is a hidden tab or a one-off stall, not the frame rate. */
const IGNORE_OVER = 0.25;

/** Watches frame times, without limiting them, and says when the machine is not keeping up. */
export function QualityGovernor({ onTooSlow }: { onTooSlow: () => void }) {
    const elapsed = useRef(0);
    const samples = useRef<number[]>([]);

    useFrame((_, delta) => {
        if (delta > IGNORE_OVER) return;
        elapsed.current += delta;
        if (elapsed.current < WARM_UP) return;
        samples.current.push(delta);
        if (samples.current.length < SAMPLE_SIZE) return;
        const slow = isTooSlow(samples.current);
        samples.current = [];
        if (slow) {
            // the new resolution gets its own warm-up
            elapsed.current = 0;
            onTooSlow();
        }
    });

    return null;
}

export default QualityGovernor;
