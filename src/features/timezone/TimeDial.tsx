import type { CSSProperties } from "react";
import { Moon, Sun } from "lucide-react";
import { lapDegrees } from "./dialLap";

const CENTRE = 70;
const ORBIT = 58;
/** How far the sun and moon sit from the centre: well inside the largest marker's inner edge. */
const SKY = 27;

/** Noon sits at the top and midnight at the bottom; the hands move clockwise. */
function pointAt(hours: number) {
    const angle = ((hours - 12) / 24) * 2 * Math.PI;
    return { x: CENTRE + ORBIT * Math.sin(angle), y: CENTRE - ORBIT * Math.cos(angle) };
}

const lapStyle = (hours: number) => ({ "--lap": `${-lapDegrees(hours)}deg` }) as CSSProperties;

export interface TimeDialProps {
    myHours: number;
    yourHours: number;
    /** Your offset minus mine, in hours. The label and arc follow it, to agree with the sentence beside them. */
    difference: number;
}

/** A 24-hour orbit with both of us on it. The text beside it says the same, so it is hidden from readers. */
export function TimeDial({ myHours, yourHours, difference }: TimeDialProps) {
    const me = pointAt(myHours);
    const you = pointAt(yourHours);
    const apart = Math.round(Math.abs(difference) * 100) / 100;
    // a full day or more laps the dial, so only the remainder is drawn
    const arc = apart % 24;

    return (
        <svg className="time-dial" viewBox="0 0 140 140" aria-hidden="true">
            <path className="time-dial__night" d={`M ${CENTRE + ORBIT} ${CENTRE} A ${ORBIT} ${ORBIT} 0 0 1 ${CENTRE - ORBIT} ${CENTRE}`} />
            <path className="time-dial__day" pathLength={1} d={`M ${CENTRE - ORBIT} ${CENTRE} A ${ORBIT} ${ORBIT} 0 0 1 ${CENTRE + ORBIT} ${CENTRE}`} />
            {arc > 0 && (
                <path className="time-dial__gap" pathLength={1} d={`M ${me.x} ${me.y} A ${ORBIT} ${ORBIT} 0 ${arc > 12 ? 1 : 0} ${difference > 0 ? 1 : 0} ${you.x} ${you.y}`} />
            )}
            <Sun className="time-dial__sky" x={CENTRE - 7} y={CENTRE - SKY - 7} size={14} />
            <Moon className="time-dial__sky" x={CENTRE - 7} y={CENTRE + SKY - 7} size={14} />
            <text className="time-dial__value" x={CENTRE} y={CENTRE + 5}>
                {apart === 0 ? "in sync" : `${apart}h apart`}
            </text>
            <g className="time-dial__hand" style={lapStyle(myHours)}>
                <circle className="time-dial__me" cx={me.x} cy={me.y} r={5.5} />
            </g>
            <g className="time-dial__hand" style={lapStyle(yourHours)}>
                <circle className="time-dial__you" cx={you.x} cy={you.y} r={9} />
            </g>
        </svg>
    );
}

export default TimeDial;
