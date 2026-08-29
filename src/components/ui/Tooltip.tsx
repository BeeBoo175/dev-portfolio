import { useState, type ReactNode } from "react";

export interface TooltipProps {
    text: string;
    children?: ReactNode;
}

export function Tooltip({ text, children }: TooltipProps) {
    const [isVisible, setIsVisible] = useState(false);

    return (
        <span
            className="ui-tooltip-wrapper"
            onMouseEnter={() => setIsVisible(true)}
            onMouseLeave={() => setIsVisible(false)}
            onFocus={() => setIsVisible(true)}
            onBlur={() => setIsVisible(false)}
            tabIndex={0}
            role="note"
            aria-label={text}
        >
            {children ?? (
                <span className="ui-tooltip-icon" aria-hidden="true">
                    ?
                </span>
            )}
            {isVisible && (
                <span className="ui-tooltip-bubble" role="tooltip">
                    {text}
                </span>
            )}
        </span>
    );
}

export default Tooltip;
