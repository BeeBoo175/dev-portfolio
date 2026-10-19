import type * as THREE from "three";

/**
 * Where the scene keeps each body's group, with one ref callback per body for life. New callbacks on
 * each render would defeat memo and re-render every planet whenever the focus changes.
 */
export function createBodyRegistry() {
    const refs: { current: Record<string, THREE.Group | null> } = { current: {} };
    const callbacks = new Map<string, (instance: THREE.Group | null) => void>();

    return {
        refs,
        callbackFor(id: string) {
            let callback = callbacks.get(id);
            if (!callback) {
                callback = (instance) => {
                    refs.current[id] = instance;
                    // the sun answers to both of its names
                    if (id === "home") refs.current.sun = instance;
                };
                callbacks.set(id, callback);
            }
            return callback;
        },
    };
}
