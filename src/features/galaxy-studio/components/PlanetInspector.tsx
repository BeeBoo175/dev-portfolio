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

    return (
        <>
            <div className="studio-tabs" role="tablist" aria-label="Planet categories">
                {tabs.map((tab) => (
                    <button
                        key={tab.id}
                        type="button"
                        role="tab"
                        id={`planet-tab-${tab.id}`}
                        aria-selected={activeTab === tab.id}
                        aria-controls={`planet-panel-${tab.id}`}
                        className={`studio-tab ${activeTab === tab.id ? "studio-tab--active" : ""}`}
                        onClick={() => onTabChange(tab.id)}
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
