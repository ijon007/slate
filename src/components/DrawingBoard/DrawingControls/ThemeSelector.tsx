import { Sun, Moon, Monitor } from "@phosphor-icons/react";
import { cn } from "@/lib/utils";

type Theme = "light" | "dark" | "system";

interface ThemeSelectorProps {
  theme: Theme;
  onThemeChange: (theme: Theme) => void;
}

export function ThemeSelector({ theme, onThemeChange }: ThemeSelectorProps) {
  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <div className="text-xs font-medium">Theme</div>
        <div className="flex gap-1 rounded-md border border-border p-1">
          <button
            className={cn(
              "size-6 rounded flex items-center justify-center transition-all cursor-pointer",
              theme === "light"
                ? "bg-primary text-primary-foreground"
                : "hover:bg-muted"
            )}
            onClick={() => onThemeChange("light")}
            aria-label="Light theme"
            title="Light theme"
          >
            <Sun className="size-4" />
          </button>
          <button
            className={cn(
              "size-6 rounded flex items-center justify-center transition-all cursor-pointer",
              theme === "dark"
                ? "bg-primary text-primary-foreground"
                : "hover:bg-muted"
            )}
            onClick={() => onThemeChange("dark")}
            aria-label="Dark theme"
            title="Dark theme"
          >
            <Moon className="size-4" />
          </button>
          <button
            className={cn(
              "size-6 rounded flex items-center justify-center transition-all cursor-pointer",
              theme === "system"
                ? "bg-primary text-primary-foreground"
                : "hover:bg-muted"
            )}
            onClick={() => onThemeChange("system")}
            aria-label="System theme"
            title="System theme"
          >
            <Monitor className="size-4" />
          </button>
        </div>
      </div>
    </div>
  );
}
