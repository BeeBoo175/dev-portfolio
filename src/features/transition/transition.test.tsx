import { describe, it, expect, beforeEach, afterEach } from "vitest";
import React, { act, useState } from "react";
import { createRoot } from "react-dom/client";
import { RadarTransitionProvider, useRadarTransition } from "./index";

function TestConsumer({
    onReady,
}: {
    onReady?: (actions: { complete: () => void; reset: () => void; getRadius: () => number }) => void;
}) {
    const { isRadarComplete, radarStateRef, notifyComplete, triggerSweep } = useRadarTransition();
    const [radius, setRadius] = useState(0);

    const handleReadRadius = () => {
        setRadius(radarStateRef.current?.currentRadius ?? 0);
    };

    React.useEffect(() => {
        onReady?.({
            complete: notifyComplete,
            reset: triggerSweep,
            getRadius: () => radarStateRef.current?.currentRadius ?? 0,
        });
    }, [notifyComplete, onReady, radarStateRef, triggerSweep]);

    return (
        <div>
            <span id="status">{isRadarComplete ? "complete" : "sweeping"}</span>
            <span id="radius">{radius}</span>
            <button id="read-btn" onClick={handleReadRadius}>Read Radius</button>
            <button id="complete-btn" onClick={notifyComplete}>Complete</button>
            <button id="reset-btn" onClick={triggerSweep}>Reset</button>
        </div>
    );
}

describe("RadarTransition", () => {
    let container: HTMLDivElement;

    beforeEach(() => {
        container = document.createElement("div");
        document.body.appendChild(container);
    });

    afterEach(() => {
        document.body.removeChild(container);
    });

    it("provides initial sweeping state and advances to complete on notifyComplete", async () => {
        const root = createRoot(container);
        await act(async () => {
            root.render(
                <RadarTransitionProvider duration={0.95} maxRadius={27.5}>
                    <TestConsumer />
                </RadarTransitionProvider>
            );
        });

        const statusEl = container.querySelector("#status");
        expect(statusEl?.textContent).toBe("sweeping");

        const completeBtn = container.querySelector("#complete-btn") as HTMLButtonElement;
        const readBtn = container.querySelector("#read-btn") as HTMLButtonElement;

        await act(async () => {
            completeBtn.click();
            readBtn.click();
        });

        expect(statusEl?.textContent).toBe("complete");
        expect(container.querySelector("#radius")?.textContent).toBe("27.5");

        await act(async () => {
            root.unmount();
        });
    });

    it("resets state when triggerSweep is invoked", async () => {
        const root = createRoot(container);
        await act(async () => {
            root.render(
                <RadarTransitionProvider duration={0.95} maxRadius={27.5}>
                    <TestConsumer />
                </RadarTransitionProvider>
            );
        });

        const completeBtn = container.querySelector("#complete-btn") as HTMLButtonElement;
        const resetBtn = container.querySelector("#reset-btn") as HTMLButtonElement;
        const readBtn = container.querySelector("#read-btn") as HTMLButtonElement;

        await act(async () => {
            completeBtn.click();
        });
        expect(container.querySelector("#status")?.textContent).toBe("complete");

        await act(async () => {
            resetBtn.click();
            readBtn.click();
        });
        expect(container.querySelector("#status")?.textContent).toBe("sweeping");
        expect(container.querySelector("#radius")?.textContent).toBe("0");

        await act(async () => {
            root.unmount();
        });
    });

    it("provides safe fallback defaults when consumed outside provider", async () => {
        const root = createRoot(container);
        await act(async () => {
            root.render(<TestConsumer />);
        });

        expect(container.querySelector("#status")?.textContent).toBe("complete");

        await act(async () => {
            root.unmount();
        });
    });

    it("initializes with fast transition duration by default", async () => {
        let readDuration = 0;
        function DurationConsumer() {
            const { radarStateRef } = useRadarTransition();
            React.useEffect(() => {
                readDuration = radarStateRef.current?.duration ?? 0;
            }, [radarStateRef]);
            return null;
        }
        const root = createRoot(container);
        await act(async () => {
            root.render(
                <RadarTransitionProvider>
                    <DurationConsumer />
                </RadarTransitionProvider>
            );
        });
        expect(readDuration).toBe(0.38);
        await act(async () => {
            root.unmount();
        });
    });
});
