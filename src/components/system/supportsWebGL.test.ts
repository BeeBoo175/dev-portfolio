import { afterEach, describe, expect, it, vi } from "vitest";

describe("supportsWebGL", () => {
    afterEach(() => {
        window.history.replaceState({}, "", "/");
        vi.restoreAllMocks();
        vi.resetModules();
    });

    const ask = async (url: string) => {
        window.history.replaceState({}, "", url);
        vi.spyOn(HTMLCanvasElement.prototype, "getContext").mockReturnValue({} as never);
        const { supportsWebGL } = await import("./supportsWebGL");
        return supportsWebGL();
    };

    it("says yes when the browser gives a context", async () => {
        await expect(ask("/")).resolves.toBe(true);
    });

    it("says no when the address asks to try the site without 3D", async () => {
        await expect(ask("/about?no3d")).resolves.toBe(false);
    });
});
