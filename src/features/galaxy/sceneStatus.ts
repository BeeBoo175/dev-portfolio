import { useSyncExternalStore } from "react";
import { supportsWebGL } from "../../components/system/supportsWebGL";

export type SceneStatus = "ready" | "unsupported" | "failed";

let status: SceneStatus | undefined;
let settled = false;
const listeners = new Set<() => void>();

export const sceneStatus = {
    get(): SceneStatus {
        return (status ??= supportsWebGL() ? "ready" : "unsupported");
    },
    /** True once the first screen is calm: there is no scene to wait for, or it is drawing smoothly. */
    isSettled(): boolean {
        return settled || sceneStatus.get() !== "ready";
    },
    settle() {
        if (settled) return;
        settled = true;
        listeners.forEach((listener) => listener());
    },
    /** The scene was meant to run but didn't load or crashed. */
    fail() {
        status = "failed";
        listeners.forEach((listener) => listener());
    },
    subscribe(listener: () => void) {
        listeners.add(listener);
        return () => {
            listeners.delete(listener);
        };
    },
};

export const useSceneStatus = () => useSyncExternalStore(sceneStatus.subscribe, sceneStatus.get);

export const useSceneSettled = () => useSyncExternalStore(sceneStatus.subscribe, sceneStatus.isSettled);

export const SCENE_REASONS: Record<Exclude<SceneStatus, "ready">, string> = {
    unsupported: "The 3D galaxy needs WebGL 2, which this browser isn’t offering.",
    failed: "The 3D galaxy didn’t load. Reload the page to try again.",
};
