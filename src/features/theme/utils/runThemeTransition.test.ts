import { afterEach, describe, expect, it, vi } from "vitest";
import { runThemeTransition } from "./runThemeTransition";

describe("runThemeTransition", () => {
    afterEach(() => {
        Reflect.deleteProperty(document, "startViewTransition");
        Reflect.deleteProperty(document.documentElement, "animate");
        vi.unstubAllGlobals();
    });

    const stubViewTransition = () => {
        const start = vi.fn((update: () => void) => {
            update();
            return { ready: Promise.resolve(), finished: Promise.resolve() };
        });
        const animate = vi.fn();
        Object.assign(document, { startViewTransition: start });
        Object.assign(document.documentElement, { animate });
        return { start, animate };
    };

    const origin = { x: 40, y: 20 };

    it("applies the change directly when view transitions are unavailable", async () => {
        const apply = vi.fn();
        await runThemeTransition(apply, origin);
        expect(apply).toHaveBeenCalledOnce();
    });

    it("applies the change inside a view transition and reveals it from the origin", async () => {
        const { start, animate } = stubViewTransition();
        vi.stubGlobal("matchMedia", () => ({ matches: false }));
        const apply = vi.fn();

        await runThemeTransition(apply, origin);

        expect(start).toHaveBeenCalledOnce();
        expect(apply).toHaveBeenCalledOnce();
        expect(animate.mock.calls[0][0].clipPath[0]).toBe("circle(0px at 40px 20px)");
    });

    it("skips the animation for reduced motion", async () => {
        const { start } = stubViewTransition();
        vi.stubGlobal("matchMedia", () => ({ matches: true }));
        const apply = vi.fn();
        await runThemeTransition(apply, origin);
        expect(start).not.toHaveBeenCalled();
        expect(apply).toHaveBeenCalledOnce();
    });
});
