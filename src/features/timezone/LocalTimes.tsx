import { useEffect, useRef, useState } from "react";
import {
    MY_TIME_ZONE,
    describeDifference,
    formatUtcOffset,
    getLocalHours,
    getUtcOffsetMinutes,
    isDaytime,
} from "./timeDifference";
import { TimeDial } from "./TimeDial";
import { useFirstAppearance } from "./useFirstAppearance";
import { useSceneSettled } from "../galaxy/sceneStatus";
import "./LocalTimes.css";

interface ClockProps {
    who: "me" | "you";
    label: string;
    now: Date;
    offset: number;
    timeZone?: string;
}

function Clock({ who, label, now, offset, timeZone }: ClockProps) {
    return (
        <div className={`local-times__clock local-times__clock--${who}`}>
            <dt>{label}</dt>
            <dd>
                <time className="local-times__time" dateTime={now.toISOString()}>
                    {now.toLocaleTimeString(undefined, { timeZone, hour: "2-digit", minute: "2-digit", second: "2-digit" })}
                </time>
                <span>
                    {now.toLocaleDateString(undefined, { timeZone, weekday: "short" })}{" "}
                    {isDaytime(getLocalHours(now, offset)) ? "daytime" : "night"}, {formatUtcOffset(offset)}
                </span>
            </dd>
        </div>
    );
}

/** My clock in Malaysia against the visitor's, ticking once a second. */
export function LocalTimes() {
    const [now, setNow] = useState(() => new Date());

    const ref = useRef<HTMLDivElement>(null);
    const appearance = useFirstAppearance(ref, useSceneSettled());

    useEffect(() => {
        const interval = setInterval(() => setNow(new Date()), 1000);
        return () => clearInterval(interval);
    }, []);

    const mine = getUtcOffsetMinutes(now, MY_TIME_ZONE);
    const yours = getUtcOffsetMinutes(now);

    return (
        <div ref={ref} className={`local-times local-times--${appearance}`}>
            <dl className="local-times__clocks">
                <Clock who="me" label="My time" now={now} offset={mine} timeZone={MY_TIME_ZONE} />
                <Clock who="you" label="Your time" now={now} offset={yours} />
            </dl>
            <TimeDial myHours={getLocalHours(now, mine)} yourHours={getLocalHours(now, yours)} difference={(yours - mine) / 60} />
            <p className="local-times__difference">{describeDifference(mine, yours)}</p>
        </div>
    );
}

export default LocalTimes;
