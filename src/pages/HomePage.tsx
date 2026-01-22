import { useCallback, useRef, useState } from "react";
import { GalaxyScene } from "../features/galaxy";
import { HomeOverlay } from "../features/sections";
import { PlanetStudioModal } from "../features/planet-creator";
import type { SectionId } from "../features/sections";

export function HomePage() {
    const [focusId, setFocusId] = useState<SectionId>("home");
    const triggerRef = useRef<(id: SectionId) => void>(() => {});

    const registerTrigger = useCallback((fn: (id: SectionId) => void) => {
        triggerRef.current = fn;
    }, []);

    const handleSelect = useCallback((id: string) => {
        triggerRef.current(id as SectionId);
    }, []);

    return (
        <div className="app-shell">
            <div className="app-shell__canvas">
                <GalaxyScene focusId={focusId} onSelect={handleSelect} />
            </div>

            <HomeOverlay
                onFocusChange={setFocusId}
                registerTrigger={registerTrigger}
            />

            <PlanetStudioModal />
        </div>
    );
}

export default HomePage;
