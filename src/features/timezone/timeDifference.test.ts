import { describe, expect, it } from "vitest";
import { MY_TIME_ZONE, describeDifference, formatUtcOffset, getLocalHours, getUtcOffsetMinutes, isDaytime } from "./timeDifference";

describe("time difference", () => {
    const winter = new Date("2026-01-15T12:00:00.500Z");
    const summer = new Date("2026-07-15T23:30:00Z");

    it("reads zone offsets, following daylight saving", () => {
        expect(getUtcOffsetMinutes(winter, MY_TIME_ZONE)).toBe(480);
        expect(getUtcOffsetMinutes(summer, MY_TIME_ZONE)).toBe(480);
        expect(getUtcOffsetMinutes(winter, "Europe/London")).toBe(0);
        expect(getUtcOffsetMinutes(summer, "Europe/London")).toBe(60);
        expect(getUtcOffsetMinutes(winter, "Asia/Kolkata")).toBe(330);
    });

    it("places an instant on a 24-hour day", () => {
        expect(getLocalHours(winter, 480)).toBe(20);
        expect(getLocalHours(winter, 330)).toBe(17.5);
        expect(getLocalHours(summer, 480)).toBe(7.5);
        expect([isDaytime(5.9), isDaytime(6), isDaytime(17.9), isDaytime(18)]).toEqual([false, true, true, false]);
    });

    it("formats offsets", () => {
        expect(formatUtcOffset(480)).toBe("UTC+8");
        expect(formatUtcOffset(330)).toBe("UTC+5:30");
        expect(formatUtcOffset(-240)).toBe("UTC−4");
        expect(formatUtcOffset(0)).toBe("UTC");
    });

    it("describes how far apart two clocks are", () => {
        expect(describeDifference(480, 480)).toBe("You’re on the same time as me.");
        expect(describeDifference(480, 0)).toBe("You’re 8 hours behind me.");
        expect(describeDifference(480, 540)).toBe("You’re 1 hour ahead of me.");
        expect(describeDifference(480, 330)).toBe("You’re 2 hours 30 minutes behind me.");
        expect(describeDifference(480, 525)).toBe("You’re 45 minutes ahead of me.");
    });
});
