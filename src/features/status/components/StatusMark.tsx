import { SpinnerIcon } from "../../../components/ui/Icons";

/** A state's coloured dot, or a spinner while it is still being worked out. Both take the same space. */
export function StatusMark({ busy }: { busy: boolean }) {
    return (
        <span className="status-mark" aria-hidden="true">
            {busy ? <SpinnerIcon size={14} strokeWidth={2.25} className="status-mark__spinner" /> : <span className="status-mark__dot" />}
        </span>
    );
}

export default StatusMark;
