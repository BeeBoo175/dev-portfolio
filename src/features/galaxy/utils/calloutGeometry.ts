export interface ScreenCircle {
    x: number;
    y: number;
    r: number;
}

export interface CalloutInput {
    sun: ScreenCircle;
    planet: ScreenCircle;
    /** On-screen radius of whatever surrounds the planet (rings, reticle). */
    edge: number;
    width: number;
    height: number;
    /** Rendered width of the name text. */
    nameWidth: number;
    /** Force the name above the planet, e.g. when a bottom sheet covers the lower half. */
    preferAbove?: boolean;
    /** Where the name went last frame. It stays there until that choice is clearly wrong. */
    previous?: CalloutPlacement;
    /** Highest the shelf of a right-hand name may go, to clear the control in the top right corner. */
    topInset?: number;
}

export interface CalloutPlacement {
    side: 1 | -1;
    vertical: 1 | -1;
}

export interface CalloutLayout {
    /** Sun-to-planet radius line, split so the distance reads level in the gap. Empty when too short. */
    dimensionStart: string;
    dimensionEnd: string;
    distance: { x: number; y: number } | null;
    leader: string;
    node: { x: number; y: number };
    name: { x: number; y: number };
    placement: CalloutPlacement;
}

/** Pixels a limit must be passed by before the name moves, so a trembling planet can't flip it. */
const SLACK = 28;
/** Highest any shelf goes. */
const TOP_EDGE = 24;
/** The least the leader climbs or drops, so the underline never runs through its own dot. */
const MIN_RISE = 22;
const GAP = 8;
const SHELF = 30;
const MARGIN = 6;

export function layoutCallout({
    sun,
    planet,
    edge,
    width,
    height,
    nameWidth,
    preferAbove = false,
    previous,
    topInset = TOP_EDGE,
}: CalloutInput): CalloutLayout {
    const angle = Math.atan2(planet.y - sun.y, planet.x - sun.x);
    const ux = Math.cos(angle);
    const uy = Math.sin(angle);
    const x1 = sun.x + ux * (sun.r + GAP);
    const y1 = sun.y + uy * (sun.r + GAP);
    const x2 = planet.x - ux * (edge + GAP);
    const y2 = planet.y - uy * (edge + GAP);
    const length = (x2 - x1) * ux + (y2 - y1) * uy;
    const midX = (x1 + x2) / 2;
    const midY = (y1 + y2) / 2;
    const half = Math.abs(ux) * 36 + Math.abs(uy) * 11;

    let dimensionStart = "";
    let dimensionEnd = "";
    let distance: CalloutLayout["distance"] = null;
    if (length > half * 2 + 24) {
        dimensionStart = `M${x1} ${y1}L${midX - ux * half} ${midY - uy * half}`;
        dimensionEnd = `M${midX + ux * half} ${midY + uy * half}L${x2} ${y2}`;
        distance = { x: midX, y: midY };
    } else if (length > 16) {
        // too short to break: keep the line whole and set the readout beside it
        dimensionStart = `M${x1} ${y1}L${x2} ${y2}`;
        dimensionEnd = dimensionStart;
        const lift = ux * uy > 0 ? -1 : 1;
        distance = { x: midX + Math.abs(uy) * 40 * lift, y: midY - Math.abs(ux) * 16 };
    }

    // bend away from the radius line, unless that would drop the name under a sheet or off screen
    const reach = edge + 2;
    const offset = reach * Math.SQRT1_2;
    const textSpan = nameWidth + 8;
    const rightRoom = width - MARGIN - (planet.x + offset + SHELF + textSpan);
    const leftRoom = planet.x - offset - SHELF - textSpan - MARGIN;
    // the current side may overrun a little (the name is clamped on screen); the other must really fit
    const keeps = previous && (previous.side === 1 ? rightRoom : leftRoom) > -SLACK;
    let side: 1 | -1;
    if (keeps) side = previous.side;
    else if (rightRoom > 0) side = 1;
    else if (leftRoom > 0) side = -1;
    // under a corner control, the free left side is the better one when neither truly fits
    else if (topInset > TOP_EDGE) side = -1;
    else if (previous && Math.abs(planet.x - width / 2) <= SLACK) side = previous.side;
    else side = planet.x < width / 2 ? 1 : -1;

    // each limit leans towards last frame's answer
    const lean = (kept: boolean) => (previous ? (kept ? SLACK : -SLACK) : 0);
    const sunIsBelow = sun.y >= planet.y - lean(previous?.vertical === -1);
    let vertical: 1 | -1 = preferAbove || sunIsBelow ? -1 : 1;
    if (vertical === 1 && planet.y + reach + SHELF > height - 80 + lean(previous?.vertical === 1)) vertical = -1;
    // above only while the line can still rise clear of its starting point under whatever is at the top
    const ceiling = side === 1 ? topInset : TOP_EDGE;
    const surface = planet.r * Math.SQRT1_2;
    if (vertical === -1 && planet.y - surface - ceiling < MIN_RISE - lean(previous?.vertical === -1)) vertical = 1;

    // the dot sits on the planet's own surface; the line then runs out past any ring to the name
    const startX = planet.x + side * surface;
    const startY = planet.y + vertical * surface;
    const outerY = planet.y + vertical * (offset + SHELF);
    const shelfY = vertical === -1 ? Math.max(ceiling, Math.min(outerY, startY - MIN_RISE)) : outerY;
    const elbow = planet.x + side * (offset + SHELF);
    const shelfX =
        side > 0
            ? Math.min(elbow, width - MARGIN - textSpan)
            : Math.max(elbow, MARGIN + textSpan);

    return {
        dimensionStart,
        dimensionEnd,
        distance,
        leader: `M${startX} ${startY}L${shelfX} ${shelfY}h${side * textSpan}`,
        node: { x: startX, y: startY },
        name: { x: side > 0 ? shelfX + 4 : shelfX - textSpan + 4, y: shelfY - 7 },
        placement: { side, vertical },
    };
}
