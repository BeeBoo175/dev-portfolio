import { useId } from "react";
import { useGalaxyAsteroidBelt, useGalaxyPlanets, useGalaxySun } from "../store";
import { CHART, layoutChart, type ChartBody } from "../utils/chartLayout";
import { AlertIcon } from "../../../components/ui/Icons";
import "./StarChart.css";

export interface StarChartProps {
    focusId: string;
    onSelect?: (id: string) => void;
    /** Why this is on screen in place of the 3D scene. */
    caption: string;
    /** Set inside a page’s own flow, for narrow screens, instead of beside it. */
    inline?: boolean;
}

interface BodyProps {
    body: ChartBody;
    selected: boolean;
    shadeId: string;
    onSelect?: (id: string) => void;
}

function Body({ body, selected, shadeId, onSelect }: BodyProps) {
    return (
        <g
            className={`star-chart__body ${selected ? "star-chart__body--selected" : ""}`}
            onClick={() => onSelect?.(body.id)}
        >
            {/* a generous, invisible target round small bodies */}
            <circle className="star-chart__target" cx={body.x} cy={body.y} r={Math.max(24, body.r + 8)} />
            {body.ringColor && (
                <ellipse
                    className="star-chart__ring"
                    cx={body.x}
                    cy={body.y}
                    rx={body.r * 1.75}
                    ry={body.r * 0.5}
                    stroke={body.ringColor}
                    transform={`rotate(-18 ${body.x} ${body.y})`}
                />
            )}
            <circle className="star-chart__disc" cx={body.x} cy={body.y} r={body.r} fill={body.color} />
            <circle className="star-chart__shade" cx={body.x} cy={body.y} r={body.r} fill={`url(#${shadeId})`} />
            {selected && <circle className="star-chart__mark" cx={body.x} cy={body.y} r={body.r + 9} />}
            <text className="star-chart__label" x={body.x} y={body.y + body.r + 20}>
                {body.label}
            </text>
        </g>
    );
}

/** The solar system as an atlas plate: what visitors see when the 3D scene can't be drawn. */
export function StarChart({ focusId, onSelect, caption, inline = false }: StarChartProps) {
    // two charts can be in the page at once, and a hidden one must not own the shading
    const shadeId = useId();
    const { sun, planets, belt } = layoutChart(useGalaxySun(), useGalaxyPlanets(), useGalaxyAsteroidBelt());

    return (
        <div className={`star-chart ${inline ? "star-chart--inline" : ""}`}>
            <figure className="star-chart__figure">
                <svg viewBox={`0 0 ${CHART.width} ${CHART.height}`} aria-hidden="true">
                    <defs>
                        <radialGradient id={shadeId} cx="0.35" cy="0.3" r="0.8">
                            <stop offset="0.45" stopColor="#000" stopOpacity="0" />
                            <stop offset="1" stopColor="#000" stopOpacity="0.38" />
                        </radialGradient>
                    </defs>
                    {planets.map((planet) => (
                        <ellipse
                            key={planet.id}
                            className={`star-chart__orbit ${focusId === planet.id ? "star-chart__orbit--selected" : ""}`}
                            cx={CHART.x}
                            cy={CHART.y}
                            rx={planet.orbit.rx}
                            ry={planet.orbit.ry}
                        />
                    ))}
                    {belt && <ellipse className="star-chart__belt" cx={CHART.x} cy={CHART.y} rx={belt.rx} ry={belt.ry} />}
                    <circle className="star-chart__corona" cx={sun.x} cy={sun.y} r={sun.r + 16} fill={sun.color} />
                    <Body body={sun} shadeId={shadeId} selected={focusId === "home" || focusId === "sun"} onSelect={onSelect} />
                    {planets.map((planet) => (
                        <Body key={planet.id} body={planet} shadeId={shadeId} selected={focusId === planet.id} onSelect={onSelect} />
                    ))}
                </svg>
                <figcaption role="status">
                    <AlertIcon />
                    <span>{caption}</span>
                </figcaption>
            </figure>
        </div>
    );
}

export default StarChart;
