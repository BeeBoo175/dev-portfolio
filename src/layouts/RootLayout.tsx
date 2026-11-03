import { useState, useRef, useEffect } from "react";
import { Outlet, useLocation } from "react-router-dom";
import {
    GalaxyScene,
    GalaxyViewportProvider,
    useGalaxyViewport,
    galaxyStore,
    PlanetCallout,
} from "../features/galaxy";
import { RadarTransitionProvider, useRadarTransition } from "../features/transition";
import { PATH_TO_ID } from "../features/sections";
import { findProject } from "../features/projects/data";

function getInitialFocusId(pathname: string, search: string): string {
    if (pathname.startsWith("/studio")) {
        const params = new URLSearchParams(search);
        const target = params.get("target");
        if (target) return target;
        return "home";
    }
    if (pathname.startsWith("/projects/")) return "projects";
    return PATH_TO_ID[pathname] || "home";
}

const SITE_NAME = "Hew Xiao Qin";

function getPageTitle(pathname: string): string {
    if (pathname === "/") return `${SITE_NAME} | Portfolio`;
    if (pathname.startsWith("/studio")) return `Galaxy Studio | ${SITE_NAME}`;
    const slug = pathname.split("/").filter(Boolean).pop()!;
    // a project keeps the capitals of its own name
    const name = findProject(slug)?.name ?? `${slug.charAt(0).toUpperCase()}${slug.slice(1)}`;
    return `${name} | ${SITE_NAME}`;
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
    const calloutRef = useRef<SVGSVGElement>(null);

    const prevRouteTypeRef = useRef<"studio" | "main">(isStudio ? "studio" : "main");
    const prevGalaxySigRef = useRef<string>(getGalaxySignature());

    useEffect(() => {
        document.title = getPageTitle(location.pathname);
    }, [location.pathname]);

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
                    calloutRef={calloutRef}
                />
            </div>
            <PlanetCallout ref={calloutRef} />
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
        <RadarTransitionProvider duration={0.40} maxRadius={46.0}>
            <GalaxyViewportProvider initialFocusId={initialFocusId}>
                <RootLayoutContent />
            </GalaxyViewportProvider>
        </RadarTransitionProvider>
    );
}

export default RootLayout;
