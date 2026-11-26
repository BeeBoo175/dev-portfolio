import { lazy, Suspense, useState, useRef, useEffect } from "react";
import { Outlet, useLocation } from "react-router-dom";
import {
    GalaxyViewportProvider,
    useGalaxyViewport,
    galaxyStore,
    PlanetCallout,
    StarChart,
    sceneStatus,
    useSceneStatus,
    SCENE_REASONS,
} from "../features/galaxy";
import { RadarTransitionProvider, useRadarTransition } from "../features/transition";
import { ErrorBoundary } from "../components/system/ErrorBoundary";
import { PageFailed, PageLoading } from "../components/system/Fallbacks";
import { PATH_TO_ID } from "../features/sections";
import { findProject } from "../features/projects/data";

// the 3D library is most of the download: the words are on screen before it arrives
const GalaxyScene = lazy(() => import("../features/galaxy/GalaxyScene"));

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
    const scene = useSceneStatus();

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
            <div className="app-shell__canvas" aria-hidden={scene === "ready" ? "true" : undefined} style={isStudio ? { pointerEvents: "auto" } : undefined}>
                {scene === "ready" ? (
                    <ErrorBoundary fallback={null} onError={sceneStatus.fail}>
                        <Suspense fallback={null}>
                            <GalaxyScene
                                focusId={focusId}
                                isEditorMode={isStudio}
                                selectedMoonId={selectedMoonId}
                                onSelect={handleSelect}
                                calloutRef={calloutRef}
                            />
                        </Suspense>
                    </ErrorBoundary>
                ) : (
                    // the closed studio has its own message
                    !isStudio && (
                        <StarChart focusId={focusId} onSelect={handleSelect} caption={`Flat chart view. ${SCENE_REASONS[scene]}`} />
                    )
                )}
            </div>
            <PlanetCallout ref={calloutRef} />
            <ErrorBoundary resetKey={location.pathname} fallback={<PageFailed />}>
                <Suspense fallback={<PageLoading />}>
                    <Outlet />
                </Suspense>
            </ErrorBoundary>
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
