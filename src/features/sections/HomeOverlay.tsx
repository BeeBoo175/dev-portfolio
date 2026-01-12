import { useEffect, useLayoutEffect, useRef } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { ALL_SECTIONS, PATH_TO_ID, SECTION_MAP } from "./data";
import type { SectionId } from "./types";
import "./HomeOverlay.css";

const PROGRAMMATIC_SCROLL_FAILSAFE_MS = 1500;

export interface HomeOverlayProps {
    onFocusChange: (id: SectionId) => void;
    registerTrigger: (fn: (id: SectionId) => void) => void;
}

function HomeOverlay({ onFocusChange, registerTrigger }: HomeOverlayProps) {
    const navigate = useNavigate();
    const location = useLocation();
    const sectionRefs = useRef<Record<string, HTMLElement | null>>({});
    const hasMounted = useRef(false);
    const isProgrammaticScroll = useRef(false);
    const failsafeTimeout = useRef<ReturnType<typeof setTimeout> | null>(null);

    useLayoutEffect(() => {
        if (hasMounted.current) return;
        hasMounted.current = true;

        if ("scrollRestoration" in window.history) {
            window.history.scrollRestoration = "manual";
        }

        const initialId = PATH_TO_ID[location.pathname] ?? "home";
        sectionRefs.current[initialId]?.scrollIntoView({ behavior: "auto" });
        onFocusChange(initialId);
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    useEffect(() => {
        const observer = new IntersectionObserver(
            (entries) => {
                if (isProgrammaticScroll.current) return;

                const visible = entries
                    .filter((entry) => entry.isIntersecting)
                    .sort((a, b) => b.intersectionRatio - a.intersectionRatio)[0];

                if (visible) {
                    const id = visible.target.id as SectionId;
                    onFocusChange(id);

                    const path = SECTION_MAP[id]?.path;
                    if (path && path !== location.pathname) {
                        navigate(path, { replace: true });
                    }
                }
            },
            { threshold: 0.6 }
        );

        Object.values(sectionRefs.current).forEach((el) => {
            if (el) observer.observe(el);
        });

        return () => observer.disconnect();
    }, [onFocusChange, navigate, location.pathname]);

    useEffect(() => {
        const clearFailsafe = () => {
            if (failsafeTimeout.current) {
                clearTimeout(failsafeTimeout.current);
                failsafeTimeout.current = null;
            }
        };

        const handleScrollEnd = () => {
            isProgrammaticScroll.current = false;
            clearFailsafe();
        };

        window.addEventListener("scrollend", handleScrollEnd);
        return () => {
            window.removeEventListener("scrollend", handleScrollEnd);
            clearFailsafe();
        };
    }, []);

    useEffect(() => {
        registerTrigger((id: SectionId) => {
            isProgrammaticScroll.current = true;
            onFocusChange(id);

            if (failsafeTimeout.current) {
                clearTimeout(failsafeTimeout.current);
            }
            failsafeTimeout.current = setTimeout(() => {
                isProgrammaticScroll.current = false;
                failsafeTimeout.current = null;
            }, PROGRAMMATIC_SCROLL_FAILSAFE_MS);

            sectionRefs.current[id]?.scrollIntoView({ behavior: "smooth" });

            const section = SECTION_MAP[id];
            if (section) {
                navigate(section.path);
            }
        });
    }, [registerTrigger, navigate, onFocusChange]);

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
        </div>
    );
}

export default HomeOverlay;