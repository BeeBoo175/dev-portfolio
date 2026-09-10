import { describe, it, expect } from "vitest";
import { shouldTriggerCameraTransition } from "./cameraTransitionUtils";

describe("cameraTransitionUtils", () => {
    it("identifies initial camera state on first mount", () => {
        const result = shouldTriggerCameraTransition({
            focusId: "home",
            lastFocusId: null,
            isExitingEditor: false,
            isTransitioning: false,
            userThetaOffset: 0,
            userPhiOffset: 0,
            userZoomOffset: 0,
        });

        expect(result.shouldTransition).toBe(true);
        expect(result.isInitial).toBe(true);
        expect(result.isFocusChanged).toBe(true);
    });

    it("triggers transition when focus changes normally", () => {
        const result = shouldTriggerCameraTransition({
            focusId: "about",
            lastFocusId: "home",
            isExitingEditor: false,
            isTransitioning: false,
            userThetaOffset: 0,
            userPhiOffset: 0,
            userZoomOffset: 0,
        });

        expect(result.shouldTransition).toBe(true);
        expect(result.isInitial).toBe(false);
        expect(result.isFocusChanged).toBe(true);
    });

    it("does not trigger transition when exiting editor without camera movement", () => {
        const result = shouldTriggerCameraTransition({
            focusId: "home",
            lastFocusId: "home",
            isExitingEditor: true,
            isTransitioning: false,
            userThetaOffset: 0,
            userPhiOffset: 0,
            userZoomOffset: 0,
        });

        expect(result.shouldTransition).toBe(false);
        expect(result.isFocusChanged).toBe(false);
    });

    it("triggers transition when exiting editor with manual orbit theta offset", () => {
        const result = shouldTriggerCameraTransition({
            focusId: "home",
            lastFocusId: "home",
            isExitingEditor: true,
            isTransitioning: false,
            userThetaOffset: 0.15,
            userPhiOffset: 0,
            userZoomOffset: 0,
        });

        expect(result.shouldTransition).toBe(true);
        expect(result.isFocusChanged).toBe(false);
    });

    it("triggers transition when exiting editor with zoom offset", () => {
        const result = shouldTriggerCameraTransition({
            focusId: "home",
            lastFocusId: "home",
            isExitingEditor: true,
            isTransitioning: false,
            userThetaOffset: 0,
            userPhiOffset: 0,
            userZoomOffset: -5,
        });

        expect(result.shouldTransition).toBe(true);
        expect(result.isFocusChanged).toBe(false);
    });

    it("triggers transition when exiting editor while already mid-transition", () => {
        const result = shouldTriggerCameraTransition({
            focusId: "home",
            lastFocusId: "home",
            isExitingEditor: true,
            isTransitioning: true,
            userThetaOffset: 0,
            userPhiOffset: 0,
            userZoomOffset: 0,
        });

        expect(result.shouldTransition).toBe(true);
        expect(result.isFocusChanged).toBe(false);
    });
});
