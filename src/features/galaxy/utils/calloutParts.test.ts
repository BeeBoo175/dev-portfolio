import { describe, expect, it, vi } from "vitest";
import { createCalloutParts } from "./calloutParts";

function setup() {
    const svg = document.createElementNS("http://www.w3.org/2000/svg", "svg");
    const name = document.createElementNS("http://www.w3.org/2000/svg", "text");
    name.setAttribute("data-part", "name");
    svg.appendChild(name);
    const measure = vi.fn(() => 80);
    Object.assign(name, { getComputedTextLength: measure });
    return { svg, name, measure, parts: createCalloutParts(svg) };
}

describe("createCalloutParts", () => {
    it("writes an attribute only when its value changes", () => {
        const { name, parts } = setup();
        const write = vi.spyOn(name, "setAttribute");
        parts.set("name", "x", "10");
        parts.set("name", "x", "10");
        parts.set("name", "x", "11");
        expect(write).toHaveBeenCalledTimes(2);
    });

    it("measures the name once per label", () => {
        const { measure, parts } = setup();
        parts.setText("name", "Skills");
        parts.nameWidth();
        parts.nameWidth();
        parts.setText("name", "Projects");
        parts.nameWidth();
        expect(measure).toHaveBeenCalledTimes(2);
    });
});
