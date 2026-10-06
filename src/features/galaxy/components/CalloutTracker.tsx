import { useRef } from "react";
import { useFrame } from "@react-three/fiber";
import type * as THREE from "three";
import { useGalaxyPlanets, useGalaxySun, useGalaxyVisuals } from "../store";
import { useRadarTransition } from "../../transition";
import { layoutCallout, type CalloutPlacement } from "../utils/calloutGeometry";
import { projectBody } from "../utils/projectBody";
import { createCalloutParts, type CalloutParts } from "../utils/calloutParts";

/** Orbit radius that reads as 1.00 AU: the innermost planet of the default system. */
const ORBIT_UNITS_PER_AU = 7;

export interface CalloutTrackerProps {
    focusId: string;
    isEditorMode: boolean;
    bodyRefs: React.RefObject<Record<string, THREE.Group | null>>;
    calloutRef: React.RefObject<SVGSVGElement | null>;
}

/** Projects the focused planet and the sun to the screen and writes the DOM callout each frame. */
export function CalloutTracker({ focusId, isEditorMode, bodyRefs, calloutRef }: CalloutTrackerProps) {
    const planets = useGalaxyPlanets();
    const sun = useGalaxySun();
    const visuals = useGalaxyVisuals();
    const { radarStateRef } = useRadarTransition();
    const cache = useRef<CalloutParts | null>(null);
    // a new subject chooses its side afresh
    const placed = useRef<{ id: string; placement: CalloutPlacement } | null>(null);

    useFrame(({ camera, size }) => {
        const svg = calloutRef.current;
        if (!svg) return;

        const planet = planets.find((p) => p.id === focusId);
        const planetGroup = bodyRefs.current?.[focusId];
        const sunGroup = bodyRefs.current?.home;
        const isRevealed = radarStateRef.current?.isComplete !== false;
        if (!planet || !planetGroup || !sunGroup || !isRevealed) {
            svg.style.visibility = "hidden";
            return;
        }

        const body = projectBody(planetGroup, planet.radius, camera, size);
        const star = projectBody(sunGroup, sun.radius, camera, size);
        if (body.behind) {
            svg.style.visibility = "hidden";
            return;
        }

        const hasReticle = isEditorMode && visuals.showSelectionGlow !== false;
        // a tilted ring reads as an ellipse, so the marks tuck partway inside its full radius
        const reach = planet.ring
            ? 1 + (planet.ring.outerRadius / planet.radius - 1) * 0.55
            : hasReticle
                ? 1.45
                : 1;

        const parts = (cache.current ??= createCalloutParts(svg));
        const label = `${planet.id.charAt(0).toUpperCase()}${planet.id.slice(1)} \u00b7 \u00d8 ${(planet.radius * 2).toFixed(1)}`;
        parts.setText("name", label);

        const isNarrow = size.width <= 960;
        const layout = layoutCallout({
            sun: star,
            planet: body,
            edge: body.r * reach,
            width: size.width,
            height: size.height,
            nameWidth: parts.nameWidth(),
            // narrow screens keep the Studio button (or toolbar) across the top
            topInset: isNarrow ? 84 : 24,
            previous: placed.current?.id === focusId ? placed.current.placement : undefined,
            // on narrow screens something always fills the space below: the plate, or the studio's sheet
            preferAbove: isNarrow && (!isEditorMode || document.body.dataset.inspector === "open"),
        });

        placed.current = { id: focusId, placement: layout.placement };

        svg.style.visibility = "visible";
        parts.set("dimension-start", "d", layout.dimensionStart);
        parts.set("dimension-end", "d", layout.dimensionEnd);
        parts.setText(
            "distance",
            layout.distance ? `${((planet.orbitRadius ?? 0) / ORBIT_UNITS_PER_AU).toFixed(2)} AU` : ""
        );
        if (layout.distance) {
            parts.set("distance", "x", layout.distance.x.toFixed(1));
            parts.set("distance", "y", layout.distance.y.toFixed(1));
        }
        parts.set("leader", "d", layout.leader);
        parts.set("node", "cx", layout.node.x.toFixed(1));
        parts.set("node", "cy", layout.node.y.toFixed(1));
        parts.set("name", "x", layout.name.x.toFixed(1));
        parts.set("name", "y", layout.name.y.toFixed(1));
    });

    return null;
}

export default CalloutTracker;
