import { Button } from "@/components/ui/button";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { cn } from "@/lib/utils";
import { COLORS } from "@/lib/drawing/constants";

interface ColorGridProps {
  selectedColor: string;
  onColorChange: (color: string) => void;
  label: string;
}

export function ColorGrid({ selectedColor, onColorChange, label }: ColorGridProps) {
  return (
    <Popover>
      <PopoverTrigger
        render={
          <Button
            variant="outline"
            className="size-10 p-0 aspect-square"
          >
            <div
              className={cn(
                "size-9 rounded-md border border-border",
                selectedColor === "transparent" && "bg-[repeating-linear-gradient(45deg,#ccc_25%,transparent_25%,transparent_50%,#ccc_50%,#ccc_75%,transparent_75%,transparent)] bg-size-[8px_8px]"
              )}
              style={selectedColor !== "transparent" ? { backgroundColor: selectedColor } : {}}
            />
          </Button>
        }
      />
      <PopoverContent className="w-64">
        <div className="space-y-2">
          <div className="text-xs font-medium">{label}</div>
          <div className="grid grid-cols-5 gap-2">
            {/* Transparent option */}
            <button
              className={cn(
                "size-9 rounded-md border-2 transition-all bg-[repeating-linear-gradient(45deg,#ccc_25%,transparent_25%,transparent_50%,#ccc_50%,#ccc_75%,transparent_75%,transparent)] bg-size-[8px_8px]",
                selectedColor === "transparent"
                  ? "border-primary scale-110"
                  : "border-border hover:scale-105"
              )}
              onClick={() => onColorChange("transparent")}
              aria-label="Transparent"
            />
            {/* Color options */}
            {COLORS.map((color) => (
              <button
                key={color}
                className={cn(
                  "size-9 rounded-md border-2 transition-all",
                  selectedColor === color
                    ? "border-primary scale-110"
                    : "border-border hover:scale-105"
                )}
                style={{ backgroundColor: color }}
                onClick={() => onColorChange(color)}
                aria-label={`Select ${label.toLowerCase()} color ${color}`}
              />
            ))}
          </div>
        </div>
      </PopoverContent>
    </Popover>
  );
}
