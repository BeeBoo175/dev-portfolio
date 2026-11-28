export interface ProjectSection {
    heading: string;
    paragraphs: string[];
}

export interface Project {
    slug: string;
    name: string;
    /** The short line beside the name in the project list. */
    headline: string;
    summary: string;
    builtWith: { group: string; tools: string[] }[];
    sections: ProjectSection[];
    /** Scope or ownership caveat shown at the end of the page. */
    note: string;
    /** Where the live demo reports which of its parts are ready, waking or down. */
    statusUrl?: string;
    /** The live demo itself. */
    demoUrl?: string;
}

/** Outline for a project that is still being built: one placeholder line under each heading. */
const unfinishedSections = (headings: string[]): ProjectSection[] =>
    headings.map((heading) => ({ heading, paragraphs: ["Placeholder while this part is in progress."] }));

/** Facts come from each project's own manifests, documents and training code. */
export const PROJECTS: Project[] = [
    {
        slug: "apexauto",
        name: "ApexAuto",
        headline: "Next.js and .NET",
        summary:
            "A web system for a used car dealership. Customers use it to buy and sell cars, and staff use it to run the work behind each one.",
        builtWith: [
            { group: "Front end", tools: ["Next.js", "React", "TypeScript", "CSS Modules", "Recharts"] },
            { group: "Back end", tools: ["C#", ".NET 10", "ASP.NET Core", "Entity Framework Core", "ASP.NET Identity"] },
            { group: "Data and files", tools: ["PostgreSQL", "S3-compatible storage", "QuestPDF", "SkiaSharp"] },
            { group: "Tooling", tools: ["Docker Compose", "Mailpit", "xUnit", "Playwright", "Serilog"] },
        ],
        sections: [
            {
                heading: "Why I built it",
                paragraphs: [
                    "It started as a university project I wrote in Java. I rebuilt it with web technologies and .NET to learn how to build a more robust enterprise application, one with more moving parts.",
                ],
            },
            {
                heading: "What it does",
                paragraphs: [
                    "Buyers browse inspected cars, reserve one with a deposit that holds it for 48 hours, and book test drives. Sellers upload photos, get an estimated value and book a trade-in appointment.",
                    "Staff have dashboards for intake, workshop inspection and repairs, listings, sales and delivery. What someone can do depends on their role and branch, and the server checks it.",
                ],
            },
            {
                heading: "The moving parts",
                paragraphs: [
                    "Each car keeps one record from intake to sale, including a signed 210-point inspection and a history that shows who did what. Around that record are the API, the database, file storage for photos, email and generated PDF documents.",
                ],
            },
        ],
        note: "Still in development. It runs on demo data and is not a real dealership.",
        statusUrl: "https://apexauto-two.vercel.app/api/readiness",
        demoUrl: "https://apexauto-two.vercel.app",
    },
    {
        slug: "suika-bot",
        name: "Suika Bot",
        headline: "Model training in PyTorch",
        summary:
            "I trained a model to play suika.world, a fruit merging game. Training it is the main part of the project.",
        builtWith: [
            { group: "Training", tools: ["Python", "PyTorch", "NumPy", "ONNX"] },
            { group: "Simulation", tools: ["Rapier physics", "Rust", "PyO3", "Rayon", "Node.js"] },
            { group: "In the browser", tools: ["TypeScript", "ONNX Runtime Web", "Vite showcase site"] },
            { group: "Testing", tools: ["pytest", "Ruff", "Vitest"] },
        ],
        sections: unfinishedSections([
            "What it has to learn",
            "Training pipeline",
            "The network",
            "Making it fast enough",
            "Deciding what works",
            "Results",
        ]),
        note: "Still in progress. An unofficial fan project, not affiliated with or endorsed by Suika World. The watermelon artwork belongs to Suika World.",
    },
];

export function findProject(slug: string | undefined): Project | undefined {
    return PROJECTS.find((project) => project.slug === slug);
}

export const getProjectPath = (project: Project) => `/projects/${project.slug}`;
