import { useEffect, useRef } from "react";
import "./DockedNavigation.css";

export interface DockedTargetItem {
    id: string;
    label: string;
    type?: "sun" | "planet" | "belt";
    color?: string;
    badge?: string;
}

export interface DockedNavigationProps {
    targets: DockedTargetItem[];
    selectedId: string;
    onSelectTarget: (id: string) => void;
    defaultPlanetId?: string;
    isSidebarOpen?: boolean;
    onToggleSidebar?: () => void;
    className?: string;
}

export function DockedNavigation({
    targets,
    selectedId,
    onSelectTarget,
    defaultPlanetId,
    isSidebarOpen,
    onToggleSidebar,
    className = "",
}: DockedNavigationProps) {
    const activeChipRef = useRef<HTMLButtonElement | null>(null);

    useEffect(() => {
        if (activeChipRef.current && typeof activeChipRef.current.scrollIntoView === "function") {
            activeChipRef.current.scrollIntoView({
                behavior: "smooth",
                inline: "center",
                block: "nearest",
            });
        }
    }, [selectedId]);

    return (
        <nav
            className={`docked-navigation ${className}`}
            aria-label="Celestial Target Navigation"
        >
            {onToggleSidebar && !isSidebarOpen && (
                <button
                    type="button"
                    className="docked-navigation__expand-tab"
                    onClick={onToggleSidebar}
                    aria-label="Expand inspector"
                    title="Expand inspector"
                >
                    ▲ Inspector
                </button>
            )}
            <div className="docked-navigation__track">
                {targets.map((target) => {
                    const isSelected = selectedId === target.id;
                    const color = target.color || "#38bdf8";
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
                            style={
                                isSelected
                                    ? {
                                          borderColor: color,
                                          boxShadow: `0 0 16px ${color}55`,
                                      }
                                    : undefined
                            }
                        >
                            <span
                                className="docked-navigation__dot"
                                style={{ backgroundColor: color }}
                            />
                            <span className="docked-navigation__label">{target.label}</span>
                            {isSpaceshipBase && (
                                <span
                                    className="docked-navigation__badge docked-navigation__badge--station"
                                    title="Spaceship Default Station"
                                >
                                    Ship Base
                                </span>
                            )}
                            {target.badge && (
                                <span className="docked-navigation__badge">{target.badge}</span>
                            )}
                        </button>
                    );
                })}
            </div>
        </nav>
    );
}

export default DockedNavigation;
