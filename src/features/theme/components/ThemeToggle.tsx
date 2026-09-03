import { useTheme } from "../store";
import "./ThemeToggle.css";

export interface ThemeToggleProps {
    className?: string;
}

export function ThemeToggle({ className = "" }: ThemeToggleProps) {
    const { mode, toggleTheme } = useTheme();
    const isLight = mode === "light";

    return (
        <button
            type="button"
            className={`theme-toggle-btn ${isLight ? "theme-toggle-btn--light" : "theme-toggle-btn--dark"} ${className}`}
            onClick={toggleTheme}
            aria-label={isLight ? "Switch to Galaxy Theme" : "Switch to Blueprint Theme"}
            title={isLight ? "Theme: Blueprint (Click for Galaxy)" : "Theme: Galaxy (Click for Blueprint)"}
            aria-pressed={isLight}
        >
            <span className="theme-toggle-btn__text">
                {isLight ? "Theme: Blueprint" : "Theme: Galaxy"}
            </span>
        </button>
    );
}

export default ThemeToggle;
