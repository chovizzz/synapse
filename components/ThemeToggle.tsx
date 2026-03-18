"use client";

import { Sun, Moon } from "lucide-react";
import { useTheme } from "@/lib/theme-provider";

export function ThemeToggle() {
  const { theme, toggleTheme } = useTheme();

  return (
    <button
      onClick={toggleTheme}
      className="p-2 rounded-lg transition-colors hover:bg-slate-100 dark:hover:bg-white/5"
      title={theme === "light" ? "切换到深色模式" : "切换到浅色模式"}
      aria-label="切换主题"
    >
      {theme === "light" ? (
        <Moon size={16} className="text-slate-500" />
      ) : (
        <Sun size={16} className="text-slate-400" />
      )}
    </button>
  );
}
