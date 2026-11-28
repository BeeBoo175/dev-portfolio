import { useProjectStatus } from "../hooks/useProjectStatus";
import { describeStatus, isBusy } from "../utils/statusModel";
import { StatusMark } from "./StatusMark";
import "./Status.css";

/** A mark and a few words for a project's demo. Plain text, so it can sit inside the project's own link. */
export function StatusBadge({ url }: { url: string }) {
    const snapshot = useProjectStatus(url);
    const text = describeStatus(snapshot);

    return (
        <span className={`status-badge status-badge--${snapshot.state}`}>
            <StatusMark busy={isBusy(snapshot)} />
            <span key={text} className="status-badge__label">
                <span className="sr-only">Demo status: </span>
                {text}
            </span>
        </span>
    );
}

export default StatusBadge;
