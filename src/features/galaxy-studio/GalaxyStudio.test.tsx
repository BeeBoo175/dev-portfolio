import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";
import { act } from "react";
import { createRoot } from "react-dom/client";
import { MemoryRouter } from "react-router-dom";
import { GalaxyStudio } from "./components/GalaxyStudio";
import { GalaxyToolbar } from "./components/GalaxyToolbar";
import { galaxyStore } from "../galaxy/store";

const DRAFT_STORAGE_KEY = "portfolio_galaxy_studio_draft_v1";

function createMockStorage(): Storage {
    let store: Record<string, string> = {};
    return {
        getItem: (key: string) => store[key] ?? null,
        setItem: (key: string, value: string) => {
            store[key] = String(value);
        },
        removeItem: (key: string) => {
            delete store[key];
        },
        clear: () => {
            store = {};
        },
        key: (index: number) => Object.keys(store)[index] ?? null,
        get length() {
            return Object.keys(store).length;
        },
    };
}

function setNativeInputValue(element: HTMLInputElement, value: string) {
    const valueSetter = Object.getOwnPropertyDescriptor(element, "value")?.set;
    const prototype = Object.getPrototypeOf(element);
    const prototypeValueSetter = Object.getOwnPropertyDescriptor(prototype, "value")?.set;

    if (prototypeValueSetter && valueSetter !== prototypeValueSetter) {
        prototypeValueSetter.call(element, value);
    } else if (valueSetter) {
        valueSetter.call(element, value);
    } else {
        element.value = value;
    }
}

