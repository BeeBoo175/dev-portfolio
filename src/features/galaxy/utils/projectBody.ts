import * as THREE from "three";
import type { ScreenCircle } from "./calloutGeometry";

const center = new THREE.Vector3();
const rim = new THREE.Vector3();

/** Where a body lands on screen with the camera as it stands now. */
export function projectBody(
    body: THREE.Object3D,
    worldRadius: number,
    camera: THREE.Camera,
    size: { width: number; height: number }
): ScreenCircle & { behind: boolean } {
    // three.js refreshes these only when it renders, which is after the camera has already moved this
    // frame. Without this the screen marks trail one frame behind the scene they point at.
    camera.updateMatrixWorld();
    body.getWorldPosition(center);
    rim.setFromMatrixColumn(camera.matrixWorld, 0).multiplyScalar(worldRadius).add(center);
    center.project(camera);
    rim.project(camera);
    const x = ((center.x + 1) / 2) * size.width;
    return {
        x,
        y: ((1 - center.y) / 2) * size.height,
        r: Math.abs(((rim.x + 1) / 2) * size.width - x),
        behind: center.z > 1,
    };
}
