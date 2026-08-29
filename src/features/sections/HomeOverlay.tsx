import { useMemo } from "react";
import * as THREE from "three";
import { useGalaxySun } from "../galaxy";
import { ALL_SECTIONS } from "./data";
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

    const sunStyle = useMemo(() => {
        const baseHex = sun.color || "#ffe59e";
        const peakHex = sun.palette?.peak || "#fffbeb";
        const baseColor = new THREE.Color(baseHex);
        const peakColor = new THREE.Color(peakHex);

        const lightColor = baseColor.clone().offsetHSL(0, -0.04, 0.08);
        const darkColor = baseColor.clone().multiplyScalar(0.92);

        const r = Math.round(baseColor.r * 255);
        const g = Math.round(baseColor.g * 255);
        const b = Math.round(baseColor.b * 255);

        const luminance = 0.299 * baseColor.r + 0.587 * baseColor.g + 0.114 * baseColor.b;
        const iconColor = luminance > 0.55 ? "#1a0b02" : "#ffffff";

        return {
            "--sun-specular": `#${peakColor.getHexString()}`,
            "--sun-light": `#${lightColor.getHexString()}`,
            "--sun-base": `#${baseColor.getHexString()}`,
            "--sun-dark": `#${darkColor.getHexString()}`,
            "--sun-glow-rgb": `${r}, ${g}, ${b}`,
            "--sun-icon-color": iconColor,
        } as React.CSSProperties;
    }, [sun.color, sun.palette?.peak]);

    return (
        <div className="sections-overlay">
            {ALL_SECTIONS.map((section) => (
                <section
                    key={section.id}
                    id={section.id}
                    ref={(el) => {
                        sectionRefs.current[section.id] = el;
                    }}
                    className={`sections-overlay__section sections-overlay__section--${section.id}`}
                >
                    <div className="sections-overlay__card">
                        <h1 className="sections-overlay__title">{section.label}</h1>
                        <p className="sections-overlay__subtitle">
                            Scroll or click a planet to explore.
                        </p>
                    </div>
                </section>
            ))}

            <button
                type="button"
                className={`scroll-to-top ${showScrollTop ? "scroll-to-top--visible" : ""}`}
                onClick={scrollToTop}
                aria-label="Back to top"
                title="Back to top"
                style={sunStyle}
            >
                <span className="scroll-to-top__corona" aria-hidden="true" />
                <span className="scroll-to-top__rays" aria-hidden="true" />
                <span className="scroll-to-top__core" aria-hidden="true">
                    <svg
                        className="scroll-to-top__icon"
                        width="18"
                        height="18"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="2.75"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        aria-hidden="true"
                    >
                        <line x1="12" y1="19" x2="12" y2="5" />
                        <polyline points="5 12 12 5 19 12" />
                    </svg>
                </span>
            </button>
        </div>
    );
}

export default HomeOverlay;