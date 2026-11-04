export const MY_TIME_ZONE = "Asia/Kuala_Lumpur";

/** Minutes ahead of UTC at that instant. With no zone given, the visitor's own. */
export function getUtcOffsetMinutes(date: Date, timeZone?: string): number {
    const parts = new Intl.DateTimeFormat("en-US", {
        timeZone,
        hourCycle: "h23",
        year: "numeric",
        month: "numeric",
        day: "numeric",
        hour: "numeric",
        minute: "numeric",
        second: "numeric",
    }).formatToParts(date);
    const read = (type: Intl.DateTimeFormatPartTypes) => Number(parts.find((part) => part.type === type)?.value);
    const wallClock = Date.UTC(read("year"), read("month") - 1, read("day"), read("hour"), read("minute"), read("second"));
    // "|| 0" turns a rounded -0 into 0
    return Math.round((wallClock - date.getTime()) / 60000) || 0;
}

/** Clock time as a fraction of hours, 0 up to 24, at a given offset. */
export function getLocalHours(date: Date, offsetMinutes: number): number {
    const local = new Date(date.getTime() + offsetMinutes * 60000);
    return local.getUTCHours() + local.getUTCMinutes() / 60;
}

export const isDaytime = (hours: number) => hours >= 6 && hours < 18;

const plural = (count: number, unit: string) => `${count} ${unit}${count === 1 ? "" : "s"}`;

export function formatUtcOffset(minutes: number): string {
    if (minutes === 0) return "UTC";
    const total = Math.abs(minutes);
    const rest = total % 60;
    return `UTC${minutes > 0 ? "+" : "−"}${Math.floor(total / 60)}${rest ? `:${String(rest).padStart(2, "0")}` : ""}`;
}

/** Both arguments are minutes ahead of UTC. */
export function describeDifference(mine: number, yours: number): string {
    const difference = yours - mine;
    if (difference === 0) return "You’re on the same time as me.";
    const total = Math.abs(difference);
    const hours = Math.floor(total / 60);
    const minutes = total % 60;
    const amount = [hours && plural(hours, "hour"), minutes && plural(minutes, "minute")].filter(Boolean).join(" ");
    return `You’re ${amount} ${difference > 0 ? "ahead of" : "behind"} me.`;
}
