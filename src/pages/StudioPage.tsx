import { useSearchParams } from "react-router-dom";
import { GalaxyScene } from "../features/galaxy";
import { GalaxyStudio } from "../features/galaxy-studio";

const VALID_TARGETS = ["home", "sun", "about", "skills", "projects", "contact", "asteroid-belt"];

export function StudioPage() {
    const [searchParams, setSearchParams] = useSearchParams();
    const targetParam = searchParams.get("target");
    const focusId = targetParam && VALID_TARGETS.includes(targetParam) ? targetParam : "home";

    const handleFocusChange = (newTarget: string) => {
        setSearchParams((prev) => {
            const next = new URLSearchParams(prev);
            if (newTarget === "home" || newTarget === "sun") {
                next.delete("target");
            } else {
                next.set("target", newTarget);
            }
            return next;
        }, { replace: true });
    };

    return (
        <div className="app-shell" style={{ overflow: "hidden" }}>
            <div className="app-shell__canvas" style={{ pointerEvents: "auto" }}>
                <GalaxyScene
                    focusId={focusId}
                    isEditorMode={true}
                    onSelect={handleFocusChange}
                />
            </div>

            <GalaxyStudio
                focusId={focusId}
                onFocusChange={handleFocusChange}
            />
        </div>
    );
}

export default StudioPage;
