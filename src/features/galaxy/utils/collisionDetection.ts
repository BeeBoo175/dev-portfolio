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

export function detectAllGalaxyCollisions(allPlanets: OrbitConfig[]): CollisionWarning[] {
    const seen = new Set<string>();
    const allWarnings: CollisionWarning[] = [];

    for (const planet of allPlanets) {
        const warnings = detectPlanetCollisions(planet, allPlanets);
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

export function resolveGalaxyCollisions(planets: OrbitConfig[]): {
    resolvedPlanets: OrbitConfig[];
    changedCount: number;
} {
    let changedCount = 0;

    // Step 1: Deep clone planets and fix internal moon collisions first
    const clone: OrbitConfig[] = planets.map((p) => {
        const pRad = p.radius ?? 1.0;
        let pChanged = false;
        let currentMoons = p.children ? [...p.children] : undefined;

        if (currentMoons && currentMoons.length > 0) {
            let safeDistance = pRad + 0.5;
            currentMoons = currentMoons.map((moon) => {
                const minRequired = Number((safeDistance + moon.radius + 0.15).toFixed(2));
                const currentOrbit = moon.orbitRadius ?? 2.0;

                if (currentOrbit < minRequired) {
                    pChanged = true;
                    safeDistance = Number((minRequired + 0.1).toFixed(2));
                    return {
                        ...moon,
                        orbitRadius: minRequired,
                    };
                } else {
                    safeDistance = Number((currentOrbit + moon.radius + 0.15).toFixed(2));
                    return moon;
                }
            });
        }

        if (pChanged) changedCount++;
        return {
            ...p,
            children: currentMoons,
        };
    });

    // Step 2: Fix planetary orbit distances and cross-system reaches
    const indexed = clone.map((p, idx) => ({ p: { ...p }, idx }));
    indexed.sort((a, b) => (a.p.orbitRadius ?? 0) - (b.p.orbitRadius ?? 0));

    const SUN_SAFE_ORBIT = 6.8;

    for (let i = 0; i < indexed.length; i++) {
        const item = indexed[i];
        let orbit = item.p.orbitRadius ?? 7.0;

        if (i === 0) {
            if (orbit < SUN_SAFE_ORBIT) {
                orbit = SUN_SAFE_ORBIT;
                if (orbit !== item.p.orbitRadius) changedCount++;
                item.p.orbitRadius = orbit;
            }
        } else {
            const prevItem = indexed[i - 1];
            const prevOrbit = prevItem.p.orbitRadius ?? 7.0;
            const prevRad = prevItem.p.radius ?? 1.0;
            const curRad = item.p.radius ?? 1.0;

            let prevOuterReach = prevRad;
            if (prevItem.p.children && prevItem.p.children.length > 0) {
                for (const m of prevItem.p.children) {
                    const mReach = (m.orbitRadius ?? 2.0) + m.radius;
                    if (mReach > prevOuterReach) prevOuterReach = mReach;
                }
            }

            let curInnerReach = curRad;
            if (item.p.children && item.p.children.length > 0) {
                for (const m of item.p.children) {
                    const mReach = (m.orbitRadius ?? 2.0) + m.radius;
                    if (mReach > curInnerReach) curInnerReach = mReach;
                }
            }

            const minSafeDist = Math.max(
                prevRad + curRad + 0.35,
                prevOuterReach + curInnerReach + 0.45
            );

            const minRequiredOrbit = Number((prevOrbit + minSafeDist).toFixed(1));

            if (orbit < minRequiredOrbit) {
                if (orbit !== minRequiredOrbit) changedCount++;
                item.p.orbitRadius = minRequiredOrbit;
            }
        }
    }

    indexed.sort((a, b) => a.idx - b.idx);
    const resolvedPlanets = indexed.map((item) => item.p);

    return { resolvedPlanets, changedCount };
}