describe("GalaxyStudio Component & UX Features", () => {
    let container: HTMLDivElement | null = null;
    let root: ReturnType<typeof createRoot> | null = null;
    let mockStorage: Storage;

    beforeEach(() => {
        mockStorage = createMockStorage();
        Object.defineProperty(window, "localStorage", {
            value: mockStorage,
            configurable: true,
            writable: true,
        });
        Object.defineProperty(window, "sessionStorage", {
            value: mockStorage,
            configurable: true,
            writable: true,
        });

        galaxyStore.resetAll();

        container = document.createElement("div");
        document.body.appendChild(container);
        root = createRoot(container);
    });

    afterEach(() => {
        if (root && container) {
            act(() => {
                root?.unmount();
            });
        }
        if (container && container.parentNode) {
            container.parentNode.removeChild(container);
        }
        container = null;
        root = null;
    });

    it("renders the studio toolbar with undo, redo, and action buttons", () => {
        const visuals = galaxyStore.getVisualsSnapshot();
        const onUndo = vi.fn();
        const onRedo = vi.fn();

        act(() => {
            root?.render(
                <GalaxyToolbar
                    visuals={visuals}
                    isDirty={false}
                    canUndo={true}
                    canRedo={true}
                    onUndo={onUndo}
                    onRedo={onRedo}
                    onToggleOrbitPaths={vi.fn()}
                    onToggleOrbitalAxes={vi.fn()}
                    onRandomizeAll={vi.fn()}
                    onResetGalaxy={vi.fn()}
                    onOpenDataModal={vi.fn()}
                    onSaveAndApply={vi.fn()}
                    onDiscard={vi.fn()}
                    onExit={vi.fn()}
                />
            );
        });

        const buttons = Array.from(container?.querySelectorAll("button") || []);
        const undoBtn = buttons.find((b) => b.textContent?.includes("Undo"));
        const redoBtn = buttons.find((b) => b.textContent?.includes("Redo"));

        expect(undoBtn).toBeDefined();
        expect(redoBtn).toBeDefined();
        expect(undoBtn?.disabled).toBe(false);
        expect(redoBtn?.disabled).toBe(false);

        act(() => {
            undoBtn?.click();
        });
        expect(onUndo).toHaveBeenCalledTimes(1);

        act(() => {
            redoBtn?.click();
        });
        expect(onRedo).toHaveBeenCalledTimes(1);
    });

    it("disables Undo and Redo buttons when history cannot traverse further", () => {
        const visuals = galaxyStore.getVisualsSnapshot();

        act(() => {
            root?.render(
                <GalaxyToolbar
                    visuals={visuals}
                    isDirty={false}
                    canUndo={false}
                    canRedo={false}
                    onToggleOrbitPaths={vi.fn()}
                    onToggleOrbitalAxes={vi.fn()}
                    onRandomizeAll={vi.fn()}
                    onResetGalaxy={vi.fn()}
                    onOpenDataModal={vi.fn()}
                    onSaveAndApply={vi.fn()}
                    onDiscard={vi.fn()}
                    onExit={vi.fn()}
                />
            );
        });

        const buttons = Array.from(container?.querySelectorAll("button") || []);
        const undoBtn = buttons.find((b) => b.textContent?.includes("Undo"));
        const redoBtn = buttons.find((b) => b.textContent?.includes("Redo"));

        expect(undoBtn?.disabled).toBe(true);
        expect(redoBtn?.disabled).toBe(true);
    });

    it("allows undoing and redoing property modifications on user input release", () => {
        const onFocusChange = vi.fn();

        act(() => {
            root?.render(
                <MemoryRouter>
                    <GalaxyStudio focusId="about" onFocusChange={onFocusChange} />
                </MemoryRouter>
            );
        });

        const radiusSlider = container?.querySelector("#planet-radius") as HTMLInputElement;
        expect(radiusSlider).toBeDefined();
        const initialValue = radiusSlider.value;
        expect(initialValue).toBe("0.8");

        act(() => {
            setNativeInputValue(radiusSlider, "1.80");
            radiusSlider.dispatchEvent(new Event("input", { bubbles: true }));
            radiusSlider.dispatchEvent(new Event("change", { bubbles: true }));
            window.dispatchEvent(new Event("pointerup", { bubbles: true }));
        });

        const updatedSlider = container?.querySelector("#planet-radius") as HTMLInputElement;
        expect(updatedSlider.value).toBe("1.8");

        const buttons = Array.from(container?.querySelectorAll("button") || []);
        const undoBtn = buttons.find((b) => b.textContent?.includes("Undo"));
        expect(undoBtn?.disabled).toBe(false);

        act(() => {
            undoBtn?.click();
        });

        const revertedSlider = container?.querySelector("#planet-radius") as HTMLInputElement;
        expect(revertedSlider.value).toBe(initialValue);

        const redoBtn = Array.from(container?.querySelectorAll("button") || []).find((b) =>
            b.textContent?.includes("Redo")
        );
        expect(redoBtn?.disabled).toBe(false);

        act(() => {
            redoBtn?.click();
        });

        const redoneSlider = container?.querySelector("#planet-radius") as HTMLInputElement;
        expect(redoneSlider.value).toBe("1.8");
    });

    it("handles global keyboard shortcuts (Ctrl+Z and Ctrl+Y) for undo and redo", () => {
        const onFocusChange = vi.fn();

        act(() => {
            root?.render(
                <MemoryRouter>
                    <GalaxyStudio focusId="about" onFocusChange={onFocusChange} />
                </MemoryRouter>
            );
        });

        const radiusSlider = container?.querySelector("#planet-radius") as HTMLInputElement;
        const initialValue = radiusSlider.value;

        act(() => {
            setNativeInputValue(radiusSlider, "1.90");
            radiusSlider.dispatchEvent(new Event("input", { bubbles: true }));
            radiusSlider.dispatchEvent(new Event("change", { bubbles: true }));
            window.dispatchEvent(new Event("pointerup", { bubbles: true }));
        });

        const changedSlider = container?.querySelector("#planet-radius") as HTMLInputElement;
        expect(changedSlider.value).toBe("1.9");

        act(() => {
            window.dispatchEvent(new KeyboardEvent("keydown", { key: "z", ctrlKey: true, bubbles: true }));
        });

        const undoneSlider = container?.querySelector("#planet-radius") as HTMLInputElement;
        expect(undoneSlider.value).toBe(initialValue);

        act(() => {
            window.dispatchEvent(new KeyboardEvent("keydown", { key: "y", ctrlKey: true, bubbles: true }));
        });

        const redoneSlider = container?.querySelector("#planet-radius") as HTMLInputElement;
        expect(redoneSlider.value).toBe("1.9");
    });

    it("handles multiple consecutive biome preset changes and unwinds them sequentially with Ctrl+Z", () => {
        const onFocusChange = vi.fn();

        act(() => {
            root?.render(
                <MemoryRouter>
                    <GalaxyStudio focusId="about" onFocusChange={onFocusChange} />
                </MemoryRouter>
            );
        });

        const presetButtons = Array.from(
            container?.querySelectorAll(".studio-preset-chip") || []
        ) as HTMLButtonElement[];

        expect(presetButtons.length).toBeGreaterThanOrEqual(3);

        const initialColorInput = container?.querySelector('input[type="color"]') as HTMLInputElement;
        const initialColor = initialColorInput?.value;

        act(() => {
            presetButtons[0].click();
        });

        act(() => {
            presetButtons[1].click();
        });

        act(() => {
            presetButtons[2].click();
        });

        const colorInputAfter3 = container?.querySelector('input[type="color"]') as HTMLInputElement;
        const color3 = colorInputAfter3?.value;

        act(() => {
            window.dispatchEvent(new KeyboardEvent("keydown", { key: "z", ctrlKey: true, bubbles: true }));
        });

        const colorInputAfterUndo1 = container?.querySelector('input[type="color"]') as HTMLInputElement;
        expect(colorInputAfterUndo1?.value).not.toBe(color3);

        act(() => {
            window.dispatchEvent(new KeyboardEvent("keydown", { key: "z", ctrlKey: true, bubbles: true }));
        });

        act(() => {
            window.dispatchEvent(new KeyboardEvent("keydown", { key: "z", ctrlKey: true, bubbles: true }));
        });

        const colorInputAfterUndoAll = container?.querySelector('input[type="color"]') as HTMLInputElement;
        expect(colorInputAfterUndoAll?.value).toBe(initialColor);
    });

    it("persists in-progress draft to local/session storage upon modification", () => {
        const onFocusChange = vi.fn();

        act(() => {
            root?.render(
                <MemoryRouter>
                    <GalaxyStudio focusId="about" onFocusChange={onFocusChange} />
                </MemoryRouter>
            );
        });

        const radiusSlider = container?.querySelector("#planet-radius") as HTMLInputElement;

        act(() => {
            setNativeInputValue(radiusSlider, "1.75");
            radiusSlider.dispatchEvent(new Event("input", { bubbles: true }));
            radiusSlider.dispatchEvent(new Event("change", { bubbles: true }));
            window.dispatchEvent(new Event("pointerup", { bubbles: true }));
        });

        const stored = mockStorage.getItem(DRAFT_STORAGE_KEY);
        expect(stored).toBeTruthy();
        const parsed = JSON.parse(stored || "{}");
        const aboutPlanet = parsed.planets?.find((p: { id: string }) => p.id === "about");
        expect(aboutPlanet?.radius).toBe(1.75);
    });

    it("clears draft storage upon clicking Save & Apply", () => {
        const onFocusChange = vi.fn();

        act(() => {
            root?.render(
                <MemoryRouter>
                    <GalaxyStudio focusId="about" onFocusChange={onFocusChange} />
                </MemoryRouter>
            );
        });

        const radiusSlider = container?.querySelector("#planet-radius") as HTMLInputElement;

        act(() => {
            setNativeInputValue(radiusSlider, "1.75");
            radiusSlider.dispatchEvent(new Event("input", { bubbles: true }));
            radiusSlider.dispatchEvent(new Event("change", { bubbles: true }));
            window.dispatchEvent(new Event("pointerup", { bubbles: true }));
        });

        const saveBtn = Array.from(container?.querySelectorAll("button") || []).find((b) =>
            b.textContent?.includes("Save & Apply")
        );
        expect(saveBtn?.disabled).toBe(false);

        act(() => {
            saveBtn?.click();
        });

        expect(mockStorage.getItem(DRAFT_STORAGE_KEY)).toBeNull();
    });

    it("opens exit confirmation modal with Keep Draft & Exit, Discard & Exit, and Keep Editing options", () => {
        const onFocusChange = vi.fn();

        act(() => {
            root?.render(
                <MemoryRouter>
                    <GalaxyStudio focusId="about" onFocusChange={onFocusChange} />
                </MemoryRouter>
            );
        });

        const radiusSlider = container?.querySelector("#planet-radius") as HTMLInputElement;

        act(() => {
            setNativeInputValue(radiusSlider, "1.75");
            radiusSlider.dispatchEvent(new Event("input", { bubbles: true }));
            radiusSlider.dispatchEvent(new Event("change", { bubbles: true }));
            window.dispatchEvent(new Event("pointerup", { bubbles: true }));
        });

        const exitBtn = Array.from(container?.querySelectorAll("button") || []).find((b) =>
            b.textContent?.includes("Exit Studio")
        );

        act(() => {
            exitBtn?.click();
        });

        const modalText = container?.textContent || "";
        expect(modalText).toContain("Unapplied Changes");
        expect(modalText).toContain("Keep Editing");
        expect(modalText).toContain("Keep Draft & Exit");
        expect(modalText).toContain("Discard & Exit");

        const discardBtn = Array.from(container?.querySelectorAll("button") || []).find((b) =>
            b.textContent?.includes("Discard & Exit")
        );

        act(() => {
            discardBtn?.click();
        });

        expect(mockStorage.getItem(DRAFT_STORAGE_KEY)).toBeNull();
    });
});
