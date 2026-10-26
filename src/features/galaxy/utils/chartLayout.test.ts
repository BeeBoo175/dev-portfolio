import { describe, expect, it } from "vitest";
import { CHART, layoutChart } from "./chartLayout";
import { DEFAULT_ASTEROID_BELT, DEFAULT_SUN, ORBIT_LAYOUT } from "../data";

describe("layoutChart", () => {
    const chart = layoutChart(DEFAULT_SUN, ORBIT_LAYOUT, DEFAULT_ASTEROID_BELT);
    const bodies = [chart.sun, ...chart.planets];

    it("keeps every body inside the drawing", () => {
        for (const body of bodies) {
            expect(body.x - body.r).toBeGreaterThanOrEqual(0);
            expect(body.x + body.r).toBeLessThanOrEqual(CHART.width);
            expect(body.y - body.r).toBeGreaterThanOrEqual(0);
            expect(body.y + body.r).toBeLessThanOrEqual(CHART.height);
        }
    });

    it("never lays one body over another", () => {
        bodies.forEach((a, i) =>
            bodies.slice(i + 1).forEach((b) => {
                expect(Math.hypot(a.x - b.x, a.y - b.y), `${a.id}/${b.id}`).toBeGreaterThan(a.r + b.r);
            })
        );
    });

    it("orders the orbits by distance and carries each body's own colour and ring", () => {
        expect(chart.planets.map((planet) => planet.label)).toEqual(["II About", "III Skills", "IV Projects", "V Contact"]);
        expect(chart.planets.find((planet) => planet.id === "projects")?.ringColor).toBe("#6ee7b7");
        expect(chart.sun.color).toBe(DEFAULT_SUN.color);
    });

    it("puts the belt between two orbits, and leaves it out when it is off", () => {
        const [, second, third] = chart.planets;
        expect(chart.belt!.rx).toBeGreaterThan(second.orbit.rx);
        expect(chart.belt!.rx).toBeLessThan(third.orbit.rx);
        expect(layoutChart(DEFAULT_SUN, ORBIT_LAYOUT, { ...DEFAULT_ASTEROID_BELT, enabled: false }).belt).toBeNull();
    });
});
