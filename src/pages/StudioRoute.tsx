import { lazy } from "react";
import { useSceneStatus } from "../features/galaxy";
import { StudioUnavailable } from "./StudioUnavailable";

// most visitors never open the editor, so it is not part of their download
const StudioPage = lazy(() => import("./StudioPage"));

export function StudioRoute() {
    const status = useSceneStatus();
    return status === "ready" ? <StudioPage /> : <StudioUnavailable status={status} />;
}

export default StudioRoute;
