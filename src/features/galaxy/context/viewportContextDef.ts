import { createContext } from "react";

export interface GalaxyViewportContextValue {
    focusId: string;
    setFocusId: (id: string) => void;
    selectedMoonId?: string;
    setSelectedMoonId: (id: string | undefined) => void;
    handleSelect: (id: string) => void;
    registerSelectHandler: (handler: (id: string) => void) => () => void;
}

export const GalaxyViewportContext = createContext<GalaxyViewportContextValue | null>(null);
