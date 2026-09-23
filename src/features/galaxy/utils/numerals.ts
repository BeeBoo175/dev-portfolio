const BODY_NUMERALS: Record<string, string> = {
    home: "I",
    sun: "I",
    about: "II",
    skills: "III",
    projects: "IV",
    contact: "V",
    "asteroid-belt": "VI",
};

/** Plate numeral for a celestial body; empty for moons and unknown ids. */
export function getBodyNumeral(id: string): string {
    return BODY_NUMERALS[id] ?? "";
}
