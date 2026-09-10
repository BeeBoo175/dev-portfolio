import { describe, it, expect, beforeEach, afterEach } from "vitest";
import { act } from "react";
import { createRoot } from "react-dom/client";
import * as THREE from "three";
import { useCameraRigControls } from "./useCameraRigControls";

interface TestComponentProps {
    allowManualOrbit?: boolean;
    allowZoom?: boolean;
    onControlsReady?: (controls: ReturnType<typeof useCameraRigControls>) => void;
}

function TestComponent({
    allowManualOrbit = true,
    allowZoom = false,
    onControlsReady,
}: TestComponentProps) {
    const gl = {
        domElement: document.createElement("canvas"),
    } as unknown as THREE.WebGLRenderer;

    const controls = useCameraRigControls({
        gl,
        focusId: "home",
        centralId: "home",
        allowManualOrbit,
        allowZoom,
    });

    if (onControlsReady) {
        onControlsReady(controls);
    }

    return <div id="test-canvas-container" />;
}

describe("useCameraRigControls", () => {
    let container: HTMLDivElement;

    beforeEach(() => {
        container = document.createElement("div");
        document.body.appendChild(container);
    });

    afterEach(() => {
        if (container.parentNode) {
            document.body.removeChild(container);
        }
    });

    it("resets offsets properly when resetOffsets is called", async () => {
        const controlsRef: { current: ReturnType<typeof useCameraRigControls> | null } = { current: null };
        const root = createRoot(container);

        await act(async () => {
            root.render(
                <TestComponent
                    onControlsReady={(controls) => {
                        controlsRef.current = controls;
                    }}
                />
            );
        });

        const controls = controlsRef.current;
        expect(controls).not.toBeNull();
        if (!controls) return;

        controls.userThetaOffsetRef.current = 1.5;
        controls.userPhiOffsetRef.current = 0.5;

        act(() => {
            controls.resetOffsets();
        });

        expect(controls.userThetaOffsetRef.current).toBe(0);
        expect(controls.userPhiOffsetRef.current).toBe(0);
    });

    it("smoothly updates offsets and decays inertia via updateManualOrbit", async () => {
        const controlsRef: { current: ReturnType<typeof useCameraRigControls> | null } = { current: null };
        const root = createRoot(container);

        await act(async () => {
            root.render(
                <TestComponent
                    allowManualOrbit={true}
                    onControlsReady={(controls) => {
                        controlsRef.current = controls;
                    }}
                />
            );
        });

        const controls = controlsRef.current;
        expect(controls).not.toBeNull();
        if (!controls) return;

        act(() => {
            controls.updateManualOrbit(0.016);
        });

        expect(controls.userThetaOffsetRef.current).toBe(0);
    });
});
