import type { AsteroidBeltConfig, OrbitConfig, SunConfig } from "../types";
import { resolveCelestialBodyColor } from "./bodyColor";
import { getBodyNumeral } from "./numerals";

export const CHART = { width: 640, height: 340, x: 320, y: 164 };

/** How flat the orbits are drawn: the scene's own viewing angle, roughly. */
const TILT = 0.46;
const INNER = 92;
const OUTER = 276;
/** Where each planet sits on its orbit, by distance from the sun. Chosen so that labels never meet. */
const ANGLES = [-28, 156, 52, 222, -112, 108];

export interface ChartBody {
    id: string;
    label: string;
    x: number;
    y: number;
    r: number;
    color: string;
    ringColor?: string;
}

export interface ChartLayout {
    sun: ChartBody;
    planets: (ChartBody & { orbit: { rx: number; ry: number } })[];
    belt: { rx: number; ry: number } | null;
}

const nameOf = (id: string) => (id === "home" ? "Sun" : id.charAt(0).toUpperCase() + id.slice(1));
const labelOf = (id: string) => `${getBodyNumeral(id)} ${nameOf(id)}`.trim();

/** Orbits are evenly spaced and sizes compressed: a diagram to read, not a scale model. */
export function layoutChart(sun: SunConfig, planets: OrbitConfig[], belt?: AsteroidBeltConfig): ChartLayout {
    const ordered = [...planets].sort((a, b) => (a.orbitRadius ?? 0) - (b.orbitRadius ?? 0));
    const gap = ordered.length > 1 ? (OUTER - INNER) / (ordered.length - 1) : 0;
    const radiusAt = (rank: number) => INNER + gap * rank;

    const drawn = ordered.map((planet, rank) => {
        const rx = radiusAt(rank);
        const ry = rx * TILT;
        const angle = (ANGLES[rank % ANGLES.length] * Math.PI) / 180;
        return {
            id: planet.id,
            label: labelOf(planet.id),
            x: CHART.x + rx * Math.cos(angle),
            y: CHART.y + ry * Math.sin(angle),
            r: Math.min(30, 7 + planet.radius * 7),
            color: resolveCelestialBodyColor(planet),
            ringColor: planet.ring?.color,
            orbit: { rx, ry },
        };
    });

    let beltOrbit: ChartLayout["belt"] = null;
    if (belt?.enabled && ordered.length) {
        // halfway between the orbits it lies between
        const outside = ordered.filter((planet) => (planet.orbitRadius ?? 0) < belt.innerRadius).length;
        const rx = radiusAt(outside) - gap / 2;
        beltOrbit = { rx, ry: rx * TILT };
    }

    return {
        sun: { id: "home", label: labelOf("home"), x: CHART.x, y: CHART.y, r: 34, color: sun.color },
        planets: drawn,
        belt: beltOrbit,
    };
}
