import * as THREE from "three";

const _accentColorCache = new Map<string, string>();
const _accentThreeColorCache = new Map<string, THREE.Color>();
const _scratchBase = new THREE.Color();
const _scratchHsl = { h: 0, s: 0, l: 0 };
const _scratchAdjusted = new THREE.Color();

export function getEffectiveAccentColor(color: string, isLight: boolean): string {
    if (!isLight) return color;
    const cached = _accentColorCache.get(color);
    if (cached) return cached;

    _scratchBase.set(color);
    _scratchBase.getHSL(_scratchHsl);

    const targetLightness = Math.min(0.24, Math.max(0.12, _scratchHsl.l * 0.42));
    const targetSaturation = Math.min(1.0, Math.max(0.8, _scratchHsl.s * 1.4));

    _scratchAdjusted.setHSL(_scratchHsl.h, targetSaturation, targetLightness);
    const hex = `#${_scratchAdjusted.getHexString()}`;

    if (_accentColorCache.size > 2000) {
        _accentColorCache.clear();
    }
    _accentColorCache.set(color, hex);
    return hex;
}

export function getEffectiveAccentThreeColor(color: string, isLight: boolean): THREE.Color {
    const key = `${color}_${isLight ? "1" : "0"}`;
    const cached = _accentThreeColorCache.get(key);
    if (cached) return cached.clone();

    const hex = getEffectiveAccentColor(color, isLight);
    const created = new THREE.Color(hex);

    if (_accentThreeColorCache.size > 2000) {
        _accentThreeColorCache.clear();
    }
    _accentThreeColorCache.set(key, created);
    return created.clone();
}

export { resolveCelestialBodyColor } from "./bodyColor";

/** The pale theme's blue, drawn faintly: enough to part a body from the paper without outlining it. */
const BLUEPRINT_KEYLINE = "#1c3f8f";
export const BLUEPRINT_KEYLINE_OPACITY = 0.28;

/** How a body is set off from the pale chart without altering its colour. */
export function getBlueprintRimColors(color: string, isSun = false): { fill: string; edge: string; keyline: string } {
    const fill = new THREE.Color("#fbfdff").lerp(new THREE.Color(color), isSun ? 0.92 : 0.3);
    return { fill: `#${fill.getHexString()}`, edge: color, keyline: BLUEPRINT_KEYLINE };
}
