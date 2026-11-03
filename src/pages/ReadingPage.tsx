import { useCallback, useEffect, useMemo, type ReactNode } from "react";
import { useNavigate } from "react-router-dom";
import { galaxyStore, useGalaxyViewport } from "../features/galaxy";
import { ALL_SECTIONS, SECTION_MAP, type SectionId } from "../features/sections";
import { DockedNavigation } from "../components/navigation";

export interface ReadingPageProps {
    /** The planet in view, and the dock item shown as current. */
    sectionId: SectionId;
    /** Where Escape leads. */
    escapeTo: string;
    children: ReactNode;
}

export function ReadingPage({ sectionId, escapeTo, children }: ReadingPageProps) {
    const navigate = useNavigate();
    const { setFocusId, registerSelectHandler } = useGalaxyViewport();

    useEffect(() => {
        galaxyStore.revertToPersisted();
        setFocusId(sectionId);
    }, [sectionId, setFocusId]);

    const goToSection = useCallback(
        (id: string) => {
            const section = SECTION_MAP[id];
            if (section) navigate(section.path);
        },
        [navigate]
    );

    useEffect(() => registerSelectHandler(goToSection), [registerSelectHandler, goToSection]);

    useEffect(() => {
        const handleEscape = (event: KeyboardEvent) => {
            if (event.key === "Escape") navigate(escapeTo);
        };
        window.addEventListener("keydown", handleEscape);
        return () => window.removeEventListener("keydown", handleEscape);
    }, [escapeTo, navigate]);

    const navTargets = useMemo(
        () => ALL_SECTIONS.map((section) => ({ id: section.id, label: section.label })),
        []
    );

    return (
        <>
            {children}
            <DockedNavigation targets={navTargets} selectedId={sectionId} onSelectTarget={goToSection} />
        </>
    );
}

export default ReadingPage;
