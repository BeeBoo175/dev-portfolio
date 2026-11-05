/** Where 9 o'clock falls on the 24-hour dial, in degrees clockwise from the top. */
const NINE_OCLOCK = 270;

/**
 * How far a marker travels on entrance: it leaves 9 o'clock, makes one full turn, and carries on
 * clockwise to its own hour. Noon is at the top of the dial.
 */
export function lapDegrees(hours: number): number {
    const target = (hours - 12) * 15;
    return 360 + ((((target - NINE_OCLOCK) % 360) + 360) % 360);
}
