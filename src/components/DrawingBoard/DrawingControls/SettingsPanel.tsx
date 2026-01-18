import { useState, useEffect } from "react";
import { Separator } from "@/components/ui/separator";
import { ThemeSelector } from "./ThemeSelector";
import { ZoomControls } from "./ZoomControls";
import { CanvasBackgroundColorPicker } from "./CanvasBackgroundColorPicker";
import { UndoRedoControls } from "./UndoRedoControls";

type Theme = "light" | "dark" | "system";

interface SettingsPanelProps {
  onClearClick: () => void;
}

// Determine current effective theme
const getEffectiveTheme = (theme: Theme): "light" | "dark" => {
  if (theme === "system") {
    return window.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light";
  }
  return theme;
};

export function SettingsPanel({ onClearClick }: SettingsPanelProps) {
  const [theme, setTheme] = useState<Theme>(() => {
    if (typeof window !== "undefined") {
      const stored = localStorage.getItem("theme") as Theme | null;
      return stored || "dark";
    }
    return "dark";
  });

  const effectiveTheme = getEffectiveTheme(theme);

  // Apply theme
  useEffect(() => {
    const root = document.documentElement;
    const body = document.body;
    
    if (theme === "system") {
      const prefersDark = window.matchMedia("(prefers-color-scheme: dark)").matches;
      if (prefersDark) {
        root.classList.add("dark");
        body.classList.add("dark");
      } else {
        root.classList.remove("dark");
        body.classList.remove("dark");
      }
    } else if (theme === "dark") {
      root.classList.add("dark");
      body.classList.add("dark");
    } else {
      root.classList.remove("dark");
      body.classList.remove("dark");
    }
    
    localStorage.setItem("theme", theme);
  }, [theme]);

  return (
    <div
      className="fixed left-4 top-16 z-30 flex flex-col gap-3 bg-card/80 backdrop-blur-sm border border-border rounded-lg p-4 shadow-lg w-72 max-w-[calc(100vw-2rem)] max-h-[calc(100vh-5rem)] overflow-y-auto"
      role="complementary"
      aria-label="Settings"
    >
      <UndoRedoControls onClearClick={onClearClick} />
      <Separator />
      <ThemeSelector theme={theme} onThemeChange={setTheme} />
      <Separator />
      <ZoomControls />
      <Separator />
      <CanvasBackgroundColorPicker effectiveTheme={effectiveTheme} />
    </div>
  );
}
