import { useEffect, useRef, useState } from "react";

const FEEDBACK_MS = 2400;

type CopyState = "idle" | "copied" | "failed";

const STATUS: Record<CopyState, string> = {
    idle: "Press to copy",
    copied: "Copied to clipboard",
    failed: "Couldn’t copy. Select the address and copy it.",
};

export function CopyEmailButton({ address }: { address: string }) {
    const [state, setState] = useState<CopyState>("idle");
    const timer = useRef<ReturnType<typeof setTimeout> | null>(null);

    useEffect(() => {
        return () => {
            if (timer.current) clearTimeout(timer.current);
        };
    }, []);

    const handleCopy = async () => {
        if (timer.current) clearTimeout(timer.current);
        try {
            await navigator.clipboard.writeText(address);
            setState("copied");
            timer.current = setTimeout(() => setState("idle"), FEEDBACK_MS);
        } catch {
            // clipboard access can be refused or missing (plain http on a LAN address)
            setState("failed");
        }
    };

    return (
        <div className="sections-overlay__copy">
            <button type="button" className="sections-overlay__cta pill pill--primary" onClick={handleCopy}>
                {address}
            </button>
            <p className="sections-overlay__copy-status" role="status">
                {STATUS[state]}
            </p>
        </div>
    );
}

export default CopyEmailButton;
