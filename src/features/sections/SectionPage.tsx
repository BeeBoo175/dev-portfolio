import type { SectionMeta } from "./types";

interface SectionPageProps {
    section: SectionMeta;
}

function SectionPage({ section }: SectionPageProps) {
    return (
        <main
            style={{
                minHeight: "100svh",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
            }}
        >
            <h1>{section.label}</h1>
        </main>
    );
}

export default SectionPage;