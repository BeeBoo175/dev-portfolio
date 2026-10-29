import { describe, expect, it } from "vitest";
import { PROJECTS, findProject, getProjectPath } from "./data";

describe("projects", () => {
    it("gives every project a unique, resolvable route", () => {
        const slugs = PROJECTS.map((project) => project.slug);
        expect(new Set(slugs).size).toBe(slugs.length);
        for (const project of PROJECTS) {
            expect(getProjectPath(project)).toBe(`/projects/${project.slug}`);
            expect(findProject(project.slug)).toBe(project);
        }
    });

    it("returns nothing for an unknown slug", () => {
        expect(findProject("nope")).toBeUndefined();
        expect(findProject(undefined)).toBeUndefined();
    });
});
