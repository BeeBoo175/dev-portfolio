import { useEffect, useRef, useCallback } from "react";
import { galaxyStore } from "../../galaxy";
import { DRAFT_STORAGE_KEY } from "../utils/draftUtils";
import type { GalaxyDraftState } from "../types";

export function useDraftPersistence(
    currentDraft: GalaxyDraftState,
    currentDraftRef: React.RefObject<GalaxyDraftState>,
    isDirty: boolean,
    onInteractionRelease?: () => void
) {
    const isSavedRef = useRef<boolean>(false);
    const isExplicitDiscardRef = useRef<boolean>(false);

    useEffect(() => {
        if (isExplicitDiscardRef.current) return;

        if (isDirty) {
            const timer = setTimeout(() => {
                try {
                    const serialized = JSON.stringify(currentDraft);
                    sessionStorage.setItem(DRAFT_STORAGE_KEY, serialized);
                    localStorage.setItem(DRAFT_STORAGE_KEY, serialized);
                } catch (e) {
                    void e;
                }
            }, 300);
            return () => clearTimeout(timer);
        } else {
            try {
                sessionStorage.removeItem(DRAFT_STORAGE_KEY);
                localStorage.removeItem(DRAFT_STORAGE_KEY);
            } catch (e) {
                void e;
            }
        }
    }, [currentDraft, isDirty]);

    useEffect(() => {
        const handleInteractionRelease = () => {
            const current = currentDraftRef.current;
            if (!isExplicitDiscardRef.current) {
                try {
                    const serialized = JSON.stringify(current);
                    sessionStorage.setItem(DRAFT_STORAGE_KEY, serialized);
                    localStorage.setItem(DRAFT_STORAGE_KEY, serialized);
                } catch (e) {
                    void e;
                }
            }
            onInteractionRelease?.();
        };

        window.addEventListener("pointerup", handleInteractionRelease, { capture: true });
        window.addEventListener("mouseup", handleInteractionRelease, { capture: true });
        window.addEventListener("touchend", handleInteractionRelease, { capture: true });
        window.addEventListener("change", handleInteractionRelease, { capture: true });

        return () => {
            window.removeEventListener("pointerup", handleInteractionRelease, { capture: true });
            window.removeEventListener("mouseup", handleInteractionRelease, { capture: true });
            window.removeEventListener("touchend", handleInteractionRelease, { capture: true });
            window.removeEventListener("change", handleInteractionRelease, { capture: true });
        };
    }, [currentDraftRef, onInteractionRelease]);

    useEffect(() => {
        const handleBeforeUnload = (e: BeforeUnloadEvent) => {
            if (isDirty) {
                e.preventDefault();
            }
        };
        window.addEventListener("beforeunload", handleBeforeUnload);
        return () => window.removeEventListener("beforeunload", handleBeforeUnload);
    }, [isDirty]);

    useEffect(() => {
        return () => {
            if (!isSavedRef.current) {
                galaxyStore.revertToPersisted();
            }
        };
    }, []);

    const markSaved = useCallback(() => {
        isSavedRef.current = true;
        try {
            const serialized = JSON.stringify(currentDraftRef.current);
            sessionStorage.setItem(DRAFT_STORAGE_KEY, serialized);
            localStorage.setItem(DRAFT_STORAGE_KEY, serialized);
        } catch (e) {
            void e;
        }
    }, [currentDraftRef]);

    const handleConfirmDiscardAndExit = useCallback(() => {
        isExplicitDiscardRef.current = true;
        try {
            sessionStorage.removeItem(DRAFT_STORAGE_KEY);
            localStorage.removeItem(DRAFT_STORAGE_KEY);
        } catch (e) {
            void e;
        }
        galaxyStore.revertToPersisted();
    }, []);

    const clearDraftStorage = useCallback(() => {
        isSavedRef.current = true;
        isExplicitDiscardRef.current = true;
        try {
            sessionStorage.removeItem(DRAFT_STORAGE_KEY);
            localStorage.removeItem(DRAFT_STORAGE_KEY);
        } catch (e) {
            void e;
        }
    }, []);

    return {
        isSavedRef,
        isExplicitDiscardRef,
        markSaved,
        handleConfirmDiscardAndExit,
        clearDraftStorage,
    };
}

export default useDraftPersistence;
