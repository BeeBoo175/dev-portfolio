import { useState, useCallback, useRef, useEffect } from "react";
import { useSearchParams } from "react-router-dom";
import { useGalaxyPlanets, useGalaxyViewport } from "../features/galaxy";
import {
    GalaxyStudio,
    resolveTargetSelection,
    hasSavedWorkingDraft,
    type PlanetTab,
} from "../features/galaxy-studio";
import { useRadarTransition } from "../features/transition";

export function StudioPage() {
    const [searchParams, setSearchParams] = useSearchParams();
    const planets = useGalaxyPlanets();
    const { setFocusId, setSelectedMoonId, registerSelectHandler } = useGalaxyViewport();
    const { triggerSweep } = useRadarTransition();

    const targetParam = searchParams.get("target") || "home";
    const initialResolved = resolveTargetSelection(targetParam, planets);
    const focusId = initialResolved.focusId;

    const [activeTab, setActiveTab] = useState<PlanetTab>("appearance");
    const [activeMoonIndex, setActiveMoonIndex] = useState<number>(0);
    const [isSidebarOpen, setIsSidebarOpen] = useState<boolean>(() => {
        if (typeof window !== "undefined" && window.innerWidth <= 960) {
            return false;
        }
        return true;
    });

    const planetsRef = useRef(planets);
    useEffect(() => {
        planetsRef.current = planets;
    }, [planets]);

    useEffect(() => {
        setFocusId(focusId);
    }, [focusId, setFocusId]);

    useEffect(() => {
        if (hasSavedWorkingDraft()) {
            triggerSweep();
        }
    }, [triggerSweep]);

    const handleFocusChange = useCallback((rawTarget: string) => {
        const resolved = resolveTargetSelection(rawTarget, planetsRef.current);
        setSearchParams((prev) => {
            const next = new URLSearchParams(prev);
            if (resolved.focusId === "home" || resolved.focusId === "sun") {
                next.delete("target");
            } else {
                next.set("target", resolved.focusId);
            }
            return next;
        }, { replace: true });

        setIsSidebarOpen(true);
        if (resolved.tab) {
            setActiveTab(resolved.tab);
        }
        if (resolved.isMoon && resolved.moonIndex !== undefined) {
            setActiveMoonIndex(resolved.moonIndex);
        }
    }, [setSearchParams]);

    useEffect(() => {
        return registerSelectHandler(handleFocusChange);
    }, [registerSelectHandler, handleFocusChange]);

    const currentFocusedPlanet = planets.find((p) => p.id === focusId);
    const selectedMoonId = activeTab === "moons" && currentFocusedPlanet?.children
        ? currentFocusedPlanet.children[activeMoonIndex]?.id
        : undefined;

    useEffect(() => {
        setSelectedMoonId(selectedMoonId);
        return () => {
            setSelectedMoonId(undefined);
        };
    }, [selectedMoonId, setSelectedMoonId]);

    return (
        <GalaxyStudio
            focusId={focusId}
            onFocusChange={handleFocusChange}
            activeTab={activeTab}
            onTabChange={setActiveTab}
            activeMoonIndex={activeMoonIndex}
            onSelectMoon={setActiveMoonIndex}
            isSidebarOpen={isSidebarOpen}
            onToggleSidebar={() => setIsSidebarOpen((prev) => !prev)}
        />
    );
}

export default StudioPage;
