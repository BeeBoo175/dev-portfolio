import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { act, useRef } from "react";
import { createRoot } from "react-dom/client";
import { LONGEST_WAIT_MS, useFirstAppearance } from "./useFirstAppearance";
import { motionStore } from "../motion/store";

(globalThis as { IS_REACT_ACT_ENVIRONMENT?: boolean }).IS_REACT_ACT_ENVIRONMENT = true;

function Probe({ isReady }: { isReady: boolean }) {
    const ref = useRef<HTMLDivElement>(null);
    return <div ref={ref}>{useFirstAppearance(ref, isReady)}</div>;
}

describe("useFirstAppearance", () => {
    const host = document.createElement("div");
    const show = (root: ReturnType<typeof createRoot>, isReady: boolean) => act(() => root.render(<Probe isReady={isReady} />));

    beforeEach(() => {
        vi.useFakeTimers();
        // on screen as soon as it is watched
        vi.stubGlobal(
            "IntersectionObserver",
            class {
                callback: (entries: { isIntersecting: boolean }[]) => void;
                constructor(callback: (entries: { isIntersecting: boolean }[]) => void) {
                    this.callback = callback;
                }
                observe() {
                    this.callback([{ isIntersecting: true }]);
                }
                disconnect() {}
            }
        );
    });

    afterEach(() => {
        vi.useRealTimers();
        vi.unstubAllGlobals();
        motionStore.setPaused(false);
    });

    it("holds the entrance until the page is ready for it", () => {
        const root = createRoot(host);
        show(root, false);
        expect(host.textContent).toBe("waiting");
        show(root, true);
        expect(host.textContent).toBe("entering");
        act(() => root.unmount());
    });

    it("does not wait for ever", () => {
        const root = createRoot(host);
        show(root, false);
        act(() => vi.advanceTimersByTime(LONGEST_WAIT_MS));
        expect(host.textContent).toBe("entering");
        act(() => root.unmount());
    });

    it("plays even with background motion paused, and again on the next visit", () => {
        motionStore.setPaused(true);
        for (let visit = 0; visit < 2; visit++) {
            const root = createRoot(host);
            show(root, true);
            expect(host.textContent).toBe("entering");
            act(() => root.unmount());
        }
    });

    it("is skipped for visitors who ask for reduced motion", () => {
        vi.stubGlobal("matchMedia", () => ({ matches: true }));
        const root = createRoot(host);
        show(root, true);
        expect(host.textContent).toBe("shown");
        act(() => root.unmount());
    });
});
