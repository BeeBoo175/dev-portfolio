import { afterEach, describe, expect, it, vi } from "vitest";
import { fontsReady } from "./fontsReady";

describe("fontsReady", () => {
    afterEach(() => {
        Reflect.deleteProperty(document, "fonts");
        vi.useRealTimers();
    });

    it("does not wait where font loading can't be observed", async () => {
        await expect(fontsReady()).resolves.toBeUndefined();
    });

    it("gives up after the limit rather than hold the page back", async () => {
        vi.useFakeTimers();
        Object.defineProperty(document, "fonts", { configurable: true, value: { load: () => new Promise(() => {}) } });
        let done = false;
        void fontsReady(500).then(() => (done = true));
        await vi.advanceTimersByTimeAsync(499);
        expect(done).toBe(false);
        await vi.advanceTimersByTimeAsync(1);
        expect(done).toBe(true);
    });
});
