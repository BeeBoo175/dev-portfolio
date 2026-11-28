import { PROJECTS, getProjectPath } from "../projects/data";
import type { SectionId } from "./types";
import { getComposeLinks } from "./composeLinks";

export interface PlateContent {
    title: string;
    body?: string;
    /** What a recruiter should see first. */
    availability?: string;
    rows?: { label: string; value: string }[];
    /** Dated entries, newest first. */
    history?: { when: string; title: string; detail: string }[];
    links?: { slug: string; label: string; detail: string; to: string; statusUrl?: string }[];
    /** An address the visitor can copy with one press. */
    copy?: string;
    /** Places to start writing that email. */
    compose?: { id: "gmail" | "outlook"; label: string; href: string }[];
    /** A page of mine on another site. */
    profile?: { label: string; href: string };
    /** Shows where I live, and my clock beside the visitor’s. */
    whereabouts?: boolean;
}

const EMAIL = "xiaoqinhew@gmail.com";
const GITHUB = { label: "GitHub", href: "https://github.com/BeeBoo175" };

/** Copy for each home plate. */
export const PLATE_CONTENT: Record<SectionId, PlateContent> = {
    home: {
        title: "Hello, I’m Hew Xiao Qin.",
        availability: "Looking for an entry-level role, remote or on-site.",
        rows: [
            { label: "Studied", value: "Computer Science (AI), APU, CGPA 3.5" },
            { label: "Builds with", value: "React, TypeScript, .NET, Python" },
            { label: "Speaks", value: "English, Mandarin, Malay" },
        ],
        profile: GITHUB,
        whereabouts: true,
    },
    about: {
        title: "About",
        body: "Where I’ve studied, worked and competed.",
        history: [
            {
                when: "2021 to 2026",
                title: "Asia Pacific University",
                detail: "Computer Science (Artificial Intelligence), honours.",
            },
            {
                when: "2024, 4 months",
                title: "Intern, AppAsia Berhad",
                detail: "Maintained Laravel sites for Malaysian news outlets, including China Press, Sin Chew and iLifePost, and helped build their Chinese New Year editions.",
            },
            {
                when: "2024",
                title: "Roboroarz International",
                detail: "First place in the robotics competition, as part of a team.",
            },
        ],
    },
    skills: {
        title: "Skills",
        body: "What I’ve used in projects, study and work.",
        rows: [
            { label: "Web", value: "TypeScript, JavaScript, React, Next.js, Vite, HTML, CSS" },
            { label: "Back end", value: "C#, .NET, ASP.NET Core, PHP, Laravel, PostgreSQL" },
            { label: "Machine learning", value: "Python, PyTorch, ONNX, pandas, scikit-learn, R" },
            { label: "3D and systems", value: "Three.js, Rust, C, Node.js" },
            { label: "Testing", value: "xUnit, Playwright, Vitest, pytest" },
            { label: "Design", value: "Figma" },
        ],
    },
    projects: {
        title: "Projects",
        body: "Pick one to see how it was made.",
        links: PROJECTS.map((project) => ({
            slug: project.slug,
            label: project.name,
            detail: project.headline,
            to: getProjectPath(project),
            statusUrl: project.statusUrl,
        })),
    },
    contact: {
        title: "Contact",
        body: "Email is the best way to reach me. I’m open to remote and on-site roles.",
        copy: EMAIL,
        compose: getComposeLinks(EMAIL),
        profile: GITHUB,
    },
};
