import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import React, { act } from "react";
import { createRoot } from "react-dom/client";
import { MemoryRouter, useNavigate } from "react-router-dom";
import { useSectionScroll } from "./useSectionScroll";
import type { SectionId } from "./types";

interface HookHarnessProps {
    onFocusChange: (id: SectionId) => void;
    registerTrigger: (fn: (id: SectionId) => void) => void;
    onNavigateReady?: (navigate: (path: string) => void) => void;
    onHookReady?: (hookResult: ReturnType<typeof useSectionScroll>) => void;
}

function HookHarness({
    onFocusChange,
    registerTrigger,
    onNavigateReady,
    onHookReady,
}: HookHarnessProps) {
    const result = useSectionScroll({ onFocusChange, registerTrigger });
    const { registerSectionRef } = result;
    const navigate = useNavigate();

    React.useEffect(() => {
        onNavigateReady?.(navigate);
    }, [navigate, onNavigateReady]);

    React.useEffect(() => {
        onHookReady?.(result);
    }, [onHookReady, result]);

    return (
        <div>
            <section
                id="home"
                ref={(el) => {
                    registerSectionRef("home", el);
                }}
            >
                Home Section
            </section>
            <section
                id="about"
                ref={(el) => {
                    registerSectionRef("about", el);
                }}
            >
                About Section
            </section>
            <section
                id="projects"
                ref={(el) => {
                    registerSectionRef("projects", el);
                }}
            >
                Projects Section
            </section>
        </div>
    );
}

describe("useSectionScroll", () => {
    let container: HTMLDivElement | null = null;
    let root: ReturnType<typeof createRoot> | null = null;

    beforeEach(() => {
        class MockIntersectionObserver {
            observe = vi.fn();
            unobserve = vi.fn();
            disconnect = vi.fn();
            takeRecords = vi.fn().mockReturnValue([]);
        }
        (globalThis as unknown as { IntersectionObserver: unknown }).IntersectionObserver =
            MockIntersectionObserver;
        (globalThis as unknown as { IS_REACT_ACT_ENVIRONMENT: boolean }).IS_REACT_ACT_ENVIRONMENT =
            true;

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
        vi.restoreAllMocks();
    });

    it("scrolls to initial section on mount and reports initial focus", () => {
        const onFocusChange = vi.fn();
        const registerTrigger = vi.fn();
        const mockScrollIntoView = vi.fn();
        window.HTMLElement.prototype.scrollIntoView = mockScrollIntoView;

        act(() => {
            root?.render(
                <MemoryRouter initialEntries={["/about"]}>
                    <HookHarness
                        onFocusChange={onFocusChange}
                        registerTrigger={registerTrigger}
                    />
                </MemoryRouter>
            );
        });

        expect(onFocusChange).toHaveBeenCalledWith("about");
        expect(mockScrollIntoView).toHaveBeenCalledWith({ behavior: "auto" });
    });

    it("does not call scrollIntoView during regular reactive route updates", () => {
        const onFocusChange = vi.fn();
        const registerTrigger = vi.fn();
        const mockScrollIntoView = vi.fn();
        window.HTMLElement.prototype.scrollIntoView = mockScrollIntoView;

        let navigateFn: ((path: string) => void) | null = null;

        act(() => {
            root?.render(
                <MemoryRouter initialEntries={["/"]}>
                    <HookHarness
                        onFocusChange={onFocusChange}
                        registerTrigger={registerTrigger}
                        onNavigateReady={(nav) => {
                            navigateFn = nav;
                        }}
                    />
                </MemoryRouter>
            );
        });

        expect(mockScrollIntoView).toHaveBeenCalledTimes(1);
        expect(onFocusChange).toHaveBeenCalledWith("home");

        act(() => {
            navigateFn?.("/projects");
        });

        expect(mockScrollIntoView).toHaveBeenCalledTimes(1);
        expect(onFocusChange).toHaveBeenCalledWith("projects");
    });

    it("scrolls into view smoothly when React Router performs back/forward navigation (POP)", () => {
        const onFocusChange = vi.fn();
        const registerTrigger = vi.fn();
        const mockScrollIntoView = vi.fn();
        window.HTMLElement.prototype.scrollIntoView = mockScrollIntoView;

        let navigateFn: ((delta: number) => void) | null = null;

        act(() => {
            root?.render(
                <MemoryRouter initialEntries={["/home", "/about"]} initialIndex={1}>
                    <HookHarness
                        onFocusChange={onFocusChange}
                        registerTrigger={registerTrigger}
                        onNavigateReady={(nav) => {
                            navigateFn = nav as unknown as (delta: number) => void;
                        }}
                    />
                </MemoryRouter>
            );
        });

        expect(mockScrollIntoView).toHaveBeenCalledTimes(1);
        expect(onFocusChange).toHaveBeenCalledWith("about");

        act(() => {
            navigateFn?.(-1);
        });

        expect(mockScrollIntoView).toHaveBeenCalledTimes(2);
        expect(mockScrollIntoView).toHaveBeenLastCalledWith({ behavior: "smooth" });
        expect(onFocusChange).toHaveBeenLastCalledWith("home");
    });

    it("smoothly navigates and scrolls when trigger is invoked", () => {
        const onFocusChange = vi.fn();
        let triggerFn: ((id: SectionId) => void) | null = null;
        const registerTrigger = vi.fn((fn) => {
            triggerFn = fn;
        });
        const mockScrollIntoView = vi.fn();
        window.HTMLElement.prototype.scrollIntoView = mockScrollIntoView;

        act(() => {
            root?.render(
                <MemoryRouter initialEntries={["/"]}>
                    <HookHarness
                        onFocusChange={onFocusChange}
                        registerTrigger={registerTrigger}
                    />
                </MemoryRouter>
            );
        });

        expect(triggerFn).toBeTruthy();

        act(() => {
            triggerFn?.("projects");
        });

        expect(onFocusChange).toHaveBeenLastCalledWith("projects");
        expect(mockScrollIntoView).toHaveBeenLastCalledWith({ behavior: "smooth" });
    });

    it("shows scroll to top button whenever not on home section", () => {
        const onFocusChange = vi.fn();
        const registerTrigger = vi.fn();
        let hookResult: ReturnType<typeof useSectionScroll> | null = null;

        act(() => {
            root?.render(
                <MemoryRouter initialEntries={["/about"]}>
                    <HookHarness
                        onFocusChange={onFocusChange}
                        registerTrigger={registerTrigger}
                        onHookReady={(res) => {
                            hookResult = res;
                        }}
                    />
                </MemoryRouter>
            );
        });

        expect((hookResult as ReturnType<typeof useSectionScroll> | null)?.showScrollTop).toBe(true);
    });

    it("handles scrollToTop action correctly", () => {
        const onFocusChange = vi.fn();
        const registerTrigger = vi.fn();
        const mockScrollIntoView = vi.fn();
        window.HTMLElement.prototype.scrollIntoView = mockScrollIntoView;

        let hookResult: ReturnType<typeof useSectionScroll> | null = null;

        act(() => {
            root?.render(
                <MemoryRouter initialEntries={["/projects"]}>
                    <HookHarness
                        onFocusChange={onFocusChange}
                        registerTrigger={registerTrigger}
                        onHookReady={(res) => {
                            hookResult = res;
                        }}
                    />
                </MemoryRouter>
            );
        });

        expect(hookResult).toBeTruthy();

        act(() => {
            hookResult?.scrollToTop();
        });

        expect(mockScrollIntoView).toHaveBeenCalledWith({ behavior: "smooth" });
    });
});
