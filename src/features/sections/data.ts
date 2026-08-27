import type { SectionMeta, SectionId } from "./types";

export const HOME_SECTION: SectionMeta = {
    id: "home",
    label: "Home",
    path: "/",
    color: "#ffd76b",
};

export const PLANET_SECTIONS: SectionMeta[] = [
    { id: "about", label: "About", path: "/about", color: "#5da9ff" },
    { id: "skills", label: "Skills", path: "/skills", color: "#ffb15d" },
    { id: "projects", label: "Projects", path: "/projects", color: "#7dff9c" },
    { id: "contact", label: "Contact", path: "/contact", color: "#ff5d8f" },
];

export const ALL_SECTIONS: SectionMeta[] = [HOME_SECTION, ...PLANET_SECTIONS];

export const SECTION_MAP: Record<string, SectionMeta> = Object.fromEntries(
    ALL_SECTIONS.map((section) => [section.id, section])
);

export const PATH_TO_ID: Record<string, SectionId> = Object.fromEntries(
    ALL_SECTIONS.map((section) => [section.path, section.id])
) as Record<string, SectionId>;