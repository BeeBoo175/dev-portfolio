import { useState } from "react";
import { GalaxyScene } from "../features/galaxy";
import { GalaxyStudio } from "../features/galaxy-studio";

export function StudioPage() {
    const [focusId, setFocusId] = useState<string>("home");

    return (
        <div className="app-shell" style={{ overflow: "hidden" }}>
            <div className="app-shell__canvas" style={{ pointerEvents: "auto" }}>
                <GalaxyScene
                    focusId={focusId}
                    isEditorMode={true}
                    onSelect={setFocusId}
                />
            </div>

            <GalaxyStudio
                focusId={focusId}
                onFocusChange={setFocusId}
            />
        </div>
    );
}

export default StudioPage;
