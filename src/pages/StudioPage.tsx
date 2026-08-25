import { useState, useCallback } from "react";
import { useSearchParams } from "react-router-dom";
import { GalaxyScene, useGalaxyPlanets } from "../features/galaxy";
import { GalaxyStudio, resolveTargetSelection, type PlanetTab } from "../features/galaxy-studio";

export function StudioPage() {
    const [searchParams, setSearchParams] = useSearchParams();
    const planets = useGalaxyPlanets();
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

    const handleFocusChange = useCallback((rawTarget: string) => {
        const resolved = resolveTargetSelection(rawTarget, planets);
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

    }, [planets, setSearchParams]);

    const currentFocusedPlanet = planets.find((p) => p.id === focusId);
    const selectedMoonId = activeTab === "moons" && currentFocusedPlanet?.children
        ? currentFocusedPlanet.children[activeMoonIndex]?.id
        : undefined;

    return (
        <div className="app-shell" style={{ overflow: "hidden" }}>
            <div className="app-shell__canvas" style={{ pointerEvents: "auto" }}>
                <GalaxyScene
                    focusId={focusId}
                    isEditorMode={true}
                    selectedMoonId={selectedMoonId}
                    onSelect={handleFocusChange}
                />
            </div>


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
        </div>
    );
}

export default StudioPage;
