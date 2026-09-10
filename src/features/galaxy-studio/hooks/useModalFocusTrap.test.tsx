import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { act } from "react";
import { createRoot } from "react-dom/client";
import { useRef } from "react";
import { useModalFocusTrap } from "./useModalFocusTrap";

function TestModal({
    isOpen,
    onClose,
}: {
    isOpen: boolean;
    onClose: () => void;
}) {
    const dialogRef = useRef<HTMLDivElement | null>(null);
    useModalFocusTrap(isOpen, onClose, dialogRef);

    if (!isOpen) return null;

    return (
        <div ref={dialogRef} role="dialog" aria-modal="true" tabIndex={-1}>
            <button type="button" id="btn-1">First</button>
            <button type="button" id="btn-2">Second</button>
            <button type="button" id="btn-3">Third</button>
        </div>
    );
}

describe("useModalFocusTrap", () => {
    let container: HTMLDivElement;

    beforeEach(() => {
        container = document.createElement("div");
        document.body.appendChild(container);
    });

    afterEach(() => {
        if (container.parentNode) {
            document.body.removeChild(container);
        }
    });

    it("focuses the first focusable element when opened", async () => {
        const onClose = vi.fn();
        const root = createRoot(container);

        await act(async () => {
            root.render(<TestModal isOpen={true} onClose={onClose} />);
        });

        const firstButton = document.getElementById("btn-1");
        expect(document.activeElement).toBe(firstButton);
    });

    it("calls onClose when Escape key is pressed", async () => {
        const onClose = vi.fn();
        const root = createRoot(container);

        await act(async () => {
            root.render(<TestModal isOpen={true} onClose={onClose} />);
        });

        act(() => {
            window.dispatchEvent(new KeyboardEvent("keydown", { key: "Escape" }));
        });

        expect(onClose).toHaveBeenCalledTimes(1);
    });

    it("traps focus inside the modal on Tab and Shift+Tab", async () => {
        const onClose = vi.fn();
        const root = createRoot(container);

        await act(async () => {
            root.render(<TestModal isOpen={true} onClose={onClose} />);
        });

        const firstButton = document.getElementById("btn-1") as HTMLButtonElement;
        const thirdButton = document.getElementById("btn-3") as HTMLButtonElement;

        thirdButton.focus();
        expect(document.activeElement).toBe(thirdButton);

        act(() => {
            window.dispatchEvent(new KeyboardEvent("keydown", { key: "Tab", bubbles: true }));
        });
        expect(document.activeElement).toBe(firstButton);

        act(() => {
            window.dispatchEvent(new KeyboardEvent("keydown", { key: "Tab", shiftKey: true, bubbles: true }));
        });
        expect(document.activeElement).toBe(thirdButton);
    });
});
