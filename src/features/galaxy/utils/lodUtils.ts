import * as THREE from "three";

export const LOD_LEVEL_HIGH = 0;
export const LOD_LEVEL_MEDIUM = 1;
export const LOD_LEVEL_SPARSE = 2;
export const LOD_LEVEL_SIMPLE = 3;
export const LOD_LEVEL_POINT = 4;

export interface LODThresholdConfig {
    high: number;
    medium: number;
    sparse: number;
    simple: number;
    hysteresisFraction: number;
}

export const DEFAULT_PLANET_LOD_THRESHOLDS: LODThresholdConfig = {
    high: 60,
    medium: 30,
    sparse: 15,
    simple: 6,
    hysteresisFraction: 0.15,
};

export const DEFAULT_MOON_LOD_THRESHOLDS: LODThresholdConfig = {
    high: 45,
    medium: 22,
    sparse: 12,
    simple: 5,
    hysteresisFraction: 0.15,
};

const _posScratch = new THREE.Vector3();

export function calculateProjectedDiameter(
    worldRadius: number,
    worldPosition: THREE.Vector3,
    camera: THREE.Camera,
    screenHeightPx: number
): number {
    if (screenHeightPx <= 0 || worldRadius <= 0) {
        return 0;
    }

    _posScratch.copy(worldPosition);
    const dist = camera.position.distanceTo(_posScratch);

    if (dist <= 0.0001) {
        return screenHeightPx;
    }

    if ("fov" in camera && typeof (camera as THREE.PerspectiveCamera).fov === "number") {
        const persCamera = camera as THREE.PerspectiveCamera;
        const fovRad = (persCamera.fov * Math.PI) / 180;
        const apparentRadiusPx = (worldRadius / (dist * Math.tan(fovRad * 0.5))) * (screenHeightPx * 0.5);
        return apparentRadiusPx * 2;
    }

    if ("top" in camera && "bottom" in camera) {
        const orthoCamera = camera as THREE.OrthographicCamera;
        const orthoHeight = Math.abs(orthoCamera.top - orthoCamera.bottom);
        if (orthoHeight > 0) {
            return (worldRadius * 2 / orthoHeight) * screenHeightPx;
        }
    }

    return (worldRadius * 2 / dist) * screenHeightPx;
}

export function resolveLODLevel(
    screenDiameterPx: number,
    currentLevel: number,
    isMoon: boolean,
    config: LODThresholdConfig = isMoon ? DEFAULT_MOON_LOD_THRESHOLDS : DEFAULT_PLANET_LOD_THRESHOLDS
): number {
    const h = config.hysteresisFraction;

    const highDown = config.high * (1 - h);
    const highUp = config.high * (1 + h);

    const mediumDown = config.medium * (1 - h);
    const mediumUp = config.medium * (1 + h);

    const sparseDown = config.sparse * (1 - h);
    const sparseUp = config.sparse * (1 + h);

    const simpleDown = config.simple * (1 - h);
    const simpleUp = config.simple * (1 + h);

    if (currentLevel === LOD_LEVEL_HIGH) {
        if (screenDiameterPx < highDown) {
            return screenDiameterPx < mediumDown
                ? (screenDiameterPx < sparseDown
                    ? (screenDiameterPx < simpleDown ? LOD_LEVEL_POINT : LOD_LEVEL_SIMPLE)
                    : LOD_LEVEL_SPARSE)
                : LOD_LEVEL_MEDIUM;
        }
        return LOD_LEVEL_HIGH;
    }

    if (currentLevel === LOD_LEVEL_MEDIUM) {
        if (screenDiameterPx > highUp) return LOD_LEVEL_HIGH;
        if (screenDiameterPx < mediumDown) {
            return screenDiameterPx < sparseDown
                ? (screenDiameterPx < simpleDown ? LOD_LEVEL_POINT : LOD_LEVEL_SIMPLE)
                : LOD_LEVEL_SPARSE;
        }
        return LOD_LEVEL_MEDIUM;
    }

    if (currentLevel === LOD_LEVEL_SPARSE) {
        if (screenDiameterPx > mediumUp) return LOD_LEVEL_MEDIUM;
        if (screenDiameterPx < sparseDown) {
            return screenDiameterPx < simpleDown ? LOD_LEVEL_POINT : LOD_LEVEL_SIMPLE;
        }
        return LOD_LEVEL_SPARSE;
    }

    if (currentLevel === LOD_LEVEL_SIMPLE) {
        if (screenDiameterPx > sparseUp) return LOD_LEVEL_SPARSE;
        if (screenDiameterPx < simpleDown) return LOD_LEVEL_POINT;
        return LOD_LEVEL_SIMPLE;
    }

    if (currentLevel === LOD_LEVEL_POINT) {
        if (screenDiameterPx > simpleUp) return LOD_LEVEL_SIMPLE;
        return LOD_LEVEL_POINT;
    }

    if (screenDiameterPx >= config.high) return LOD_LEVEL_HIGH;
    if (screenDiameterPx >= config.medium) return LOD_LEVEL_MEDIUM;
    if (screenDiameterPx >= config.sparse) return LOD_LEVEL_SPARSE;
    if (screenDiameterPx >= config.simple) return LOD_LEVEL_SIMPLE;
    return LOD_LEVEL_POINT;
}
