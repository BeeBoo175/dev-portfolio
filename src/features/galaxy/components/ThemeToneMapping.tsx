import { useLayoutEffect } from "react";
import { useThree } from "@react-three/fiber";
import * as THREE from "three";

/**
 * The film-style tone curve suits glows on a night sky, but it greys every pale colour, so by day the
 * scene shows the palette exactly as the page does. Set here because the canvas only reads its own
 * "flat" prop when it is first made, not when the theme changes.
 */
export function ThemeToneMapping({ isLight }: { isLight: boolean }) {
    // read through the store getter: the renderer is a mutable object, not React state
    const get = useThree((state) => state.get);

    useLayoutEffect(() => {
        get().gl.toneMapping = isLight ? THREE.NoToneMapping : THREE.ACESFilmicToneMapping;
    }, [get, isLight]);

    return null;
}

export default ThemeToneMapping;
