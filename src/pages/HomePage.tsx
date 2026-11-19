import { useCallback, useEffect, useMemo, useRef } from "react";
import { Link, useNavigate } from "react-router-dom";
import { galaxyStore, useGalaxyViewport, useSceneStatus } from "../features/galaxy";
import { HomeOverlay, ALL_SECTIONS, type SectionId } from "../features/sections";
import { DockedNavigation, type DockedTargetItem } from "../components/navigation";

export function HomePage() {
    const navigate = useNavigate();
    const { focusId, setFocusId, registerSelectHandler } = useGalaxyViewport();
    const hasScene = useSceneStatus() === "ready";
    const triggerRef = useRef<(id: SectionId) => void>(() => { });

    useEffect(() => {
        galaxyStore.revertToPersisted();
    }, []);

    const registerTrigger = useCallback((fn: (id: SectionId) => void) => {
        triggerRef.current = fn;
    }, []);

    const handleSelect = useCallback((id: string) => {
        triggerRef.current(id as SectionId);
    }, []);

    useEffect(() => {
        return registerSelectHandler((id: string) => {
            triggerRef.current(id as SectionId);
        });
    }, [registerSelectHandler]);

    const handleFocusChange = useCallback((id: SectionId) => {
        setFocusId(id);
    }, [setFocusId]);

    const navTargets: DockedTargetItem[] = useMemo(
        () => ALL_SECTIONS.map((section) => ({ id: section.id, label: section.label })),
        []
    );

    const studioUrl = focusId && focusId !== "home" ? `/studio?target=${focusId}` : "/studio";

    const handleLauncherKeyDown = useCallback((e: React.KeyboardEvent<HTMLAnchorElement>) => {
        if (e.key === " " || e.key === "Spacebar") {
            e.preventDefault();
            navigate(studioUrl);
        }
    }, [navigate, studioUrl]);

    return (
        <>
            {hasScene && (
                <header className="app-shell__top-actions">
                    <Link
                        to={studioUrl}
                        className="studio-launcher-btn pill"
                        title="Launch 3D Galaxy Studio"
                        aria-label="Launch 3D Galaxy Studio"
                        tabIndex={0}
                        onKeyDown={handleLauncherKeyDown}
                    >
                        Galaxy Studio
                    </Link>
                </header>
            )}

            <HomeOverlay
                onFocusChange={handleFocusChange}
                registerTrigger={registerTrigger}
            />

            <DockedNavigation
                targets={navTargets}
                selectedId={focusId}
                onSelectTarget={handleSelect}
            />
        </>
    );
}

export default HomePage;
