import { useState, useRef, useEffect, memo } from "react";

export interface StudioColorPickerProps {
    id: string;
    label: string;
    value: string;
    onChange: (val: string) => void;
    compact?: boolean;
    showHex?: boolean;
}

export const StudioColorPicker = memo(function StudioColorPicker({
    id,
    label,
    value,
    onChange,
    compact = false,
    showHex = false,
}: StudioColorPickerProps) {
    const [localValue, setLocalValue] = useState(value);
    const rAFRef = useRef<number | null>(null);
    const pendingValRef = useRef<string | null>(null);

    useEffect(() => {
        setLocalValue(value);
    }, [value]);

    useEffect(() => {
        return () => {
            if (rAFRef.current !== null) {
                cancelAnimationFrame(rAFRef.current);
            }
        };
    }, []);

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const val = e.target.value;
        setLocalValue(val);
        pendingValRef.current = val;

        if (rAFRef.current === null) {
            rAFRef.current = requestAnimationFrame(() => {
                rAFRef.current = null;
                if (pendingValRef.current !== null) {
                    onChange(pendingValRef.current);
                    pendingValRef.current = null;
                }
            });
        }
    };

    return (
        <div className={`studio-color-picker ${compact ? "studio-color-picker--compact" : ""}`}>
            <input
                id={id}
                type="color"
                aria-label={label}
                value={localValue}
                onChange={handleChange}
            />
            <label htmlFor={id} className="studio-color-picker__label">{label}</label>
            {showHex && <span className="studio-color-picker__hex">{localValue}</span>}
        </div>
    );
});

export default StudioColorPicker;
