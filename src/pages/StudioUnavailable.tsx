import { Link } from "react-router-dom";
import { SCENE_REASONS, type SceneStatus } from "../features/galaxy";
import { AlertIcon } from "../components/ui/Icons";
import "./StudioUnavailable.css";

export function StudioUnavailable({ status }: { status: Exclude<SceneStatus, "ready"> }) {
    return (
        <main className="studio-unavailable">
            <div className="studio-unavailable__card">
                <AlertIcon className="studio-unavailable__icon" size={32} />
                <h1>Galaxy Studio needs 3D</h1>
                <p>{SCENE_REASONS[status]}</p>
                <p>Most of the editor’s controls only show their effect in the 3D scene, so it stays closed.</p>
                <div className="studio-unavailable__actions">
                    <Link to="/" className="pill pill--primary">
                        Back to portfolio
                    </Link>
                    <button type="button" className="pill" onClick={() => window.location.reload()}>
                        Try again
                    </button>
                </div>
            </div>
        </main>
    );
}

export default StudioUnavailable;
