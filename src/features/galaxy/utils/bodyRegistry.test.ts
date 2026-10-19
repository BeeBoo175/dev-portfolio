import { describe, expect, it } from "vitest";
import { Group } from "three";
import { createBodyRegistry } from "./bodyRegistry";

describe("createBodyRegistry", () => {
    it("hands out the same callback for a body every time, and records what it is given", () => {
        const registry = createBodyRegistry();
        expect(registry.callbackFor("home")).toBe(registry.callbackFor("home"));
        const sun = new Group();
        registry.callbackFor("home")(sun);
        expect(registry.refs.current.home).toBe(sun);
        expect(registry.refs.current.sun).toBe(sun);
    });
});
