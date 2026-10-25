import { AlertIcon } from "../ui/Icons";
import "./Fallbacks.css";

export function PageLoading() {
    return (
        <p className="system-notice system-notice--center" role="status">
            Loading…
        </p>
    );
}

export function PageFailed() {
    return (
        <div className="system-notice system-notice--center" role="alert">
            <p>
                <AlertIcon /> This page didn’t load. Check your connection and try again.
            </p>
            <button type="button" className="pill pill--primary" onClick={() => window.location.reload()}>
                Reload
            </button>
        </div>
    );
}
