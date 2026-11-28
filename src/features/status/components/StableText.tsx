/**
 * Text that never resizes its box: every possible wording is laid in the same cell, unseen, and the current
 * one fades in over them.
 */
export function StableText({ text, variants }: { text: string; variants: readonly string[] }) {
    return (
        <span className="stable-text">
            {variants.map((variant) => (
                <span key={variant} className="stable-text__room" aria-hidden="true">
                    {variant}
                </span>
            ))}
            <span key={text} className="stable-text__now">
                {text}
            </span>
        </span>
    );
}

export default StableText;
