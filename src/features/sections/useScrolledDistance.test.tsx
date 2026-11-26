import { describe, expect, it } from "vitest";
import { act, useRef } from "react";
import { createRoot } from "react-dom/client";
import { useScrolledDistance } from "./useScrolledDistance";

(globalThis as { IS_REACT_ACT_ENVIRONMENT?: boolean }).IS_REACT_ACT_ENVIRONMENT = true;

function Probe() {
    const ref = useRef<HTMLOutputElement>(null);
    useScrolledDistance(ref);
    return <output ref={ref} />;
}

describe("useScrolledDistance", () => {
    it("follows the app shell's scroll position", () => {
        const shell = document.createElement("div");
        shell.className = "app-shell";
        document.body.appendChild(shell);
        const root = createRoot(shell);
        act(() => root.render(<Probe />));
        const target = shell.querySelector("output")!;
        expect(target.style.getPropertyValue("--scrolled")).toBe("0px");

        shell.scrollTop = 140;
        shell.dispatchEvent(new Event("scroll"));
        expect(target.style.getPropertyValue("--scrolled")).toBe("140px");

        act(() => root.unmount());
        shell.remove();
    });
});
