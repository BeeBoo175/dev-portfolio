import { useState, useRef, useEffect, useCallback } from "react";
import type { GalaxyDraftState } from "../types";

export function useDraftHistory(
    initialDraft: GalaxyDraftState,
    currentDraftRef: React.RefObject<GalaxyDraftState>,
    applyStateDirect: (state: GalaxyDraftState) => void,
    showToast: (msg: string) => void
) {
    const [history, setHistory] = useState<GalaxyDraftState[]>([structuredClone(initialDraft)]);
    const [historyIndex, setHistoryIndex] = useState<number>(0);
    const isHistoryAction = useRef<boolean>(false);
    const historyIndexRef = useRef<number>(0);
    const historyRef = useRef<GalaxyDraftState[]>([structuredClone(initialDraft)]);

    useEffect(() => {
        historyIndexRef.current = historyIndex;
        historyRef.current = history;
    }, [historyIndex, history]);

    const pushHistory = useCallback((nextState: GalaxyDraftState) => {
        if (isHistoryAction.current) {
            isHistoryAction.current = false;
            return;
        }

        setHistory((prev) => {
            const nextHistory = prev.slice(0, historyIndexRef.current + 1);
            if (JSON.stringify(nextHistory[nextHistory.length - 1]) === JSON.stringify(nextState)) {
                return prev;
            }
            const updated = [...nextHistory.slice(-40), structuredClone(nextState)];
            const newIdx = updated.length - 1;
            historyIndexRef.current = newIdx;
            historyRef.current = updated;
            setHistoryIndex(newIdx);
            return updated;
        });
    }, []);

    const handleUndo = useCallback(() => {
        const current = currentDraftRef.current;
        const curHistory = historyRef.current;
        const curIdx = historyIndexRef.current;
        const latestCommitted = curHistory[curIdx];

        if (JSON.stringify(current) !== JSON.stringify(latestCommitted)) {
            const nextHistory = curHistory.slice(0, curIdx + 1);
            const updated = [...nextHistory.slice(-40), structuredClone(current)];
            const newIndex = updated.length - 1;
            historyRef.current = updated;
            historyIndexRef.current = newIndex;
            setHistory(updated);
            setHistoryIndex(newIndex);
        }

        const activeIdx = historyIndexRef.current;
        const activeHistory = historyRef.current;

        if (activeIdx > 0) {
            const prevIndex = activeIdx - 1;
            const targetState = activeHistory[prevIndex];
            if (targetState) {
                isHistoryAction.current = true;
                historyIndexRef.current = prevIndex;
                setHistoryIndex(prevIndex);
                applyStateDirect(targetState);
                showToast("Undo");
            }
        }
    }, [applyStateDirect, currentDraftRef, showToast]);

    const handleRedo = useCallback(() => {
        const curIdx = historyIndexRef.current;
        const curHistory = historyRef.current;
        if (curIdx < curHistory.length - 1) {
            const nextIndex = curIdx + 1;
            const targetState = curHistory[nextIndex];
            if (targetState) {
                isHistoryAction.current = true;
                historyIndexRef.current = nextIndex;
                setHistoryIndex(nextIndex);
                applyStateDirect(targetState);
                showToast("Redo");
            }
        }
    }, [applyStateDirect, showToast]);

    useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            const isZ = e.key === "z" || e.key === "Z" || e.code === "KeyZ";
            const isY = e.key === "y" || e.key === "Y" || e.code === "KeyY";
            if ((e.ctrlKey || e.metaKey) && (isZ || isY)) {
                e.preventDefault();
                e.stopPropagation();
                if (isZ) {
                    if (e.shiftKey) {
                        handleRedo();
                    } else {
                        handleUndo();
                    }
                } else if (isY) {
                    handleRedo();
                }
            }
        };

        window.addEventListener("keydown", handleKeyDown, { capture: true });
        return () => window.removeEventListener("keydown", handleKeyDown, { capture: true });
    }, [handleUndo, handleRedo]);

    const commitOnRelease = useCallback(() => {
        const current = currentDraftRef.current;
        const curHistory = historyRef.current;
        const curIdx = historyIndexRef.current;
        const latestCommitted = curHistory[curIdx];

        if (JSON.stringify(current) !== JSON.stringify(latestCommitted)) {
            pushHistory(current);
        }
    }, [currentDraftRef, pushHistory]);

    return {
        canUndo: historyIndex > 0,
        canRedo: historyIndex < history.length - 1,
        pushHistory,
        handleUndo,
        handleRedo,
        commitOnRelease,
    };
}

export default useDraftHistory;
