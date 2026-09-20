import { useSyncExternalStore } from "react";

const STORAGE_KEY = "portfolio-motion";

export const prefersReducedMotion = () =>
    typeof window !== "undefined" && !!window.matchMedia?.("(prefers-reduced-motion: reduce)").matches;

function readStored(): boolean | null {
    try {
        const stored = window.localStorage.getItem(STORAGE_KEY);
        return stored === null ? null : stored === "paused";
    } catch {
        return null;
    }
}

// the system setting decides until the visitor presses the button
let paused = readStored() ?? prefersReducedMotion();
const listeners = new Set<() => void>();

const apply = () => document.documentElement.setAttribute("data-motion", paused ? "paused" : "playing");
if (typeof document !== "undefined") apply();

export const motionStore = {
    /** Read inside animation frames; no re-render needed. */
    isPaused: () => paused,
    setPaused(next: boolean) {
        paused = next;
        apply();
        try {
            window.localStorage.setItem(STORAGE_KEY, next ? "paused" : "playing");
        } catch {
            // private modes may refuse storage; the choice still holds for this visit
        }
        listeners.forEach((listener) => listener());
    },
    subscribe(listener: () => void) {
        listeners.add(listener);
        return () => {
            listeners.delete(listener);
        };
    },
};

export const useMotionPaused = () => useSyncExternalStore(motionStore.subscribe, motionStore.isPaused);
