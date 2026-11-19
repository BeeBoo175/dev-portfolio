import { useMemo } from "react";
import { useGalaxySun, useGalaxyViewport, getBodyNumeral, StarChart, useSceneStatus, SCENE_REASONS } from "../galaxy";
import { getSunButtonStyle } from "./sunButtonStyle";
import { ALL_SECTIONS } from "./data";
import { PLATE_CONTENT } from "./content";
import { SectionPlate } from "./SectionPlate";
import { UpIcon } from "../../components/ui/Icons";
import { useSectionScroll } from "./useSectionScroll";
import type { SectionId } from "./types";
import "./HomeOverlay.css";

export interface HomeOverlayProps {
    onFocusChange: (id: SectionId) => void;
    registerTrigger: (fn: (id: SectionId) => void) => void;
}

export function HomeOverlay({ onFocusChange, registerTrigger }: HomeOverlayProps) {
    const { sectionRefs, showScrollTop, scrollToTop } = useSectionScroll({
        onFocusChange,
        registerTrigger,
    });
    const sun = useGalaxySun();
    const { handleSelect } = useGalaxyViewport();
    const scene = useSceneStatus();

    const sunStyle = useMemo(() => getSunButtonStyle(sun.color || "#ffe59e"), [sun.color]);

    return (
        <main className="sections-overlay">
            <div className="sections-overlay__scrim" aria-hidden="true" />

            {ALL_SECTIONS.map((section) => (
                <section
                    key={section.id}
                    id={section.id}
                    ref={(el) => {
                        sectionRefs.current[section.id] = el;
                    }}
                    className={`sections-overlay__section sections-overlay__section--${section.id} ${
                        section.id === "home" && scene !== "ready" ? "sections-overlay__section--flat" : ""
                    }`}
                >
                    {section.id === "home" && scene !== "ready" && (
                        <StarChart
                            inline
                            focusId="home"
                            onSelect={handleSelect}
                            caption={`Flat chart view. ${SCENE_REASONS[scene]}`}
                        />
                    )}
                    <SectionPlate
                        numeral={getBodyNumeral(section.id)}
                        content={PLATE_CONTENT[section.id]}
                        isLead={section.id === "home"}
                    />
                </section>
            ))}

            <button
                type="button"
                className={`scroll-to-top ${showScrollTop ? "scroll-to-top--visible" : ""}`}
                onClick={scrollToTop}
                aria-label="Back to top"
                title="Back to top"
                tabIndex={showScrollTop ? 0 : -1}
                aria-hidden={!showScrollTop}
                style={sunStyle}
            >
                <span className="scroll-to-top__corona" aria-hidden="true" />
                <span className="scroll-to-top__rays" aria-hidden="true" />
                <span className="scroll-to-top__core" aria-hidden="true">
                    <UpIcon className="scroll-to-top__icon" size={18} strokeWidth={2.5} />
                </span>
            </button>
        </main>
    );
}

export default HomeOverlay;