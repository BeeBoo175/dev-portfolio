import { useEffect, useLayoutEffect, useRef, useState, useCallback } from "react";
import { useLocation, useNavigate, useNavigationType, NavigationType } from "react-router-dom";
import { PATH_TO_ID, SECTION_MAP } from "./data";
import type { SectionId } from "./types";

export const PROGRAMMATIC_SCROLL_FAILSAFE_MS = 1500;
const SCROLL_TOP_THRESHOLD = 300;

export interface UseSectionScrollOptions {
    onFocusChange: (id: SectionId) => void;
    registerTrigger: (fn: (id: SectionId) => void) => void;
}

export function useSectionScroll({ onFocusChange, registerTrigger }: UseSectionScrollOptions) {
    const navigate = useNavigate();
    const location = useLocation();
    const navType = useNavigationType();

    const sectionRefs = useRef<Record<string, HTMLElement | null>>({});
    const hasMounted = useRef(false);
    const isProgrammaticScroll = useRef(false);
    const failsafeTimeout = useRef<ReturnType<typeof setTimeout> | null>(null);

    const [isScrolledPastThreshold, setIsScrolledPastThreshold] = useState(false);

    const targetId = PATH_TO_ID[location.pathname] ?? "home";
    const isNotHomeRoute = location.pathname !== "/" && location.pathname !== "";
    const showScrollTop = isNotHomeRoute || isScrolledPastThreshold;

    const clearFailsafe = useCallback(() => {
        if (failsafeTimeout.current) {
            clearTimeout(failsafeTimeout.current);
            failsafeTimeout.current = null;
        }
    }, []);

    const startProgrammaticScroll = useCallback(
        (targetSectionId: SectionId, behavior: ScrollBehavior = "smooth") => {
            isProgrammaticScroll.current = true;
            clearFailsafe();
            failsafeTimeout.current = setTimeout(() => {
                isProgrammaticScroll.current = false;
                failsafeTimeout.current = null;
            }, PROGRAMMATIC_SCROLL_FAILSAFE_MS);
            sectionRefs.current[targetSectionId]?.scrollIntoView({ behavior });
        },
        [clearFailsafe]
    );

    const scrollToTop = useCallback(() => {
        startProgrammaticScroll("home", "smooth");
        if (location.pathname !== "/") {
            navigate("/");
        }
    }, [location.pathname, navigate, startProgrammaticScroll]);

    useLayoutEffect(() => {
        onFocusChange(targetId);

        if (!hasMounted.current) {
            hasMounted.current = true;
            sectionRefs.current[targetId]?.scrollIntoView({ behavior: "auto" });
        } else if (navType === NavigationType.Pop) {
            startProgrammaticScroll(targetId, "smooth");
        }
    }, [location.pathname, navType, onFocusChange, startProgrammaticScroll, targetId]);

    useEffect(() => {
        const observer = new IntersectionObserver(
            (entries) => {
                if (
                    isProgrammaticScroll.current ||
                    document.documentElement.classList.contains("planet-studio-open")
                ) {
                    return;
                }

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
        const handleScroll = () => {
            const currentScrollY = window.scrollY || document.documentElement.scrollTop;
            setIsScrolledPastThreshold(currentScrollY > SCROLL_TOP_THRESHOLD);
        };

        const handleScrollEnd = () => {
            isProgrammaticScroll.current = false;
            clearFailsafe();
            handleScroll();
        };

        window.addEventListener("scroll", handleScroll, { passive: true });
        window.addEventListener("scrollend", handleScrollEnd);
        handleScroll();

        return () => {
            window.removeEventListener("scroll", handleScroll);
            window.removeEventListener("scrollend", handleScrollEnd);
            clearFailsafe();
        };
    }, [clearFailsafe]);

    useEffect(() => {
        registerTrigger((id: SectionId) => {
            onFocusChange(id);
            startProgrammaticScroll(id, "smooth");

            const section = SECTION_MAP[id];
            if (section) {
                navigate(section.path);
            }
        });
    }, [registerTrigger, navigate, onFocusChange, startProgrammaticScroll]);

    return {
        sectionRefs,
        isProgrammaticScroll,
        showScrollTop,
        scrollToTop,
    };
}
