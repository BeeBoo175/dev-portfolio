/** Apart from colorUtils so the flat chart can use it without loading three.js. */
export function resolveCelestialBodyColor(
    body: { color?: string; palette?: { land?: string; coast?: string; water?: string; peak?: string } },
    overrideColor?: string,
    defaultFallback = "#5da9ff"
): string {
    return (
        overrideColor ??
        body.palette?.land ??
        body.palette?.coast ??
        body.palette?.water ??
        body.palette?.peak ??
        body.color ??
        defaultFallback
    );
}
