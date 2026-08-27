import { useCallback, useRef, useState } from "react";
import { BrowserRouter, Route, Routes } from "react-router-dom";
import GalaxyScene from "./features/galaxy/GalaxyScene";
import HomeOverlay from "./features/sections/HomeOverlay";
import { PLANET_SECTIONS } from "./features/sections/data";
import type { SectionId } from "./features/sections/types";
import "./App.css";

function HomePage() {
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
        </div>
    );
}

function App() {
    return (
        <BrowserRouter>
            <Routes>
                <Route path="/" element={<HomePage />} />
                {PLANET_SECTIONS.map((section) => (
                    <Route
                        key={section.id}
                        path={section.path}
                        element={<HomePage />}
                    />
                ))}
            </Routes>
        </BrowserRouter>
    );
}

export default App;