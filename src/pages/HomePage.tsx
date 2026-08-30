import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Link } from "react-router-dom";
import { GalaxyScene, galaxyStore, useGalaxyPlanets } from "../features/galaxy";
import { HomeOverlay, PLANET_SECTIONS, type SectionId } from "../features/sections";
import { DockedNavigation, type DockedTargetItem } from "../components/navigation";

export function HomePage() {
    const [focusId, setFocusId] = useState<SectionId>("home");
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

    return (
        <div className="app-shell">
            <div className="app-shell__canvas">
                <GalaxyScene focusId={focusId} onSelect={handleSelect} />
            </div>

            <HomeOverlay
                onFocusChange={setFocusId}
                registerTrigger={registerTrigger}
            />

            <DockedNavigation
                targets={navTargets}
                selectedId={focusId}
                onSelectTarget={handleSelect}
            />

            <Link
                to="/studio"
                className="studio-launcher-btn"
                title="Launch 3D Galaxy Studio"
                aria-label="Launch 3D Galaxy Studio"
            >
                <span className="studio-launcher-btn__text">Galaxy Studio</span>
            </Link>
        </div>
    );
}

export default HomePage;
