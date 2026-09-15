import { describe, expect, it } from "vitest";
import css from "../../index.css?raw";

const blockAfter = (selector: string) => {
    const start = css.indexOf(selector);
    return css.slice(start, css.indexOf("\n}", start));
};
const readToken = (block: string, name: string) => new RegExp(`--${name}: (#[0-9a-f]{6});`, "i").exec(block)![1];

const luminance = (hex: string) => {
    const [r, g, b] = [1, 3, 5].map((at) => {
        const c = parseInt(hex.slice(at, at + 2), 16) / 255;
        return c <= 0.04045 ? c / 12.92 : Math.pow((c + 0.055) / 1.055, 2.4);
    });
    return 0.2126 * r + 0.7152 * g + 0.0722 * b;
};
const contrast = (a: string, b: string) => {
    const [high, low] = [luminance(a), luminance(b)].sort((x, y) => y - x);
    return (high + 0.05) / (low + 0.05);
};

describe.each([
    ["dark", ":root {"],
    ["light", ':root[data-theme="light"],'],
])("%s palette", (_, selector) => {
    const block = blockAfter(selector);

    // 4.5:1 is the WCAG minimum for body text
    it("keeps every text colour readable on the canvas and on panels", () => {
        for (const surface of ["bg-canvas", "panel"]) {
            for (const text of ["text-primary", "text-secondary", "text-muted", "text-dim", "accent", "signal"]) {
                expect(contrast(readToken(block, text), readToken(block, surface)), `${text} on ${surface}`).toBeGreaterThanOrEqual(4.5);
            }
        }
    });

    it("keeps the stressed word in the location pill readable", () => {
        expect(contrast(readToken(block, "on-highlight"), readToken(block, "bg-canvas"))).toBeGreaterThanOrEqual(4.5);
    });

    it("keeps the primary button's label readable", () => {
        expect(contrast(readToken(block, "on-signal"), readToken(block, "signal"))).toBeGreaterThanOrEqual(4.5);
    });
});
