import { useRef } from "react";
import { useModalFocusTrap } from "../hooks/useModalFocusTrap";

export interface StudioConfirmExitDialogProps {
    isOpen: boolean;
    onClose: () => void;
    onKeepDraftAndExit: () => void;
    onDiscardAndExit: () => void;
}

export function StudioConfirmExitDialog({
    isOpen,
    onClose,
    onKeepDraftAndExit,
    onDiscardAndExit,
}: StudioConfirmExitDialogProps) {
    const dialogRef = useRef<HTMLDivElement | null>(null);
    useModalFocusTrap(isOpen, onClose, dialogRef);

    if (!isOpen) return null;

    return (
        <div
            className="studio-modal-backdrop"
            onClick={onClose}
        >
            <div
                ref={dialogRef}
                className="studio-confirm-dialog"
                onClick={(e) => e.stopPropagation()}
                role="dialog"
                aria-modal="true"
                aria-labelledby="studio-confirm-title"
                aria-describedby="studio-confirm-text"
                tabIndex={-1}
            >
                <div className="studio-confirm-title" id="studio-confirm-title">
                    Unapplied Changes
                </div>
                <div className="studio-confirm-text" id="studio-confirm-text">
                    You have working modifications in Galaxy Studio. Would you like to keep your draft saved locally for your next session or discard it?
                </div>
                <div className="studio-confirm-actions">
                    <button
                        type="button"
                        className="studio-btn studio-btn--ghost studio-btn--sm"
                        onClick={onClose}
                    >
                        Keep Editing
                    </button>
                    <button
                        type="button"
                        className="studio-btn studio-btn--secondary studio-btn--sm"
                        onClick={onKeepDraftAndExit}
                        title="Exit to portfolio now. Your in-progress edits will remain safely saved in draft for when you return."
                    >
                        Keep Draft & Exit
                    </button>
                    <button
                        type="button"
                        className="studio-btn studio-btn--danger studio-btn--sm"
                        onClick={onDiscardAndExit}
                        title="Permanently discard all unapplied draft changes and revert to your published galaxy"
                    >
                        Discard & Exit
                    </button>
                </div>
            </div>
        </div>
    );
}

export default StudioConfirmExitDialog;
