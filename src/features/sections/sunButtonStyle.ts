import type { CSSProperties } from "react";

function toRgb(color: string): [number, number, number] | null {
    const match = /^#?([0-9a-f]{6})$/i.exec(color.trim());
    if (!match) return null;
    const value = parseInt(match[1], 16);
    return [value >> 16, (value >> 8) & 255, value & 255];
}

/** The sun-shaped "back to top" button wears the scene's sun colour, unaltered, in both themes. */
export function getSunButtonStyle(color: string): CSSProperties {
    const [r, g, b] = toRgb(color) ?? [255, 215, 107];
    const baseColor = `rgb(${r}, ${g}, ${b})`;

    return {
        "--sun-base": baseColor,
        "--sun-light": `color-mix(in srgb, ${baseColor}, white 25%)`,
        "--sun-dark": `color-mix(in srgb, ${baseColor}, black 12%)`,
        "--sun-glow-rgb": `${r}, ${g}, ${b}`,
        "--sun-icon-color": (0.299 * r + 0.587 * g + 0.114 * b) / 255 > 0.55 ? "#1a0b02" : "#ffffff",
    } as CSSProperties;
}
