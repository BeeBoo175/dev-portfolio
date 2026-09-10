import { useEffect, useRef } from "react";

const FOCUSABLE_SELECTOR =
    'button:not([disabled]):not([aria-hidden="true"]), [href], input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])';

export function useModalFocusTrap(
    isOpen: boolean,
    onClose: () => void,
    containerRef: React.RefObject<HTMLElement | null>
) {
    const previousActiveElementRef = useRef<HTMLElement | null>(null);

    useEffect(() => {
        if (!isOpen) return;

        previousActiveElementRef.current = document.activeElement as HTMLElement | null;

        const container = containerRef.current;
        if (!container) return;

        const focusableElements = container.querySelectorAll<HTMLElement>(FOCUSABLE_SELECTOR);
        if (focusableElements.length > 0) {
            focusableElements[0].focus();
        } else {
            container.focus();
        }

        const handleKeyDown = (e: KeyboardEvent) => {
            if (e.key === "Escape") {
                e.stopPropagation();
                onClose();
                return;
            }

            if (e.key !== "Tab") return;

            const currentFocusables = container.querySelectorAll<HTMLElement>(FOCUSABLE_SELECTOR);
            if (currentFocusables.length === 0) {
                e.preventDefault();
                return;
            }

            const firstElement = currentFocusables[0];
            const lastElement = currentFocusables[currentFocusables.length - 1];

            if (e.shiftKey) {
                if (document.activeElement === firstElement || !container.contains(document.activeElement)) {
                    e.preventDefault();
                    lastElement.focus();
                }
            } else {
                if (document.activeElement === lastElement || !container.contains(document.activeElement)) {
                    e.preventDefault();
                    firstElement.focus();
                }
            }
        };

        window.addEventListener("keydown", handleKeyDown);

        return () => {
            window.removeEventListener("keydown", handleKeyDown);
            if (previousActiveElementRef.current && typeof previousActiveElementRef.current.focus === "function") {
                previousActiveElementRef.current.focus();
            }
        };
    }, [isOpen, onClose, containerRef]);
}

export default useModalFocusTrap;
