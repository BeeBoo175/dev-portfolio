import { useState } from "react";
import { Outlet, useLocation } from "react-router-dom";
import { GalaxyScene, GalaxyViewportProvider, useGalaxyViewport } from "../features/galaxy";
import { RadarTransitionProvider } from "../features/transition";
import { PATH_TO_ID } from "../features/sections";

function getInitialFocusId(pathname: string, search: string): string {
    if (
        pathname.startsWith("/studio") ||
        pathname.startsWith("/galaxy-studio") ||
        pathname.startsWith("/editor")
    ) {
        const params = new URLSearchParams(search);
        const target = params.get("target");
        if (target) return target;
        return "home";
    }
    return PATH_TO_ID[pathname] || "home";
}

function GalaxyLayoutContent() {
    const location = useLocation();
    const isStudio =
        location.pathname.startsWith("/studio") ||
        location.pathname.startsWith("/galaxy-studio") ||
        location.pathname.startsWith("/editor");

    const { focusId, selectedMoonId, handleSelect } = useGalaxyViewport();

    return (
        <div className="app-shell" style={isStudio ? { overflow: "hidden" } : undefined}>
            <div className="app-shell__canvas" style={isStudio ? { pointerEvents: "auto" } : undefined}>
                <GalaxyScene
                    focusId={focusId}
                    isEditorMode={isStudio}
                    selectedMoonId={selectedMoonId}
                    onSelect={handleSelect}
                />
            </div>
            <Outlet />
        </div>
    );
}

export function GalaxyLayout() {
    const location = useLocation();
    const [initialFocusId] = useState(() =>
        getInitialFocusId(location.pathname, location.search)
    );

    return (
        <RadarTransitionProvider duration={0.8} maxRadius={44.0}>
            <GalaxyViewportProvider initialFocusId={initialFocusId}>
                <GalaxyLayoutContent />
            </GalaxyViewportProvider>
        </RadarTransitionProvider>
    );
}

export default GalaxyLayout;
