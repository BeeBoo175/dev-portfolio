import { useRef } from "react";
import { useFrame } from "@react-three/fiber";
import { sceneStatus } from "../sceneStatus";

/** Frames in a row without a long stall before start-up counts as over. */
const CALM_FRAMES = 3;
/** A frame slower than this, in seconds, is still part of start-up (building and compiling the scene). */
const STALL = 0.1;

/** Tells the page when the scene has stopped freezing it, so that entrances are actually seen. */
export function SceneSettled() {
    const calm = useRef(0);

    useFrame((_, delta) => {
        if (calm.current > CALM_FRAMES) return;
        calm.current = delta < STALL ? calm.current + 1 : 0;
        if (calm.current > CALM_FRAMES) sceneStatus.settle();
    });

    return null;
}

export default SceneSettled;
