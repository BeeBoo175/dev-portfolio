import { act } from "react";
import { createRoot, type Root } from "react-dom/client";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { CopyEmailButton } from "./CopyEmailButton";

Object.assign(globalThis, { IS_REACT_ACT_ENVIRONMENT: true });

describe("CopyEmailButton", () => {
    let container: HTMLDivElement;
    let root: Root;

    beforeEach(() => {
        container = document.createElement("div");
        document.body.appendChild(container);
        root = createRoot(container);
        act(() => root.render(<CopyEmailButton address="someone@example.com" />));
    });

    afterEach(() => {
        act(() => root.unmount());
        container.remove();
        vi.unstubAllGlobals();
    });

    const press = () => act(async () => container.querySelector("button")!.click());
    const status = () => container.querySelector('[role="status"]')!.textContent;

    it("copies the address and says so", async () => {
        const writeText = vi.fn(() => Promise.resolve());
        vi.stubGlobal("navigator", { clipboard: { writeText } });

        await press();

        expect(writeText).toHaveBeenCalledWith("someone@example.com");
        expect(status()).toBe("Copied to clipboard");
    });

    it("explains how to recover when the clipboard is refused", async () => {
        vi.stubGlobal("navigator", { clipboard: { writeText: () => Promise.reject(new Error("denied")) } });

        await press();

        expect(status()).toContain("Select the address");
    });
});
