import { describe, it, expect, beforeEach, afterEach } from "vitest";
import { useEffect, act } from "react";
import { createRoot } from "react-dom/client";
import { GalaxyViewportProvider } from "./GalaxyViewportProvider";
import { useGalaxyViewport } from "../hooks/useGalaxyViewport";

function ConsumerComponent({
    targetId,
    moonId,
    onMeshClick,
}: {
    targetId?: string;
    moonId?: string;
    onMeshClick?: (id: string) => void;
}) {
    const {
        focusId,
        setFocusId,
        selectedMoonId,
        setSelectedMoonId,
        handleSelect,
        registerSelectHandler,
    } = useGalaxyViewport();

    useEffect(() => {
        if (targetId) {
            setFocusId(targetId);
        }
    }, [targetId, setFocusId]);

    useEffect(() => {
        if (moonId !== undefined) {
            setSelectedMoonId(moonId);
        }
    }, [moonId, setSelectedMoonId]);

    useEffect(() => {
        if (onMeshClick) {
            return registerSelectHandler(onMeshClick);
        }
    }, [registerSelectHandler, onMeshClick]);

    return (
        <div>
            <span id="focus-id">{focusId}</span>
            <span id="moon-id">{selectedMoonId ?? "none"}</span>
            <button id="select-projects-btn" onClick={() => handleSelect("projects")}>
                Select Projects
            </button>
        </div>
    );
}

describe("GalaxyViewport Context", () => {
    let container: HTMLDivElement;

    beforeEach(() => {
        container = document.createElement("div");
        document.body.appendChild(container);
    });

    afterEach(() => {
        if (container.parentNode) {
            document.body.removeChild(container);
        }
    });

    it("provides default focusId and updates when requested", async () => {
        const root = createRoot(container);
        await act(async () => {
            root.render(
                <GalaxyViewportProvider initialFocusId="home">
                    <ConsumerComponent />
                </GalaxyViewportProvider>
            );
        });

        expect(container.querySelector("#focus-id")?.textContent).toBe("home");

        const btn = container.querySelector("#select-projects-btn") as HTMLButtonElement;
        await act(async () => {
            btn.click();
        });

        expect(container.querySelector("#focus-id")?.textContent).toBe("projects");
    });

    it("forwards handleSelect to custom registered handler when registered", async () => {
        let clickedId = "";
        const root = createRoot(container);
        await act(async () => {
            root.render(
                <GalaxyViewportProvider initialFocusId="skills">
                    <ConsumerComponent
                        onMeshClick={(id) => {
                            clickedId = id;
                        }}
                    />
                </GalaxyViewportProvider>
            );
        });

        expect(container.querySelector("#focus-id")?.textContent).toBe("skills");

        const btn = container.querySelector("#select-projects-btn") as HTMLButtonElement;
        await act(async () => {
            btn.click();
        });

        expect(clickedId).toBe("projects");
    });

    it("tracks selectedMoonId properly", async () => {
        const root = createRoot(container);
        await act(async () => {
            root.render(
                <GalaxyViewportProvider initialFocusId="about">
                    <ConsumerComponent moonId="titan" />
                </GalaxyViewportProvider>
            );
        });

        expect(container.querySelector("#moon-id")?.textContent).toBe("titan");
    });
});
