import { cn } from "@/lib/utils";
import { useStore } from "@/lib/storage/store";

const CANVAS_BACKGROUND_COLORS_DARK = [
  { name: "Original Dark", color: "#0a0a0a" },
  { name: "Default Dark", color: "#1a1a1a" },
  { name: "Dark Gray", color: "#2a2a2a" },
  { name: "Dark Neutral", color: "#1e1e1e" },
  { name: "Dark Brown", color: "#2a1f1a" },
  { name: "Dark Red", color: "#1a0f0f" },
];

const CANVAS_BACKGROUND_COLORS_LIGHT = [
  { name: "Original Light", color: "#ffffff" },
  { name: "Light Gray", color: "#f5f5f5" },
  { name: "Light Neutral", color: "#fafafa" },
  { name: "Light Beige", color: "#faf8f5" },
  { name: "Light Pink", color: "#faf5f5" },
  { name: "Light Blue", color: "#f5f5fa" },
];

interface CanvasBackgroundColorPickerProps {
  effectiveTheme: "light" | "dark";
}

export function CanvasBackgroundColorPicker({ effectiveTheme }: CanvasBackgroundColorPickerProps) {
  const {
    canvasBackgroundColorDark,
    canvasBackgroundColorLight,
    setCanvasBackgroundColorDark,
    setCanvasBackgroundColorLight,
  } = useStore();

  const currentCanvasBackgroundColor = effectiveTheme === "dark" 
    ? canvasBackgroundColorDark 
    : canvasBackgroundColorLight;

  const colors = effectiveTheme === "dark" 
    ? CANVAS_BACKGROUND_COLORS_DARK 
    : CANVAS_BACKGROUND_COLORS_LIGHT;

  return (
    <div className="space-y-2">
      <div className="text-xs font-medium">Canvas background</div>
      <div className="grid grid-cols-6 gap-2">
        {colors.map((bg) => (
          <button
            key={bg.color}
            className={cn(
              "size-9 rounded border-2 transition-all",
              currentCanvasBackgroundColor === bg.color
                ? "border-primary scale-110"
                : "border-border hover:scale-105"
            )}
            style={{ backgroundColor: bg.color }}
            onClick={() => {
              if (effectiveTheme === "dark") {
                setCanvasBackgroundColorDark(bg.color);
              } else {
                setCanvasBackgroundColorLight(bg.color);
              }
            }}
            aria-label={bg.name}
            title={bg.name}
          />
        ))}
      </div>
    </div>
  );
}
