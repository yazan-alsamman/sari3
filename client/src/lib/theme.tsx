"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";

export type AppTheme = "dark" | "light";

const THEME_KEY = "sareee-theme-v1";

interface ThemeCtx {
  theme: AppTheme;
  toggleTheme: () => void;
  setTheme: (t: AppTheme) => void;
}

const ThemeContext = createContext<ThemeCtx | null>(null);

function applyDomTheme(theme: AppTheme) {
  if (typeof document === "undefined") return;
  document.documentElement.setAttribute("data-theme", theme);
  document.documentElement.classList.toggle("dark", theme === "dark");
  document.documentElement.classList.toggle("light", theme === "light");
}

function readSavedTheme(): AppTheme {
  if (typeof window === "undefined") return "dark";
  try {
    const saved = localStorage.getItem(THEME_KEY) as AppTheme | null;
    if (saved === "light" || saved === "dark") return saved;
  } catch {
    /* ignore */
  }
  return "dark";
}

export function ThemeProvider({ children }: { children: ReactNode }) {
  const [theme, setThemeState] = useState<AppTheme>("dark");

  useEffect(() => {
    const saved = readSavedTheme();
    setThemeState(saved);
    applyDomTheme(saved);
  }, []);

  const setTheme = useCallback((t: AppTheme) => {
    setThemeState(t);
    applyDomTheme(t);
    try {
      localStorage.setItem(THEME_KEY, t);
    } catch {
      /* ignore */
    }
    try {
      const meta = document.querySelector('meta[name="theme-color"]');
      if (meta) {
        meta.setAttribute("content", t === "light" ? "#d5e0ef" : "#07111f");
      }
    } catch {
      /* ignore */
    }
  }, []);

  const toggleTheme = useCallback(() => {
    setTheme(theme === "dark" ? "light" : "dark");
  }, [setTheme, theme]);

  const value = useMemo(
    () => ({ theme, toggleTheme, setTheme }),
    [theme, toggleTheme, setTheme],
  );

  return (
    <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>
  );
}

/** Safe even outside ThemeProvider (e.g. /admin route). */
export function useTheme(): ThemeCtx {
  const ctx = useContext(ThemeContext);
  const [localTheme, setLocalTheme] = useState<AppTheme>("dark");

  useEffect(() => {
    if (ctx) return;
    const saved = readSavedTheme();
    setLocalTheme(saved);
    applyDomTheme(saved);
  }, [ctx]);

  const setThemeLocal = useCallback((t: AppTheme) => {
    setLocalTheme(t);
    applyDomTheme(t);
    try {
      localStorage.setItem(THEME_KEY, t);
    } catch {
      /* ignore */
    }
  }, []);

  const toggleLocal = useCallback(() => {
    setThemeLocal(localTheme === "dark" ? "light" : "dark");
  }, [localTheme, setThemeLocal]);

  if (ctx) return ctx;
  return {
    theme: localTheme,
    setTheme: setThemeLocal,
    toggleTheme: toggleLocal,
  };
}

export function ThemeToggle({ className = "" }: { className?: string }) {
  const { theme, toggleTheme } = useTheme();
  const isDark = theme === "dark";
  return (
    <button
      type="button"
      onClick={toggleTheme}
      className={`inline-flex items-center gap-1.5 rounded-xl border px-2.5 py-1.5 text-xs font-semibold transition ${
        isDark
          ? "border-white/20 bg-white/10 text-slate-100 hover:bg-white/15"
          : "border-[rgba(180,35,51,0.25)] bg-[rgba(255,248,244,0.9)] text-[#16345a] shadow-sm hover:border-[rgba(180,35,51,0.4)]"
      } ${className}`}
      aria-label={isDark ? "تفعيل الوضع الفاتح" : "تفعيل الوضع الداكن"}
      title={isDark ? "وضع فاتح" : "وضع داكن"}
    >
      <span aria-hidden>{isDark ? "☀" : "☾"}</span>
      <span className="hidden sm:inline">{isDark ? "فاتح" : "داكن"}</span>
    </button>
  );
}
