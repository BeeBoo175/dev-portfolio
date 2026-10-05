import { describe, expect, it } from "vitest";
import * as THREE from "three";
import { projectBody } from "./projectBody";

describe("projectBody", () => {
    const size = { width: 1000, height: 600 };

    it("uses where the camera is now, even before the next render", () => {
        const camera = new THREE.PerspectiveCamera(50, size.width / size.height, 0.1, 100);
        camera.position.set(0, 0, 10);
        const body = new THREE.Object3D();
        expect(projectBody(body, 1, camera, size).x).toBeCloseTo(500);

        // moved, as the camera rig does mid-frame, with no render in between
        camera.position.set(3, 0, 10);
        expect(projectBody(body, 1, camera, size).x).toBeLessThan(400);
    });
});
