import { useCallback, useEffect, useMemo, useRef } from "react";
import { Link } from "react-router-dom";
import { galaxyStore, useGalaxyPlanets, useGalaxyViewport } from "../features/galaxy";
import { HomeOverlay, PLANET_SECTIONS, type SectionId } from "../features/sections";
import { DockedNavigation, type DockedTargetItem } from "../components/navigation";

export function HomePage() {
    const { focusId, setFocusId, registerSelectHandler } = useGalaxyViewport();
    const triggerRef = useRef<(id: SectionId) => void>(() => { });
    const dynamicPlanets = useGalaxyPlanets();

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

    const navTargets: DockedTargetItem[] = useMemo(() => {
        return PLANET_SECTIONS.map((section) => {
            const planetConfig = dynamicPlanets.find((p) => p.id === section.id);
            return {
                id: section.id,
                label: section.label,
                color: planetConfig?.color || section.color,
            };
        });
    }, [dynamicPlanets]);

    const studioUrl = focusId && focusId !== "home" ? `/studio?target=${focusId}` : "/studio";

    return (
        <>
            <HomeOverlay
                onFocusChange={handleFocusChange}
                registerTrigger={registerTrigger}
            />

            <DockedNavigation
                targets={navTargets}
                selectedId={focusId}
                onSelectTarget={handleSelect}
            />

            <div className="app-shell__top-actions">
                <Link
                    to={studioUrl}
                    className="studio-launcher-btn"
                    title="Launch 3D Galaxy Studio"
                    aria-label="Launch 3D Galaxy Studio"
                >
                    Galaxy Studio
                </Link>
            </div>
        </>
    );
}

export default HomePage;
