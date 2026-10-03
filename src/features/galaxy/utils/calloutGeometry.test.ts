import { describe, expect, it } from "vitest";
import { layoutCallout } from "./calloutGeometry";

const base = {
    sun: { x: 900, y: 200, r: 40 },
    planet: { x: 600, y: 400, r: 50 },
    edge: 50,
    width: 1200,
    height: 800,
    nameWidth: 100,
};

describe("layoutCallout", () => {
    it("splits the radius line around a level distance readout", () => {
        const layout = layoutCallout(base);
        expect(layout.distance).toEqual({ x: expect.any(Number), y: expect.any(Number) });
        expect(layout.dimensionStart).toMatch(/^M/);
        expect(layout.dimensionEnd).toMatch(/^M/);
    });

    it("drops the radius line when the bodies nearly touch", () => {
        const layout = layoutCallout({ ...base, sun: { x: 700, y: 400, r: 40 } });
        expect(layout.distance).toBeNull();
        expect(layout.dimensionStart).toBe("");
    });

    it("keeps a short radius line whole with the readout beside it", () => {
        const layout = layoutCallout({ ...base, sun: { x: 740, y: 400, r: 40 } });
        expect(layout.dimensionStart).toBe(layout.dimensionEnd);
        expect(layout.distance!.y).toBeLessThan(400);
    });

    it("bends the name away from the sun", () => {
        expect(layoutCallout(base).node.y).toBeGreaterThan(base.planet.y);
        expect(layoutCallout({ ...base, sun: { x: 900, y: 700, r: 40 } }).node.y).toBeLessThan(base.planet.y);
    });

    it("keeps the name inside a narrow viewport", () => {
        const layout = layoutCallout({ ...base, planet: { x: 180, y: 300, r: 60 }, edge: 60, width: 360 });
        expect(layout.name.x).toBeGreaterThanOrEqual(6);
        expect(layout.name.x + base.nameWidth).toBeLessThanOrEqual(360);
    });
});

describe("layoutCallout steadiness", () => {
    // the camera follows a planet, so its screen position trembles by a pixel or two from frame to frame
    const sidesWhileTrembling = (width: number, centre: number) => {
        let previous: { side: 1 | -1; vertical: 1 | -1 } | undefined;
        return [-2, 2, -2, 2, -2, 2].map((jitter) => {
            const layout = layoutCallout({
                ...base,
                width,
                planet: { x: centre + jitter, y: 300, r: 60 },
                edge: 60,
                previous,
            });
            previous = layout.placement;
            return layout.placement.side;
        });
    };

    it("holds its side when neither side quite fits and the planet is mid-screen", () => {
        expect(new Set(sidesWhileTrembling(360, 180)).size).toBe(1);
    });

    it("holds its side at the point where the name only just stops fitting", () => {
        // right side fits exactly while x < width - 6 - offset - 30 - 108
        const edgeOfFit = 700 - 6 - 62 * Math.SQRT1_2 - 30 - 108;
        expect(new Set(sidesWhileTrembling(700, edgeOfFit)).size).toBe(1);
    });

    it("still changes side once the planet has clearly moved", () => {
        const first = layoutCallout({ ...base, planet: { x: 200, y: 300, r: 50 } });
        const moved = layoutCallout({ ...base, planet: { x: 1100, y: 300, r: 50 }, previous: first.placement });
        expect(first.placement.side).toBe(1);
        expect(moved.placement.side).toBe(-1);
    });
});

describe("layoutCallout headroom", () => {
    const phone = { ...base, width: 330, preferAbove: true, topInset: 84 };

    it("keeps a right-hand name below the control in the top corner", () => {
        const layout = layoutCallout({ ...phone, planet: { x: 60, y: 170, r: 50 }, edge: 50 });
        expect(layout.placement.side).toBe(1);
        expect(layout.name.y).toBeGreaterThanOrEqual(84 - 7);
    });

    it("sends a big centred planet's name to the free top left, above the planet", () => {
        const layout = layoutCallout({ ...phone, planet: { x: 170, y: 130, r: 66 }, edge: 130 });
        expect(layout.placement).toEqual({ side: -1, vertical: -1 });
        expect(layout.name.x).toBeGreaterThanOrEqual(6);
        expect(layout.name.y).toBeLessThan(130 - 40);
    });
});

describe("layoutCallout pointing", () => {
    const cases = {
        "a roomy desktop": {},
        "a ringed planet filling a phone": { width: 330, planet: { x: 170, y: 150, r: 70 }, edge: 130, preferAbove: true, topInset: 84 },
        "a planet pressed against the top": { width: 330, planet: { x: 170, y: 100, r: 60 }, edge: 100, preferAbove: true, topInset: 84 },
        "a planet at the right edge": { width: 330, planet: { x: 300, y: 300, r: 50 }, edge: 50 },
    };

    it.each(Object.entries(cases))("starts on the planet and leads clearly away from the dot: %s", (_, change) => {
        const input = { ...base, ...change };
        const layout = layoutCallout(input);
        const fromCentre = Math.hypot(layout.node.x - input.planet.x, layout.node.y - input.planet.y);
        expect(fromCentre).toBeCloseTo(input.planet.r);

        const [, startX, startY, endX, endY] = /^M([-\d.]+) ([-\d.]+)L([-\d.]+) ([-\d.]+)h/.exec(layout.leader)!.map(Number);
        expect([startX, startY]).toEqual([layout.node.x, layout.node.y]);
        expect(Number.isFinite(endX)).toBe(true);
        expect(Math.abs(endY - startY)).toBeGreaterThanOrEqual(22);
    });
});
