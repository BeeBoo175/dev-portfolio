import { useTheme } from "../store";
import { runThemeTransition } from "../utils/runThemeTransition";
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
            onClick={(event) => {
                const box = event.currentTarget.getBoundingClientRect();
                runThemeTransition(toggleTheme, { x: box.left + box.width / 2, y: box.top + box.height / 2 });
            }}
            aria-label={isLight ? "Switch to dark mode" : "Switch to light mode"}
            title={isLight ? "Active: Light Mode (Click for Dark)" : "Active: Dark Mode (Click for Light)"}
        >
            <span className="theme-toggle-btn__celestial theme-toggle-btn__indicator" aria-hidden="true">
                <span className="theme-toggle-btn__celestial-rays" />
                <span className="theme-toggle-btn__celestial-body theme-toggle-btn__orb" />
            </span>
            <span className="theme-toggle-btn__text">
                {isLight ? "Light" : "Dark"}
            </span>
        </button>
    );
}

export default ThemeToggle;
