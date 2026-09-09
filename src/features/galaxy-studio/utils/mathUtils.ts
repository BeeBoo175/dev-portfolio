export const RAD_TO_DEG = 180 / Math.PI;
export const DEG_TO_RAD = Math.PI / 180;

export function radToDeg(radians: number): number {
    return radians * RAD_TO_DEG;
}

export function degToRad(degrees: number): number {
    return degrees * DEG_TO_RAD;
}

export function generateRandomSeed(): number {
    return Math.floor(Math.random() * 9999) + 1;
}

export function clamp(val: number, min: number, max: number): number {
    return Math.max(min, Math.min(max, val));
}
