import { PauseIcon, PlayIcon } from "../../components/ui/Icons";
import { motionStore, useMotionPaused } from "./store";

export function MotionToggle({ className = "" }: { className?: string }) {
    const paused = useMotionPaused();
    const label = paused ? "Play background motion" : "Pause background motion";

    return (
        <button
            type="button"
            className={className}
            onClick={() => motionStore.setPaused(!paused)}
            aria-label={label}
            title={label}
        >
            {paused ? <PlayIcon /> : <PauseIcon />}
        </button>
    );
}

export default MotionToggle;
