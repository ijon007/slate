import { useStore } from "@/lib/storage/store";
import { Button } from "@/components/ui/button";
import type { ToolType } from "@/lib/drawing/types";
import { TOOL_SHORTCUTS } from "@/lib/drawing/constants";
import {
  Cursor,
  Rectangle,
  Circle,
  ArrowRight,
  LineSegment,
  TextT,
  PencilSimple,
} from "@phosphor-icons/react";
import { cn } from "@/lib/utils";

const tools: Array<{ type: ToolType; label: string; icon: React.ComponentType<any> }> = [
  { type: "selection", label: "Selection", icon: Cursor },
  { type: "rectangle", label: "Rectangle", icon: Rectangle },
  { type: "circle", label: "Circle", icon: Circle },
  { type: "arrow", label: "Arrow", icon: ArrowRight },
  { type: "line", label: "Line", icon: LineSegment },
  { type: "text", label: "Text", icon: TextT },
  { type: "freehand", label: "Freehand", icon: PencilSimple },
];

export function Toolbar() {
  const { selectedTool, setSelectedTool } = useStore();

  return (
    <div
      className="fixed top-4 left-1/2 -translate-x-1/2 z-20 flex gap-2 bg-card/80 backdrop-blur-sm border border-border rounded-lg p-2 shadow-lg"
      role="toolbar"
      aria-label="Drawing tools"
    >
      {tools.map((tool) => {
        const Icon = tool.icon;
        const isActive = selectedTool === tool.type;
        const shortcut = TOOL_SHORTCUTS[tool.type];

        return (
          <Button
            key={tool.type}
            variant={isActive ? "default" : "ghost"}
            size="icon"
            onClick={() => setSelectedTool(tool.type)}
            className={cn(
              "relative",
              isActive && "bg-primary text-primary-foreground"
            )}
            aria-label={`${tool.label} tool (${shortcut})`}
            aria-pressed={isActive}
            title={`${tool.label} (${shortcut})`}
          >
            <Icon className="size-4" />
            <span className="absolute -bottom-6 left-1/2 -translate-x-1/2 text-[10px] text-muted-foreground whitespace-nowrap">
              {shortcut}
            </span>
          </Button>
        );
      })}
    </div>
  );
}
