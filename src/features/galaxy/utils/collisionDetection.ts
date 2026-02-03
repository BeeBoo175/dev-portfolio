import type { OrbitConfig } from "../types";

export interface CollisionWarning {
    id: string;
    type: "planet-planet" | "planet-moon" | "moon-moon" | "cross-system";
    title: string;
    description: string;
}

export function detectPlanetCollisions(
    planet: OrbitConfig,
    allPlanets: OrbitConfig[]
): CollisionWarning[] {
    const warnings: CollisionWarning[] = [];
    const r1 = planet.radius ?? 1;
    const o1 = planet.orbitRadius ?? 0;

    if (o1 <= 0) return warnings;

    for (const other of allPlanets) {
        if (other.id === planet.id) continue;
        const o2 = other.orbitRadius ?? 0;
        const r2 = other.radius ?? 1;

        if (o2 <= 0) continue;

        const dist = Math.abs(o1 - o2);
        const minSafeDist = r1 + r2 + 0.25;

        if (dist < minSafeDist) {
            warnings.push({
                id: `pp-${other.id}`,
                type: "planet-planet",
                title: `Planetary Orbit Overlap (${other.id.toUpperCase()})`,
                description: `Orbit radius (${o1.toFixed(1)}) overlaps with ${other.id.toUpperCase()} (${o2.toFixed(1)}). Physical collisions are cosmetic only and will not impede site navigation.`,
            });
        }

        const planetMoons = planet.children ?? [];
        for (const moon of planetMoons) {
            const moonMaxReach = (moon.orbitRadius ?? 2.0) + moon.radius;
            const innerBound = o1 - moonMaxReach;
            const outerBound = o1 + moonMaxReach;

            if (o2 >= innerBound - r2 && o2 <= outerBound + r2 && dist >= minSafeDist) {
                warnings.push({
                    id: `cross-${other.id}-${moon.id}`,
                    type: "cross-system",
                    title: `Lunar Cross-System Reach (${other.id.toUpperCase()})`,
                    description: `Moon orbit extends into ${other.id.toUpperCase()}'s orbital lane.`,
                });
            }
        }
    }

    const moons = planet.children ?? [];
    for (let i = 0; i < moons.length; i++) {
        const m1 = moons[i];
        const m1Orbit = m1.orbitRadius ?? 2.0;

        if (m1Orbit < r1 + m1.radius + 0.1) {
            warnings.push({
                id: `pm-${m1.id}`,
                type: "planet-moon",
                title: `Surface Penetration (Moon #${i + 1})`,
                description: `Moon #${i + 1}'s orbit distance (${m1Orbit.toFixed(2)}) intersects ${planet.id.toUpperCase()}'s surface radius (${r1.toFixed(2)}).`,
            });
        }

        for (let j = i + 1; j < moons.length; j++) {
            const m2 = moons[j];
            const m2Orbit = m2.orbitRadius ?? 2.0;
            const moonDist = Math.abs(m1Orbit - m2Orbit);
            const moonMinSafe = m1.radius + m2.radius + 0.15;

            if (moonDist < moonMinSafe) {
                warnings.push({
                    id: `mm-${m1.id}-${m2.id}`,
                    type: "moon-moon",
                    title: `Lunar Trajectory Overlap (Moon #${i + 1} & Moon #${j + 1})`,
                    description: `Moons #${i + 1} and #${j + 1} share intersecting orbital paths around ${planet.id.toUpperCase()}.`,
                });
            }
        }
    }

    return warnings;
}

export function detectMoonCollisions(
    parentPlanet: OrbitConfig,
    activeMoon: OrbitConfig
): CollisionWarning[] {
    const warnings: CollisionWarning[] = [];
    const baseRadius = parentPlanet.radius ?? 1;
    const moonOrbit = activeMoon.orbitRadius ?? 2.0;

    if (moonOrbit < baseRadius + activeMoon.radius + 0.1) {
        warnings.push({
            id: `surface-${activeMoon.id}`,
            type: "planet-moon",
            title: "Surface Collision Warning",
            description: `Orbit distance (${moonOrbit.toFixed(2)}) is inside the planet's surface radius (${baseRadius.toFixed(2)}). Note: Cosmetic only.`,
        });
    }

    const siblingMoons = parentPlanet.children ?? [];
    for (let i = 0; i < siblingMoons.length; i++) {
        const sibling = siblingMoons[i];
        if (sibling.id === activeMoon.id) continue;

        const siblingOrbit = sibling.orbitRadius ?? 2.0;
        const dist = Math.abs(moonOrbit - siblingOrbit);
        const minSafe = activeMoon.radius + sibling.radius + 0.15;

        if (dist < minSafe) {
            warnings.push({
                id: `sibling-${sibling.id}`,
                type: "moon-moon",
                title: "Lunar Trajectory Overlap",
                description: `Orbit intersects with Moon #${i + 1} (${siblingOrbit.toFixed(2)}). Note: Cosmetic only.`,
            });
        }
    }

    return warnings;
}
