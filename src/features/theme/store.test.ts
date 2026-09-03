import { describe, it, expect, beforeEach } from "vitest";
import { themeStore } from "./store";

describe("ThemeStore", () => {
    beforeEach(() => {
        if (typeof localStorage !== "undefined" && localStorage.clear) {
            localStorage.clear();
        }
        themeStore.setTheme("dark");
    });

    it("initializes with dark theme by default", () => {
        expect(themeStore.getSnapshot()).toBe("dark");
    });

    it("toggles theme correctly", () => {
        themeStore.toggleTheme();
        expect(themeStore.getSnapshot()).toBe("light");
        themeStore.toggleTheme();
        expect(themeStore.getSnapshot()).toBe("dark");
    });

    it("sets theme explicitly and updates document attributes", () => {
        themeStore.setTheme("light");
        expect(themeStore.getSnapshot()).toBe("light");
        if (typeof document !== "undefined") {
            expect(document.documentElement.getAttribute("data-theme")).toBe("light");
            expect(document.body.classList.contains("light-theme")).toBe(true);
            expect(document.body.classList.contains("dark-theme")).toBe(false);
        }
    });
});
