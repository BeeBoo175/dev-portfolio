import { describe, expect, it, vi } from "vitest";
import { motionStore } from "./store";

describe("motionStore", () => {
    it("reports a change to the page and to subscribers", () => {
        const listener = vi.fn();
        const unsubscribe = motionStore.subscribe(listener);
        motionStore.setPaused(true);
        expect(motionStore.isPaused()).toBe(true);
        expect(document.documentElement.dataset.motion).toBe("paused");
        unsubscribe();
        motionStore.setPaused(false);
        expect(listener).toHaveBeenCalledTimes(1);
    });
});
