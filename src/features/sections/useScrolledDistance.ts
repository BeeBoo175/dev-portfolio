import { useEffect, type RefObject } from "react";

/**
 * Writes how far the page has scrolled onto an element as --scrolled, for layout that follows the
 * scroll. Set directly on the element, so scrolling re-renders nothing.
 */
export function useScrolledDistance(ref: RefObject<HTMLElement | null>) {
    useEffect(() => {
        // touch layouts scroll the app shell; wider ones don't use the value
        const scroller = document.querySelector(".app-shell");
        if (!scroller) return;
        const write = () => ref.current?.style.setProperty("--scrolled", `${Math.max(0, scroller.scrollTop)}px`);
        write();
        scroller.addEventListener("scroll", write, { passive: true });
        return () => scroller.removeEventListener("scroll", write);
    }, [ref]);
}
