import { useCallback, useEffect, useRef, useState } from "react";
import { ThemeToggle } from "../../features/theme";
import { MotionToggle } from "../../features/motion/MotionToggle";
import { prefersReducedMotion } from "../../features/motion/store";
import { getBodyNumeral } from "../../features/galaxy";
import { MinusIcon, PlusIcon, ShipIcon } from "../ui/Icons";
import "./DockedNavigation.css";

export interface DockedTargetItem {
    id: string;
    label: string;
    type?: "sun" | "planet" | "belt";
    badge?: string;
}

export interface DockedNavigationProps {
    targets: DockedTargetItem[];
    selectedId: string;
    onSelectTarget: (id: string) => void;
    defaultPlanetId?: string;
    className?: string;
    ref?: React.Ref<HTMLElement>;
}

export function DockedNavigation({
    targets,
    selectedId,
    onSelectTarget,
    defaultPlanetId,
    className = "",
    ref,
}: DockedNavigationProps) {
    const activeChipRef = useRef<HTMLButtonElement | null>(null);
    const pillsRef = useRef<HTMLDivElement | null>(null);
    const [canScrollLeft, setCanScrollLeft] = useState(false);
    const [canScrollRight, setCanScrollRight] = useState(false);

    const updateScrollState = useCallback(() => {
        const el = pillsRef.current;
        if (!el) return;
        const { scrollLeft, scrollWidth, clientWidth } = el;
        setCanScrollLeft(scrollLeft > 2);
        setCanScrollRight(scrollLeft + clientWidth < scrollWidth - 2);
    }, []);

    useEffect(() => {
        updateScrollState();
        const el = pillsRef.current;
        if (!el) return;

        el.addEventListener("scroll", updateScrollState, { passive: true });
        window.addEventListener("resize", updateScrollState);

        return () => {
            el.removeEventListener("scroll", updateScrollState);
            window.removeEventListener("resize", updateScrollState);
        };
    }, [targets, updateScrollState]);

    useEffect(() => {
        if (activeChipRef.current && typeof activeChipRef.current.scrollIntoView === "function") {
            activeChipRef.current.scrollIntoView({
                behavior: prefersReducedMotion() ? "auto" : "smooth",
                inline: "center",
                block: "nearest",
            });
        }
        updateScrollState();
    }, [selectedId, updateScrollState]);

    const handleZoomIn = () => {
        window.dispatchEvent(
            new CustomEvent("portfolio:camera-zoom", {
                detail: { delta: -4.0 },
            })
        );
    };

    const handleZoomOut = () => {
        window.dispatchEvent(
            new CustomEvent("portfolio:camera-zoom", {
                detail: { delta: 4.0 },
            })
        );
    };

    const handleChipKeyDown = (e: React.KeyboardEvent<HTMLButtonElement>, index: number) => {
        let nextIndex: number | null = null;
        if (e.key === "ArrowRight") {
            e.preventDefault();
            nextIndex = (index + 1) % targets.length;
        } else if (e.key === "ArrowLeft") {
            e.preventDefault();
            nextIndex = (index - 1 + targets.length) % targets.length;
        } else if (e.key === "Home") {
            e.preventDefault();
            nextIndex = 0;
        } else if (e.key === "End") {
            e.preventDefault();
            nextIndex = targets.length - 1;
        }

        if (nextIndex !== null) {
            const chips = pillsRef.current?.querySelectorAll<HTMLButtonElement>(".docked-navigation__chip");
            chips?.[nextIndex]?.focus();
        }
    };

    return (
        <nav
            ref={ref}
            className={`docked-navigation ${className}`}
            aria-label="Sections"
        >
            <div className="docked-navigation__track">
                <div
                    ref={pillsRef}
                    className={`docked-navigation__pills ${
                        canScrollLeft ? "docked-navigation__pills--fade-left" : ""
                    } ${
                        canScrollRight ? "docked-navigation__pills--fade-right" : ""
                    }`}
                >
                    {targets.map((target, index) => {
                        const isSelected = selectedId === target.id;
                        const isSpaceshipBase = Boolean(defaultPlanetId && target.id === defaultPlanetId);

                        return (
                            <button
                                key={target.id}
                                ref={isSelected ? activeChipRef : null}
                                type="button"
                                className={`docked-navigation__chip ${
                                    isSelected ? "docked-navigation__chip--active" : ""
                                }`}
                                onClick={() => onSelectTarget(target.id)}
                                onKeyDown={(e) => handleChipKeyDown(e, index)}
                                aria-current={isSelected ? "page" : undefined}
                                aria-label={`${target.label}${isSpaceshipBase ? " (Ship Base)" : ""}`}
                            >
                                <span className="docked-navigation__numeral" aria-hidden="true">
                                    {getBodyNumeral(target.id)}
                                </span>
                                <span className="docked-navigation__label">{target.label}</span>
                                {isSpaceshipBase && (
                                    <span
                                        className="docked-navigation__badge docked-navigation__badge--station"
                                        title="Spaceship Default Station"
                                    >
                                        <ShipIcon />
                                    </span>
                                )}
                                {target.badge && (
                                    <span className="docked-navigation__badge">{target.badge}</span>
                                )}
                            </button>
                        );
                    })}
                </div>

                <div className="docked-navigation__actions">
                    <div className="docked-navigation__zoom-divider" />

                    <ThemeToggle className="docked-navigation__theme-btn" />

                    <MotionToggle className="docked-navigation__zoom-btn docked-navigation__motion-btn" />

                    <div className="docked-navigation__zoom-controls" role="group" aria-label="Camera zoom">
                        <button
                            type="button"
                            className="docked-navigation__zoom-btn"
                            onClick={handleZoomIn}
                            aria-label="Zoom in camera"
                            title="Zoom in"
                        >
                            <PlusIcon />
                        </button>
                        <button
                            type="button"
                            className="docked-navigation__zoom-btn"
                            onClick={handleZoomOut}
                            aria-label="Zoom out camera"
                            title="Zoom out"
                        >
                            <MinusIcon />
                        </button>
                    </div>
                </div>
            </div>
        </nav>
    );
}

export default DockedNavigation;
