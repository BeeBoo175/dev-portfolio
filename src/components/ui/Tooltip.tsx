import { useState, useRef, useEffect, type ReactNode } from "react";

export interface TooltipProps {
    text: string;
    children?: ReactNode;
}

export function Tooltip({ text, children }: TooltipProps) {
    const [isVisible, setIsVisible] = useState(false);
    const wrapperRef = useRef<HTMLSpanElement>(null);
    const [coords, setCoords] = useState<{ top: number; left: number }>({ top: 0, left: 0 });

    useEffect(() => {
        if (isVisible && wrapperRef.current) {
            const rect = wrapperRef.current.getBoundingClientRect();
            setCoords({
                top: rect.top,
                left: rect.right,
            });
        }
    }, [isVisible]);

    return (
        <span
            ref={wrapperRef}
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
                <span
                    className="ui-tooltip-bubble"
                    role="tooltip"
                    style={{
                        top: `${coords.top}px`,
                        left: `${coords.left}px`,
                    }}
                >
                    {text}
                </span>
            )}
        </span>
    );
}

export default Tooltip;
