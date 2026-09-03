import { useSyncExternalStore } from "react";
import type { ThemeMode } from "./types";

const THEME_STORAGE_KEY = "portfolio_theme_mode_v1";

function getInitialTheme(): ThemeMode {
    try {
        const stored = localStorage.getItem(THEME_STORAGE_KEY);
        if (stored === "light" || stored === "dark") {
            return stored;
        }
    } catch {
        return "dark";
    }
    return "dark";
}

function applyThemeToDom(mode: ThemeMode) {
    if (typeof document === "undefined") return;
    document.documentElement.setAttribute("data-theme", mode);
    if (mode === "light") {
        document.body.classList.add("light-theme");
        document.body.classList.remove("dark-theme");
    } else {
        document.body.classList.add("dark-theme");
        document.body.classList.remove("light-theme");
    }
}

class ThemeStore {
    private mode: ThemeMode = getInitialTheme();
    private listeners = new Set<() => void>();

    constructor() {
        applyThemeToDom(this.mode);
    }

    getSnapshot = () => {
        return this.mode;
    };

    subscribe = (listener: () => void) => {
        this.listeners.add(listener);
        return () => {
            this.listeners.delete(listener);
        };
    };

    setTheme(mode: ThemeMode) {
        if (this.mode === mode) return;
        this.mode = mode;
        applyThemeToDom(mode);
        try {
            localStorage.setItem(THEME_STORAGE_KEY, mode);
        } catch {
            void 0;
        }
        this.listeners.forEach((l) => l());
    }

    toggleTheme() {
        this.setTheme(this.mode === "dark" ? "light" : "dark");
    }
}

export const themeStore = new ThemeStore();

export function useTheme(): {
    mode: ThemeMode;
    isLight: boolean;
    setTheme: (mode: ThemeMode) => void;
    toggleTheme: () => void;
} {
    const mode = useSyncExternalStore(themeStore.subscribe, themeStore.getSnapshot);
    return {
        mode,
        isLight: mode === "light",
        setTheme: (nextMode: ThemeMode) => themeStore.setTheme(nextMode),
        toggleTheme: () => themeStore.toggleTheme(),
    };
}
