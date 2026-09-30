"use client";

import { useEffect, useState, useRef } from "react";
import { Moon, Sun, Desktop, Check } from "@phosphor-icons/react/dist/ssr";
import { cn } from "@/lib/cn";

export type ThemeMode = "light" | "dark" | "system";

export function useTheme() {
  const [mode, setMode] = useState<ThemeMode>("system");
  const [resolvedDark, setResolvedDark] = useState<boolean>(false);

  useEffect(() => {
    let saved: ThemeMode = "system";
    try {
      const val = localStorage.getItem("pab-theme") as ThemeMode | null;
      if (val === "light" || val === "dark" || val === "system") {
        saved = val;
      }
    } catch {}
    setMode(saved);

    const mql = window.matchMedia("(prefers-color-scheme: dark)");

    function apply(currentMode: ThemeMode) {
      const isDark = currentMode === "dark" || (currentMode === "system" && mql.matches);
      document.documentElement.classList.toggle("dark", isDark);
      document.documentElement.setAttribute("data-theme", currentMode);
      setResolvedDark(isDark);
    }

    apply(saved);

    function handleSystemChange() {
      const current = (localStorage.getItem("pab-theme") as ThemeMode) || "system";
      if (current === "system") {
        apply("system");
      }
    }

    mql.addEventListener("change", handleSystemChange);
    return () => mql.removeEventListener("change", handleSystemChange);
  }, []);

  function setTheme(newMode: ThemeMode) {
    setMode(newMode);
    try {
      localStorage.setItem("pab-theme", newMode);
    } catch {}

    const prefersDark = window.matchMedia("(prefers-color-scheme: dark)").matches;
    const isDark = newMode === "dark" || (newMode === "system" && prefersDark);
    document.documentElement.classList.toggle("dark", isDark);
    document.documentElement.setAttribute("data-theme", newMode);
    setResolvedDark(isDark);
  }

  return { mode, resolvedDark, setTheme };
}

export function ThemeToggle({ className }: { className?: string }) {
  const { mode, resolvedDark, setTheme } = useTheme();
  const [menuOpen, setMenuOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setMenuOpen(false);
      }
    }
    if (menuOpen) {
      document.addEventListener("mousedown", handleClickOutside);
    }
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [menuOpen]);

  return (
    <div className={cn("relative inline-block", className)} ref={containerRef}>
      <button
        type="button"
        onClick={() => setMenuOpen(!menuOpen)}
        aria-label="Changer le thème (Clair, Sombre, Système)"
        aria-expanded={menuOpen}
        className="flex h-9 w-9 cursor-pointer items-center justify-center rounded-xl border border-border bg-surface text-muted-foreground transition hover:bg-surface-2 hover:text-foreground active:scale-95 shadow-sm"
      >
        {mode === "system" ? (
          <Desktop size={17} weight="bold" />
        ) : resolvedDark ? (
          <Moon size={17} weight="bold" />
        ) : (
          <Sun size={17} weight="bold" />
        )}
      </button>

      {menuOpen && (
        <div className="absolute right-0 top-full mt-2 w-36 overflow-hidden rounded-xl border border-border bg-surface p-1 shadow-xl z-50 animate-in fade-in zoom-in-95 duration-100">
          <button
            type="button"
            onClick={() => {
              setTheme("light");
              setMenuOpen(false);
            }}
            className={cn(
              "flex w-full items-center justify-between rounded-lg px-2.5 py-1.5 text-xs font-medium transition",
              mode === "light"
                ? "bg-primary/10 text-primary font-bold"
                : "text-foreground hover:bg-surface-2"
            )}
          >
            <span className="flex items-center gap-2">
              <Sun size={15} weight={mode === "light" ? "bold" : "regular"} />
              Clair
            </span>
            {mode === "light" && <Check size={13} weight="bold" />}
          </button>

          <button
            type="button"
            onClick={() => {
              setTheme("dark");
              setMenuOpen(false);
            }}
            className={cn(
              "flex w-full items-center justify-between rounded-lg px-2.5 py-1.5 text-xs font-medium transition",
              mode === "dark"
                ? "bg-primary/10 text-primary font-bold"
                : "text-foreground hover:bg-surface-2"
            )}
          >
            <span className="flex items-center gap-2">
              <Moon size={15} weight={mode === "dark" ? "bold" : "regular"} />
              Sombre
            </span>
            {mode === "dark" && <Check size={13} weight="bold" />}
          </button>

          <button
            type="button"
            onClick={() => {
              setTheme("system");
              setMenuOpen(false);
            }}
            className={cn(
              "flex w-full items-center justify-between rounded-lg px-2.5 py-1.5 text-xs font-medium transition",
              mode === "system"
                ? "bg-primary/10 text-primary font-bold"
                : "text-foreground hover:bg-surface-2"
            )}
          >
            <span className="flex items-center gap-2">
              <Desktop size={15} weight={mode === "system" ? "bold" : "regular"} />
              Système
            </span>
            {mode === "system" && <Check size={13} weight="bold" />}
          </button>
        </div>
      )}
    </div>
  );
}
