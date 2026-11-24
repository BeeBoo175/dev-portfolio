/** The faces the first screen is set in. */
const FACES = [
    'italic 400 1em "Instrument Serif"',
    '400 1em "Hanken Grotesk"',
    '600 1em "Hanken Grotesk"',
    '400 1em "DM Mono"',
    '500 1em "DM Mono"',
];

/**
 * Resolves when the fonts are usable, so the first layout is the final one. They are preloaded, so
 * this is normally immediate; the limit keeps a slow or failed font from holding the page back.
 */
export function fontsReady(limitMs = 1200): Promise<unknown> {
    if (!document.fonts?.load) return Promise.resolve();
    const loaded = Promise.allSettled(FACES.map((face) => document.fonts.load(face)));
    return Promise.race([loaded, new Promise((resolve) => setTimeout(resolve, limitMs))]);
}
