import { describe, it, expect } from "vitest";
import { resolveTargetSelection } from "./studioTarget";
import type { OrbitConfig } from "../../galaxy";

const mockPlanets: OrbitConfig[] = [
    {
        id: "about",
        radius: 0.8,
        rotationSpeed: 0.4,
        children: [
            {
                id: "about-moon-1",
                radius: 0.25,
                rotationSpeed: 0.5,
                orbitRadius: 2.0,
            },
            {
                id: "about-moon-2",
                radius: 0.3,
                rotationSpeed: 0.6,
                orbitRadius: 3.5,
            },
        ],
    },
    {
        id: "skills",
        radius: 1.1,
        rotationSpeed: 0.3,
    },
    {
        id: "projects",
        radius: 1.4,
        rotationSpeed: 0.25,
        children: [
            {
                id: "custom-satellite-id",
                radius: 0.2,
                rotationSpeed: 0.7,
                orbitRadius: 2.5,
            },
        ],
    },
];

describe("resolveTargetSelection", () => {
    it("resolves top level sun and home targets", () => {
        expect(resolveTargetSelection("home", mockPlanets)).toEqual({
            focusId: "home",
            isMoon: false,
        });
        expect(resolveTargetSelection("sun", mockPlanets)).toEqual({
            focusId: "home",
            isMoon: false,
        });
        expect(resolveTargetSelection("", mockPlanets)).toEqual({
            focusId: "home",
            isMoon: false,
        });
    });

    it("resolves asteroid-belt target", () => {
        expect(resolveTargetSelection("asteroid-belt", mockPlanets)).toEqual({
            focusId: "asteroid-belt",
            isMoon: false,
        });
    });

    it("resolves direct planet targets with appearance tab default", () => {
        expect(resolveTargetSelection("about", mockPlanets)).toEqual({
            focusId: "about",
            tab: "appearance",
            isMoon: false,
        });
        expect(resolveTargetSelection("skills", mockPlanets)).toEqual({
            focusId: "skills",
            tab: "appearance",
            isMoon: false,
        });
    });


    it("resolves moon target to its parent planet and index", () => {
        expect(resolveTargetSelection("about-moon-1", mockPlanets)).toEqual({
            focusId: "about",
            tab: "moons",
            moonIndex: 0,
            isMoon: true,
        });

        expect(resolveTargetSelection("about-moon-2", mockPlanets)).toEqual({
            focusId: "about",
            tab: "moons",
            moonIndex: 1,
            isMoon: true,
        });

        expect(resolveTargetSelection("custom-satellite-id", mockPlanets)).toEqual({
            focusId: "projects",
            tab: "moons",
            moonIndex: 0,
            isMoon: true,
        });
    });

    it("falls back to home when target is unknown", () => {
        expect(resolveTargetSelection("unknown-target-id", mockPlanets)).toEqual({
            focusId: "home",
            isMoon: false,
        });
    });
});
