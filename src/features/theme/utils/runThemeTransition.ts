import { flushSync } from "react-dom";

export interface RevealOrigin {
    x: number;
    y: number;
}

const REVEAL_MS = 280;

let isRunning = false;

/**
 * The incoming theme grows as a circle out of the switch. Inside the circle is the live page, so the
 * planets keep moving there; outside it is a still of the old theme until the circle passes.
 */
export async function runThemeTransition(apply: () => void, origin: RevealOrigin): Promise<void> {
    if (isRunning) return;
    const prefersReducedMotion = window.matchMedia?.("(prefers-reduced-motion: reduce)").matches;
    if (prefersReducedMotion || typeof document.startViewTransition !== "function") {
        apply();
        return;
    }

    isRunning = true;
    try {
        const transition = document.startViewTransition(() => flushSync(apply));
        await transition.ready;
        const { x, y } = origin;
        const radius = Math.hypot(Math.max(x, window.innerWidth - x), Math.max(y, window.innerHeight - y));
        document.documentElement.animate(
            { clipPath: [`circle(0px at ${x}px ${y}px)`, `circle(${radius}px at ${x}px ${y}px)`] },
            { duration: REVEAL_MS, easing: "cubic-bezier(0.25, 1, 0.5, 1)", pseudoElement: "::view-transition-new(root)" }
        );
        await transition.finished;
    } catch {
        // a skipped transition (hidden tab, for one) still runs the callback, so the theme is applied
    } finally {
        isRunning = false;
    }
}
