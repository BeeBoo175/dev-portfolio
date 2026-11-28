import { useCallback, useEffect, useSyncExternalStore } from "react";
import { statusStore } from "../store";
import type { StatusSnapshot } from "../types";

const SERVER_SNAPSHOT: StatusSnapshot = { state: "checking", report: null, exhausted: false, refreshing: false };

/** The live state of a project's demo, asked for in the background without holding up the page. */
export function useProjectStatus(url: string) {
    // a stable subscription: a new one every render would look like the last watcher leaving
    const subscribe = useCallback((listener: () => void) => statusStore.subscribe(url, listener), [url]);
    const snapshot = useSyncExternalStore(
        subscribe,
        () => statusStore.getSnapshot(url),
        () => SERVER_SNAPSHOT
    );

    useEffect(() => {
        statusStore.start(url);
    }, [url]);

    const recheck = useCallback(() => statusStore.recheck(url), [url]);

    return { ...snapshot, recheck };
}
