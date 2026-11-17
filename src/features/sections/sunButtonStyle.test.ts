import { describe, expect, it } from "vitest";
import { getSunButtonStyle } from "./sunButtonStyle";

const read = (color: string) => getSunButtonStyle(color) as Record<string, string>;

describe("getSunButtonStyle", () => {
    it("uses the sun's colour exactly", () => {
        expect(read("#ffe59e")["--sun-base"]).toBe("rgb(255, 229, 158)");
    });

    it("picks an arrow colour that stands out, and survives an unreadable colour", () => {
        expect(read("#ffe59e")["--sun-icon-color"]).toBe("#1a0b02");
        expect(read("#1e3a8a")["--sun-icon-color"]).toBe("#ffffff");
        expect(read("tomato")["--sun-glow-rgb"]).toBe("255, 215, 107");
    });
});
