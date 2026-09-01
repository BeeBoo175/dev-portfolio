import type { AsteroidBeltConfig, OrbitConfig, SunConfig } from "../types";
import { DEFAULT_SUN } from "../data";

export interface CollisionWarning {
    id: string;
    type: "sun-planet" | "sun-moon" | "planet-planet" | "planet-moon" | "moon-moon" | "cross-system" | "planet-belt" | "moon-belt";
    title: string;
    description: string;
}

export function detectPlanetCollisions(
    planet: OrbitConfig,
    allPlanets: OrbitConfig[],
    asteroidBelt?: AsteroidBeltConfig,
    sun?: SunConfig | { radius?: number }
): CollisionWarning[] {
    const warnings: CollisionWarning[] = [];
    const r1 = planet.radius ?? 1;
    const ring1Outer = planet.ring?.outerRadius ?? 0;
    const planet1Reach = Math.max(r1, ring1Outer);
    const o1 = planet.orbitRadius ?? 0;

    if (o1 <= 0) return warnings;

    const sunRadius = (sun && typeof sun.radius === "number") ? sun.radius : DEFAULT_SUN.radius;
    const sunSafeDist = sunRadius + planet1Reach + 0.3;
    if (o1 < sunSafeDist) {
        warnings.push({
            id: `sun-${planet.id}`,
            type: "sun-planet",
            title: `Solar Collision Warning (${planet.id.toUpperCase()})`,
            description: `Orbit radius (${o1.toFixed(1)}) brings ${planet.id.toUpperCase()} (reach ${planet1Reach.toFixed(2)}) inside or too close to the Sun (radius ${sunRadius.toFixed(1)}).`,
        });
    }

    const planetMoons = planet.children ?? [];
    for (let m = 0; m < planetMoons.length; m++) {
        const moon = planetMoons[m];
        const moonReach = (moon.orbitRadius ?? 2.0) + moon.radius;
        const moonClosestOrbit = o1 - moonReach;
        if (moonClosestOrbit < sunRadius + 0.2 && o1 >= sunSafeDist) {
            warnings.push({
                id: `sun-moon-${planet.id}-${moon.id}`,
                type: "sun-moon",
                title: `Lunar Solar Intersection (${planet.id.toUpperCase()} Moon #${m + 1})`,
                description: `Moon #${m + 1}'s orbit brings it within the Sun's perimeter (closest reach ${moonClosestOrbit.toFixed(2)}, Sun radius ${sunRadius.toFixed(1)}).`,
            });
        }
    }

    for (const other of allPlanets) {
        if (other.id === planet.id) continue;
        const o2 = other.orbitRadius ?? 0;
        const r2 = other.radius ?? 1;
        const ring2Outer = other.ring?.outerRadius ?? 0;
        const planet2Reach = Math.max(r2, ring2Outer);

        if (o2 <= 0) continue;

        const dist = Math.abs(o1 - o2);
        const minSafeDist = planet1Reach + planet2Reach + 0.25;

        if (dist < minSafeDist) {
            const hasRingConflict = ring1Outer > r1 || ring2Outer > r2;
            warnings.push({
                id: `pp-${other.id}`,
                type: "planet-planet",
                title: hasRingConflict
                    ? `Planetary Ring / Orbit Overlap (${other.id.toUpperCase()})`
                    : `Planetary Orbit Overlap (${other.id.toUpperCase()})`,
                description: `Orbit radius (${o1.toFixed(1)}) or ring reach (${planet1Reach.toFixed(2)}) overlaps with ${other.id.toUpperCase()} (${o2.toFixed(1)}, reach ${planet2Reach.toFixed(2)}).`,
            });
        }

        for (const moon of planetMoons) {
            const moonMaxReach = (moon.orbitRadius ?? 2.0) + moon.radius;
            const innerBound = o1 - moonMaxReach;
            const outerBound = o1 + moonMaxReach;

            if (o2 >= innerBound - planet2Reach && o2 <= outerBound + planet2Reach && dist >= minSafeDist) {
                warnings.push({
                    id: `cross-${other.id}-${moon.id}`,
                    type: "cross-system",
                    title: `Lunar Cross-System Reach (${other.id.toUpperCase()})`,
                    description: `Moon orbit extends into ${other.id.toUpperCase()}'s orbital lane / ring zone.`,
                });
            }
        }
    }

    if (asteroidBelt && asteroidBelt.enabled && asteroidBelt.count > 0) {
        const beltInner = asteroidBelt.innerRadius;
        const beltOuter = asteroidBelt.outerRadius;
        const planetInner = o1 - planet1Reach;
        const planetOuter = o1 + planet1Reach;

        if (planetOuter >= beltInner - 0.2 && planetInner <= beltOuter + 0.2) {
            warnings.push({
                id: `belt-${planet.id}`,
                type: "planet-belt",
                title: `Asteroid Belt Intersection (${planet.id.toUpperCase()})`,
                description: `Orbit (${o1.toFixed(1)}) or ring zone (${planet1Reach.toFixed(2)}) passes directly through the Asteroid Belt zone (${beltInner.toFixed(1)} - ${beltOuter.toFixed(1)}).`,
            });
        }

        for (let m = 0; m < planetMoons.length; m++) {
            const moon = planetMoons[m];
            const moonReach = (moon.orbitRadius ?? 2.0) + moon.radius;
            const moonMin = o1 - moonReach;
            const moonMax = o1 + moonReach;

            if (moonMax >= beltInner && moonMin <= beltOuter && !(planetOuter >= beltInner && planetInner <= beltOuter)) {
                warnings.push({
                    id: `belt-moon-${planet.id}-${moon.id}`,
                    type: "moon-belt",
                    title: `Lunar Belt Intersection (${planet.id.toUpperCase()} Moon #${m + 1})`,
                    description: `Moon #${m + 1}'s orbit extends into the Asteroid Belt field (${beltInner.toFixed(1)} - ${beltOuter.toFixed(1)}).`,
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
        } else if (ring1Outer > 0 && Math.abs(m1Orbit - ring1Outer) < m1.radius + 0.15) {
            warnings.push({
                id: `pr-${m1.id}`,
                type: "planet-moon",
                title: `Planetary Ring Intersection (Moon #${i + 1})`,
                description: `Moon #${i + 1}'s orbit (${m1Orbit.toFixed(2)}) collides with ${planet.id.toUpperCase()}'s planetary ring plane (outer radius ${ring1Outer.toFixed(2)}).`,
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
    const ringOuter = parentPlanet.ring?.outerRadius ?? 0;
    const moonOrbit = activeMoon.orbitRadius ?? 2.0;

    if (moonOrbit < baseRadius + activeMoon.radius + 0.1) {
        warnings.push({
            id: `surface-${activeMoon.id}`,
            type: "planet-moon",
            title: "Surface Collision Warning",
            description: `Orbit distance (${moonOrbit.toFixed(2)}) is inside the planet's surface radius (${baseRadius.toFixed(2)}). Note: Cosmetic only.`,
        });
    } else if (ringOuter > 0 && Math.abs(moonOrbit - ringOuter) < activeMoon.radius + 0.15) {
        warnings.push({
            id: `ring-${activeMoon.id}`,
            type: "planet-moon",
            title: "Ring Collision Warning",
            description: `Moon orbit (${moonOrbit.toFixed(2)}) intersects with planetary ring edge (${ringOuter.toFixed(2)}).`,
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

export function detectAllGalaxyCollisions(
    allPlanets: OrbitConfig[],
    asteroidBelt?: AsteroidBeltConfig,
    sun?: SunConfig | { radius?: number }
): CollisionWarning[] {
    const seen = new Set<string>();
    const allWarnings: CollisionWarning[] = [];

    for (const planet of allPlanets) {
        const warnings = detectPlanetCollisions(planet, allPlanets, asteroidBelt, sun);
        for (const w of warnings) {
            const normKey =
                w.type === "planet-planet"
                    ? [planet.id, w.id.replace("pp-", "")].sort().join("-")
                    : `${planet.id}-${w.id}`;
            if (!seen.has(normKey)) {
                seen.add(normKey);
                allWarnings.push(w);
            }
        }
    }
    return allWarnings;
}

export function resolveGalaxyCollisions(
    planets: OrbitConfig[],
    asteroidBelt?: AsteroidBeltConfig,
    sun?: SunConfig | { radius?: number }
): {
    resolvedPlanets: OrbitConfig[];
    changedCount: number;
} {
    let totalChangedCount = 0;
    const sunRadius = (sun && typeof sun.radius === "number") ? sun.radius : DEFAULT_SUN.radius;

    const workingPlanets: OrbitConfig[] = planets.map((p) => {
        const pRad = p.radius ?? 1.0;
        const pRing = p.ring?.outerRadius ?? 0;
        const safeBase = pRing > pRad ? pRing + 0.25 : pRad;
        let pChanged = false;
        let currentMoons = p.children ? [...p.children] : undefined;

        if (currentMoons && currentMoons.length > 0) {
            const indexedMoons = currentMoons.map((moon, idx) => ({ ...moon, origIndex: idx }));
            indexedMoons.sort((a, b) => (a.orbitRadius ?? 2.0) - (b.orbitRadius ?? 2.0));

            for (let mIdx = 0; mIdx < indexedMoons.length; mIdx++) {
                const moon = indexedMoons[mIdx];
                const curMoonOrbit = moon.orbitRadius ?? 2.0;

                if (mIdx === 0) {
                    const minSafeSurface = Number((safeBase + moon.radius + 0.35).toFixed(2));
                    if (curMoonOrbit < minSafeSurface) {
                        pChanged = true;
                        moon.orbitRadius = minSafeSurface;
                    }
                } else {
                    const prevMoon = indexedMoons[mIdx - 1];
                    const prevMoonOrbit = prevMoon.orbitRadius ?? 2.0;
                    const minSafeDist = prevMoon.radius + moon.radius + 0.3;
                    const minSafeOrbit = Number((prevMoonOrbit + minSafeDist).toFixed(2));

                    if (curMoonOrbit < minSafeOrbit) {
                        pChanged = true;
                        moon.orbitRadius = minSafeOrbit;
                    }
                }
            }

            indexedMoons.sort((a, b) => a.origIndex - b.origIndex);
            currentMoons = indexedMoons.map((item) => {
                const { origIndex, ...rest } = item;
                void origIndex;
                return rest as OrbitConfig;
            });
        }

        if (pChanged) totalChangedCount++;
        return {
            ...p,
            children: currentMoons,
        };
    });

    const maxPasses = 5;
    for (let pass = 0; pass < maxPasses; pass++) {
        let passChanged = false;
        const indexed = workingPlanets.map((p, idx) => ({ p, idx }));
        indexed.sort((a, b) => (a.p.orbitRadius ?? 0) - (b.p.orbitRadius ?? 0));

        for (let i = 0; i < indexed.length; i++) {
            const item = indexed[i];
            let orbit = item.p.orbitRadius ?? 7.0;
            const curRad = item.p.radius ?? 1.0;
            const curRing = item.p.ring?.outerRadius ?? 0;
            const curBaseReach = Math.max(curRad, curRing);

            let curMaxMoonReach = 0;
            if (item.p.children && item.p.children.length > 0) {
                for (const m of item.p.children) {
                    const mReach = (m.orbitRadius ?? 2.0) + m.radius;
                    if (mReach > curMaxMoonReach) curMaxMoonReach = mReach;
                }
            }
            const curReach = Math.max(curBaseReach, curMaxMoonReach);

            let minRequiredOrbit = Number((sunRadius + curReach + 0.5).toFixed(1));

            if (i > 0) {
                const prevItem = indexed[i - 1];
                const prevOrbit = prevItem.p.orbitRadius ?? 7.0;
                const prevRad = prevItem.p.radius ?? 1.0;
                const prevRing = prevItem.p.ring?.outerRadius ?? 0;
                const prevBaseReach = Math.max(prevRad, prevRing);

                let prevMaxMoonReach = 0;
                if (prevItem.p.children && prevItem.p.children.length > 0) {
                    for (const m of prevItem.p.children) {
                        const mReach = (m.orbitRadius ?? 2.0) + m.radius;
                        if (mReach > prevMaxMoonReach) prevMaxMoonReach = mReach;
                    }
                }

                const minSafeDist = Math.max(
                    prevBaseReach + curBaseReach + 0.35,
                    prevMaxMoonReach + curBaseReach + 0.35,
                    prevBaseReach + curMaxMoonReach + 0.35,
                    prevMaxMoonReach + curMaxMoonReach + 0.45
                );
                minRequiredOrbit = Math.max(minRequiredOrbit, Number((prevOrbit + minSafeDist).toFixed(1)));
            }

            if (orbit < minRequiredOrbit) {
                orbit = minRequiredOrbit;
            }

            if (asteroidBelt && asteroidBelt.enabled && asteroidBelt.count > 0) {
                const beltInner = asteroidBelt.innerRadius;
                const beltOuter = asteroidBelt.outerRadius;
                const safeBeltBuffer = 0.3;

                const minBeforeBelt = Number((beltInner - curReach - safeBeltBuffer).toFixed(1));
                const minAfterBelt = Number((beltOuter + curReach + safeBeltBuffer).toFixed(1));

                if (orbit > minBeforeBelt && orbit < minAfterBelt) {
                    if (minBeforeBelt >= minRequiredOrbit && Math.abs(orbit - minBeforeBelt) < Math.abs(orbit - minAfterBelt)) {
                        orbit = minBeforeBelt;
                    } else {
                        orbit = Math.max(minAfterBelt, minRequiredOrbit);
                    }
                }
            }

            if (orbit !== item.p.orbitRadius) {
                passChanged = true;
                totalChangedCount++;
                item.p.orbitRadius = orbit;
            }
        }

        if (!passChanged) break;
    }

    return { resolvedPlanets: workingPlanets, changedCount: totalChangedCount };
}

