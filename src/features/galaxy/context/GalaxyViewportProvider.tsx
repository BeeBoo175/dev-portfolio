import { useState, useRef, useCallback, type ReactNode } from "react";
import { GalaxyViewportContext } from "./viewportContext";

export interface GalaxyViewportProviderProps {
    children: ReactNode;
    initialFocusId?: string;
}

export function GalaxyViewportProvider({
    children,
    initialFocusId = "home",
}: GalaxyViewportProviderProps) {
    const [focusId, setFocusId] = useState<string>(initialFocusId);
    const [selectedMoonId, setSelectedMoonId] = useState<string | undefined>(undefined);
    const selectHandlerRef = useRef<((id: string) => void) | null>(null);

    const registerSelectHandler = useCallback((handler: (id: string) => void) => {
        selectHandlerRef.current = handler;
        return () => {
            if (selectHandlerRef.current === handler) {
                selectHandlerRef.current = null;
            }
        };
    }, []);

    const handleSelect = useCallback((id: string) => {
        if (selectHandlerRef.current) {
            selectHandlerRef.current(id);
        } else {
            setFocusId(id);
        }
    }, []);

    return (
        <GalaxyViewportContext.Provider
            value={{
                focusId,
                setFocusId,
                selectedMoonId,
                setSelectedMoonId,
                handleSelect,
                registerSelectHandler,
            }}
        >
            {children}
        </GalaxyViewportContext.Provider>
    );
}
