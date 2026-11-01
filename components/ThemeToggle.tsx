"use client";

import { useSyncExternalStore } from "react";
import { currentTheme, setTheme, subscribeToTheme } from "@/lib/theme";

export function ThemeToggle() {
  const dark = useSyncExternalStore(
    subscribeToTheme,
    () => currentTheme() === "dark",
    () => false,
  );

  return (
    <button
      type="button"
      aria-pressed={dark}
      onClick={() => setTheme(dark ? "light" : "dark")}
      className="text-muted hover:text-fg aria-pressed:text-accent rounded px-2 py-1 text-sm"
    >
      dark theme
    </button>
  );
}
