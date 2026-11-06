import { useEffect, useState, type RefObject } from "react";
import { prefersReducedMotion } from "../motion/store";

export type Appearance = "waiting" | "entering" | "shown";

/** Longest an entrance is held back for a page that never gets calm, such as a very slow machine. */
export const LONGEST_WAIT_MS = 2500;

/**
 * "entering" once the element is on screen and the page is ready to animate smoothly. It runs each
 * time the element is mounted. The pause button doesn't skip it: that stills the endless background
 * motion, while this is a two-second entrance. The system's reduced-motion setting does skip it.
 */
export function useFirstAppearance(ref: RefObject<Element | null>, isReady: boolean): Appearance {
    const [appearance, setAppearance] = useState<Appearance>(() =>
        prefersReducedMotion() || typeof IntersectionObserver === "undefined" ? "shown" : "waiting"
    );
    const [waitedTooLong, setWaitedTooLong] = useState(false);
    const canStart = isReady || waitedTooLong;

    useEffect(() => {
        const limit = setTimeout(() => setWaitedTooLong(true), LONGEST_WAIT_MS);
        return () => clearTimeout(limit);
    }, []);

    useEffect(() => {
        if (appearance !== "waiting" || !canStart || !ref.current) return;
        const observer = new IntersectionObserver(
            (entries) => {
                if (entries.some((entry) => entry.isIntersecting)) setAppearance("entering");
            },
            { threshold: 0.5 }
        );
        observer.observe(ref.current);
        return () => observer.disconnect();
    }, [appearance, canStart, ref]);

    return appearance;
}
