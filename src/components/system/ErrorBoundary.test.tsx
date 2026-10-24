import { describe, expect, it, vi } from "vitest";
import { act, useEffect } from "react";
import { createRoot } from "react-dom/client";
import { ErrorBoundary } from "./ErrorBoundary";

(globalThis as { IS_REACT_ACT_ENVIRONMENT?: boolean }).IS_REACT_ACT_ENVIRONMENT = true;

describe("ErrorBoundary", () => {
    const render = () => {
        const root = createRoot(document.createElement("div"));
        return root;
    };

    // scrolling the home page changes the path; remounting the page then yanks the scroll to a section
    it("keeps its children mounted when the reset key changes", () => {
        const mounted = vi.fn();
        function Page() {
            useEffect(() => {
                mounted();
            }, []);
            return <p>page</p>;
        }
        const root = render();
        for (const path of ["/", "/about", "/skills"]) {
            act(() => {
                root.render(
                    <ErrorBoundary resetKey={path} fallback={<p>failed</p>}>
                        <Page />
                    </ErrorBoundary>
                );
            });
        }
        expect(mounted).toHaveBeenCalledOnce();
        act(() => root.unmount());
    });

    it("tries again once the reset key changes after a failure", () => {
        const silence = vi.spyOn(console, "error").mockImplementation(() => {});
        const host = document.createElement("div");
        const root = createRoot(host);
        function Broken(): never {
            throw new Error("boom");
        }
        const show = (path: string, child: React.ReactNode) =>
            act(() => {
                root.render(
                    <ErrorBoundary resetKey={path} fallback={<p>failed</p>}>
                        {child}
                    </ErrorBoundary>
                );
            });

        show("/a", <Broken />);
        expect(host.textContent).toBe("failed");
        show("/b", <p>fine</p>);
        expect(host.textContent).toBe("fine");
        act(() => root.unmount());
        silence.mockRestore();
    });
});
