import { useState, useRef, useCallback, useEffect, type ReactNode } from "react";
import { createPortal } from "react-dom";

export interface TooltipProps {
    text: string;
    children?: ReactNode;
}

export function Tooltip({ text, children }: TooltipProps) {
    const [isVisible, setIsVisible] = useState(false);
    const wrapperRef = useRef<HTMLSpanElement>(null);
    const [coords, setCoords] = useState<{ top: number; left: number }>({ top: 0, left: 0 });

    const updateCoords = useCallback(() => {
        if (wrapperRef.current) {
            const rect = wrapperRef.current.getBoundingClientRect();
            const bubbleWidth = 220;
            const padding = 12;

            let top = rect.top;
            let left = rect.right;

            if (left - bubbleWidth < padding) {
                left = bubbleWidth + padding;
            } else if (left > window.innerWidth - padding) {
                left = window.innerWidth - padding;
            }

            if (top < 80) {
                top = rect.bottom + 36;
            }

            setCoords({ top, left });
        }
    }, []);

    const show = () => {
        updateCoords();
        setIsVisible(true);
    };

    const hide = () => {
        setIsVisible(false);
    };

    const handlePointerEnter = (e: React.PointerEvent) => {
        if (e.pointerType === "mouse") {
            show();
        }
    };

    const handlePointerLeave = (e: React.PointerEvent) => {
        if (e.pointerType === "mouse") {
            hide();
        }
    };

    const handleClick = (e: React.MouseEvent) => {
        e.stopPropagation();
        if (window.matchMedia("(pointer: coarse)").matches || !isVisible) {
            show();
        }
    };

    useEffect(() => {
        if (!isVisible) return;
        const handleOutside = (e: Event) => {
            if (wrapperRef.current && !wrapperRef.current.contains(e.target as Node)) {
                setIsVisible(false);
            }
        };

        window.addEventListener("pointerdown", handleOutside);
        window.addEventListener("scroll", hide, true);
        window.addEventListener("resize", hide);

        return () => {
            window.removeEventListener("pointerdown", handleOutside);
            window.removeEventListener("scroll", hide, true);
            window.removeEventListener("resize", hide);
        };
    }, [isVisible]);

    return (
        <span
            ref={wrapperRef}
            className="ui-tooltip-wrapper"
            onPointerEnter={handlePointerEnter}
            onPointerLeave={handlePointerLeave}
            onFocus={show}
            onBlur={hide}
            onClick={handleClick}
            tabIndex={0}
            role="note"
            aria-label={text}
        >
            {children ?? (
                <span className="ui-tooltip-icon" aria-hidden="true">
                    ?
                </span>
            )}
            {isVisible &&
                typeof document !== "undefined" &&
                createPortal(
                    <span
                        className="ui-tooltip-bubble"
                        role="tooltip"
                        style={{
                            top: `${coords.top}px`,
                            left: `${coords.left}px`,
                        }}
                    >
                        {text}
                    </span>,
                    document.body
                )}
        </span>
    );
}

export default Tooltip;
