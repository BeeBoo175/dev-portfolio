let answer: boolean | undefined;

/**
 * three.js needs WebGL 2. Asked once per page load, before the 3D code is downloaded.
 * Adding "?no3d" to the address answers no, to try the site as a browser without 3D sees it;
 * reload without it to get the scene back.
 */
export function supportsWebGL(): boolean {
    if (answer === undefined) {
        try {
            answer =
                !new URLSearchParams(window.location.search).has("no3d") &&
                !!document.createElement("canvas").getContext("webgl2");
        } catch {
            answer = false;
        }
    }
    return answer;
}
