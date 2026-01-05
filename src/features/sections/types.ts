export type SectionId = "home" | "about" | "skills" | "projects" | "contact";

export interface SectionMeta {
    id: SectionId;
    label: string;
    path: string;
    color: string;
}