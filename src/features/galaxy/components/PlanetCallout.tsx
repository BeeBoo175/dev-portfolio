import "./PlanetCallout.css";

/** Screen-space drafting marks for the focused planet. CalloutTracker positions every part. */
export function PlanetCallout({ ref }: { ref: React.Ref<SVGSVGElement> }) {
    return (
        <svg ref={ref} className="planet-callout" aria-hidden="true">
            <defs>
                <marker id="planet-callout-arrow" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="7" markerHeight="7" orient="auto-start-reverse">
                    <path className="planet-callout__arrow" d="M0 0L10 5L0 10z" />
                </marker>
            </defs>
            <path data-part="dimension-start" className="planet-callout__line" markerStart="url(#planet-callout-arrow)" />
            <path data-part="dimension-end" className="planet-callout__line" markerEnd="url(#planet-callout-arrow)" />
            <text data-part="distance" className="planet-callout__text" textAnchor="middle" dominantBaseline="middle" />
            <path data-part="leader" className="planet-callout__line" />
            <circle data-part="node" className="planet-callout__node" r="3" />
            <text data-part="name" className="planet-callout__text" />
        </svg>
    );
}

export default PlanetCallout;
