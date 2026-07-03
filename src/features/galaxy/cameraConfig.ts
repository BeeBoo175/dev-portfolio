export interface CameraDistanceConfig {
    homeRadial: number;
    homeHeight: number;
    orbitRadial: number;
    orbitHeight: number;
    beltDistance: number;
}

export const DESKTOP_CAMERA_CONFIG: CameraDistanceConfig = {
    homeRadial: 52,
    homeHeight: 30,
    orbitRadial: 8.5,
    orbitHeight: 4.25,
    beltDistance: 36,
};

export const MOBILE_CAMERA_CONFIG: CameraDistanceConfig = {
    homeRadial: 68,
    homeHeight: 38,
    orbitRadial: 12.0,
    orbitHeight: 5.8,
    beltDistance: 46,
};

export function getCameraDistanceConfig(isMobile: boolean): CameraDistanceConfig {
    return isMobile ? MOBILE_CAMERA_CONFIG : DESKTOP_CAMERA_CONFIG;
}
