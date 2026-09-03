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
            className={`theme-toggle-btn ${className}`}
            onClick={toggleTheme}
            aria-label={isLight ? "Switch to Dark Mode" : "Switch to Blueprint Light Mode"}
            title={isLight ? "Switch to Dark Mode" : "Switch to Blueprint Light Mode"}
            aria-pressed={isLight}
        >
            <span className="theme-toggle-btn__indicator" aria-hidden="true" />
            <span className="theme-toggle-btn__text">
                {isLight ? "Blueprint" : "Cosmic"}
            </span>
        </button>
    );
}

export default ThemeToggle;
