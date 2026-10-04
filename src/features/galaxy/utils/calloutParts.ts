/**
 * Cached handles to the callout's SVG parts. It runs every frame over a WebGL canvas, so it only
 * touches the DOM when a value changes and measures the name only when the text or fonts change.
 */
export interface CalloutParts {
    set: (part: string, attribute: string, value: string) => void;
    setText: (part: string, value: string) => void;
    nameWidth: () => number;
}

export function createCalloutParts(svg: SVGSVGElement): CalloutParts {
    const elements = new Map<string, SVGElement>();
    const written = new Map<string, string>();
    let measured: number | null = null;

    const element = (part: string) => {
        let found = elements.get(part);
        if (!found) {
            found = svg.querySelector<SVGElement>(`[data-part="${part}"]`)!;
            elements.set(part, found);
        }
        return found;
    };

    const changed = (key: string, value: string) => {
        if (written.get(key) === value) return false;
        written.set(key, value);
        return true;
    };

    document.fonts?.ready.then(() => {
        measured = null;
    });

    return {
        set(part, attribute, value) {
            if (changed(`${part}.${attribute}`, value)) element(part).setAttribute(attribute, value);
        },
        setText(part, value) {
            if (!changed(`${part}.text`, value)) return;
            element(part).textContent = value;
            if (part === "name") measured = null;
        },
        nameWidth() {
            // a hidden element measures as 0, so keep trying until there is a real width
            if (!measured) measured = (element("name") as SVGTextElement).getComputedTextLength();
            return measured;
        },
    };
}
