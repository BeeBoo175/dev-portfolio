import type { OrbitConfig } from "../../galaxy";
import type { PlanetTab } from "../types";
import AppearancePanel from "./AppearancePanel";
import Orbit3DPanel from "./Orbit3DPanel";
import TerrainPanel from "./TerrainPanel";
import MoonsPanel from "./MoonsPanel";

export interface PlanetInspectorProps {
    currentPlanet: OrbitConfig;
    activeTab: PlanetTab;
    onTabChange: (tab: PlanetTab) => void;
    activeMoonIndex: number;
    onSelectMoon: (index: number) => void;
    onUpdatePlanet: (updater: (prev: OrbitConfig) => OrbitConfig) => void;
}

export function PlanetInspector({
    currentPlanet,
    activeTab,
    onTabChange,
    activeMoonIndex,
    onSelectMoon,
    onUpdatePlanet,
}: PlanetInspectorProps) {
    const tabs: { id: PlanetTab; label: string }[] = [
        { id: "appearance", label: "Appearance" },
        { id: "orbit", label: "Orbit 3D" },
        { id: "terrain", label: "Terrain" },
        {
            id: "moons",
            label: `Moons (${currentPlanet.children?.length || 0})`,
        },
    ];

    const handleKeyDown = (e: React.KeyboardEvent<HTMLButtonElement>, index: number) => {
        let newIndex: number | null = null;
        if (e.key === "ArrowRight" || e.key === "ArrowDown") {
            e.preventDefault();
            newIndex = (index + 1) % tabs.length;
        } else if (e.key === "ArrowLeft" || e.key === "ArrowUp") {
            e.preventDefault();
            newIndex = (index - 1 + tabs.length) % tabs.length;
        } else if (e.key === "Home") {
            e.preventDefault();
            newIndex = 0;
        } else if (e.key === "End") {
            e.preventDefault();
            newIndex = tabs.length - 1;
        }

        if (newIndex !== null) {
            const nextTab = tabs[newIndex];
            onTabChange(nextTab.id);
            const tabButton = document.getElementById(`planet-tab-${nextTab.id}`);
            tabButton?.focus();
        }
    };

    return (
        <>
            <div className="studio-tabs" role="tablist" aria-label="Planet categories">
                {tabs.map((tab, index) => (
                    <button
                        key={tab.id}
                        type="button"
                        role="tab"
                        id={`planet-tab-${tab.id}`}
                        aria-selected={activeTab === tab.id}
                        aria-controls={`planet-panel-${tab.id}`}
                        tabIndex={activeTab === tab.id ? 0 : -1}
                        className={`studio-tab ${activeTab === tab.id ? "studio-tab--active" : ""}`}
                        onClick={() => onTabChange(tab.id)}
                        onKeyDown={(e) => handleKeyDown(e, index)}
                    >
                        {tab.label}
                    </button>
                ))}
            </div>

            <div
                className="studio-tab-body"
                role="tabpanel"
                id={`planet-panel-${activeTab}`}
                aria-labelledby={`planet-tab-${activeTab}`}
            >
                {activeTab === "appearance" && (
                    <AppearancePanel
                        planet={currentPlanet}
                        onChange={onUpdatePlanet}
                    />
                )}

                {activeTab === "orbit" && (
                    <Orbit3DPanel
                        planet={currentPlanet}
                        onChange={onUpdatePlanet}
                    />
                )}

                {activeTab === "terrain" && (
                    <TerrainPanel
                        planet={currentPlanet}
                        onChange={onUpdatePlanet}
                    />
                )}

                {activeTab === "moons" && (
                    <MoonsPanel
                        planet={currentPlanet}
                        activeMoonIndex={activeMoonIndex}
                        onSelectMoon={onSelectMoon}
                        onChange={onUpdatePlanet}
                    />
                )}
            </div>
        </>
    );
}

export default PlanetInspector;
