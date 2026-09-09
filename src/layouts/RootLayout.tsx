import { useState, useRef, useEffect } from "react";
import { Outlet, useLocation } from "react-router-dom";
import {
    GalaxyScene,
    GalaxyViewportProvider,
    useGalaxyViewport,
    galaxyStore,
} from "../features/galaxy";
import { RadarTransitionProvider, RadarSweepVisual, useRadarTransition } from "../features/transition";
import { PATH_TO_ID } from "../features/sections";

function getInitialFocusId(pathname: string, search: string): string {
    if (pathname.startsWith("/studio")) {
        const params = new URLSearchParams(search);
        const target = params.get("target");
        if (target) return target;
        return "home";
    }
    return PATH_TO_ID[pathname] || "home";
}

function getGalaxySignature(): string {
    return JSON.stringify({
        p: galaxyStore.getSnapshot(),
        b: galaxyStore.getAsteroidBeltSnapshot(),
        s: galaxyStore.getSunSnapshot(),
    });
}

function RootLayoutContent() {
    const location = useLocation();
    const isStudio = location.pathname.startsWith("/studio");

    const { focusId, selectedMoonId, handleSelect } = useGalaxyViewport();
    const { triggerSweep } = useRadarTransition();

    const prevRouteTypeRef = useRef<"studio" | "main">(isStudio ? "studio" : "main");
    const prevGalaxySigRef = useRef<string>(getGalaxySignature());

    useEffect(() => {
        const currentRouteType = isStudio ? "studio" : "main";
        const currentGalaxySig = getGalaxySignature();

        if (prevRouteTypeRef.current !== currentRouteType) {
            prevRouteTypeRef.current = currentRouteType;
            if (prevGalaxySigRef.current !== currentGalaxySig) {
                triggerSweep();
            }
        }
        prevGalaxySigRef.current = currentGalaxySig;
    });

    return (
        <div className="app-shell" style={isStudio ? { overflow: "hidden" } : undefined}>
            <div className="app-shell__canvas" style={isStudio ? { pointerEvents: "auto" } : undefined}>
                <GalaxyScene
                    focusId={focusId}
                    isEditorMode={isStudio}
                    selectedMoonId={selectedMoonId}
                    onSelect={handleSelect}
                >
                    <RadarSweepVisual />
                </GalaxyScene>
            </div>
            <Outlet />
        </div>
    );
}

export function RootLayout() {
    const location = useLocation();
    const [initialFocusId] = useState(() =>
        getInitialFocusId(location.pathname, location.search)
    );

    return (
        <RadarTransitionProvider duration={0.8} maxRadius={44.0}>
            <GalaxyViewportProvider initialFocusId={initialFocusId}>
                <RootLayoutContent />
            </GalaxyViewportProvider>
        </RadarTransitionProvider>
    );
}

export default RootLayout;
