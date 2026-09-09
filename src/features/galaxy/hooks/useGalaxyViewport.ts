import { useContext } from "react";
import { GalaxyViewportContext, type GalaxyViewportContextValue } from "../context/viewportContextDef";

export function useGalaxyViewport(): GalaxyViewportContextValue {
    const ctx = useContext(GalaxyViewportContext);
    if (!ctx) {
        throw new Error("useGalaxyViewport must be used within a GalaxyViewportProvider");
    }
    return ctx;
}
