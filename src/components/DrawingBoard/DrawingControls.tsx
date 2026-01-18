import { useState } from "react";
import { useStore } from "@/lib/storage/store";
import { Button } from "@/components/ui/button";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { Separator } from "@/components/ui/separator";
import {
  ArrowCounterClockwise,
  ArrowClockwise,
  Trash,
  MagnifyingGlassPlus,
  MagnifyingGlassMinus,
  Minus,
} from "@phosphor-icons/react";
import { cn } from "@/lib/utils";
import {
  getBoundingBox,
} from "@/lib/drawing/utils";
import { toast } from "sonner";
import {
  COLORS,
  MIN_ZOOM,
  MAX_ZOOM,
  ZOOM_STEP,
} from "@/lib/drawing/constants";

export function DrawingControls() {
  const {
    elements,
    canvasState,
    canUndo,
    canRedo,
    undo,
    redo,
    clearCanvas,
    setZoom,
    resetCanvas,
    setOffset,
    strokeColor,
    fillColor,
    setStrokeColor,
    setFillColor,
  } = useStore();

  const [showClearDialog, setShowClearDialog] = useState(false);

  const handleZoomIn = () => {
    const newZoom = Math.min(MAX_ZOOM, canvasState.zoom + ZOOM_STEP);
    setZoom(newZoom);
  };

  const handleZoomOut = () => {
    const newZoom = Math.max(MIN_ZOOM, canvasState.zoom - ZOOM_STEP);
    setZoom(newZoom);
  };

  const handleZoomToFit = () => {
    if (elements.length === 0) {
      resetCanvas();
      return;
    }

    const bounds = getBoundingBox(elements);
    const padding = 50;
    const width = bounds.maxX - bounds.minX + padding * 2;
    const height = bounds.maxY - bounds.minY + padding * 2;

    const canvas = document.querySelector("canvas");
    if (!canvas) return;

    const rect = canvas.getBoundingClientRect();
    const scaleX = rect.width / width;
    const scaleY = rect.height / height;
    const zoom = Math.min(scaleX, scaleY, MAX_ZOOM);

    setZoom(zoom);
    setOffset(
      bounds.minX - padding - (rect.width / zoom - width) / 2,
      bounds.minY - padding - (rect.height / zoom - height) / 2
    );
  };

  const handleResetZoom = () => {
    resetCanvas();
  };

  const handleClear = () => {
    clearCanvas();
    setShowClearDialog(false);
    toast.success("Canvas cleared");
  };

  return (
    <div
      className="fixed left-4 top-1/2 -translate-y-1/2 z-20 flex flex-col gap-2 bg-card/80 backdrop-blur-sm border border-border rounded-lg p-3 shadow-lg w-64 max-w-[calc(100vw-2rem)] overflow-hidden"
      role="complementary"
      aria-label="Drawing controls"
    >
      {/* Undo/Redo */}
      <div className="flex gap-2">
        <Button
          variant="outline"
          size="icon"
          onClick={undo}
          disabled={!canUndo()}
          aria-label="Undo"
          title="Undo (Ctrl+Z)"
        >
          <ArrowCounterClockwise className="size-4" />
        </Button>
        <Button
          variant="outline"
          size="icon"
          onClick={redo}
          disabled={!canRedo()}
          aria-label="Redo"
          title="Redo (Ctrl+Shift+Z)"
        >
          <ArrowClockwise className="size-4" />
        </Button>
        <Button
          variant="outline"
          size="icon"
          onClick={() => setShowClearDialog(true)}
          aria-label="Clear canvas"
          title="Clear canvas"
        >
          <Trash className="size-4" />
        </Button>
      </div>

      <Separator />

      {/* Color Pickers */}
      <div className="space-y-2">
        <div className="flex items-center gap-2">
          <label className="text-xs text-muted-foreground w-16 shrink-0">Stroke:</label>
          <Popover>
            <PopoverTrigger
              render={
                <Button
                  variant="outline"
                  size="sm"
                  className="flex-1 min-w-0 justify-start"
                  style={{ backgroundColor: strokeColor }}
                >
                  <div
                    className="size-4 rounded border border-border shrink-0"
                    style={{ backgroundColor: strokeColor }}
                  />
                </Button>
              }
            />
            <PopoverContent className="w-64">
              <div className="grid grid-cols-5 gap-2">
                {COLORS.map((color) => (
                  <button
                    key={color}
                    className={cn(
                      "size-8 rounded border-2 transition-all",
                      strokeColor === color
                        ? "border-primary scale-110"
                        : "border-border hover:scale-105"
                    )}
                    style={{ backgroundColor: color }}
                    onClick={() => setStrokeColor(color)}
                    aria-label={`Select stroke color ${color}`}
                  />
                ))}
              </div>
            </PopoverContent>
          </Popover>
        </div>

        <div className="flex items-center gap-2">
          <label className="text-xs text-muted-foreground w-16 shrink-0">Fill:</label>
          <Popover>
            <PopoverTrigger
              render={
                <Button
                  variant="outline"
                  size="sm"
                  className="flex-1 min-w-0 justify-start"
                >
                  <div
                    className="size-4 rounded border border-border shrink-0"
                    style={{ backgroundColor: fillColor }}
                  />
                </Button>
              }
            />
            <PopoverContent className="w-64">
              <div className="grid grid-cols-5 gap-2">
                {COLORS.map((color) => (
                  <button
                    key={color}
                    className={cn(
                      "size-8 rounded border-2 transition-all",
                      fillColor === color
                        ? "border-primary scale-110"
                        : "border-border hover:scale-105"
                    )}
                    style={{ backgroundColor: color }}
                    onClick={() => setFillColor(color)}
                    aria-label={`Select fill color ${color}`}
                  />
                ))}
              </div>
            </PopoverContent>
          </Popover>
        </div>
      </div>

      <Separator />

      {/* Zoom Controls */}
      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <span className="text-xs text-muted-foreground">Zoom</span>
          <span className="text-xs font-medium">
            {Math.round(canvasState.zoom * 100)}%
          </span>
        </div>
        <div className="flex gap-2">
          <Button
            variant="outline"
            size="icon-sm"
            onClick={handleZoomOut}
            aria-label="Zoom out"
            title="Zoom out"
          >
            <MagnifyingGlassMinus className="size-4" />
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={handleZoomToFit}
            className="flex-1"
            aria-label="Zoom to fit"
            title="Zoom to fit"
          >
            Fit
          </Button>
          <Button
            variant="outline"
            size="icon-sm"
            onClick={handleZoomIn}
            aria-label="Zoom in"
            title="Zoom in"
          >
            <MagnifyingGlassPlus className="size-4" />
          </Button>
          <Button
            variant="outline"
            size="icon-sm"
            onClick={handleResetZoom}
            aria-label="Reset zoom"
            title="Reset zoom (Ctrl+0)"
          >
            <Minus className="size-4" />
          </Button>
        </div>
      </div>

      {/* Clear Dialog */}
      <Dialog open={showClearDialog} onOpenChange={setShowClearDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Clear Canvas</DialogTitle>
            <DialogDescription>
              Are you sure you want to clear the entire canvas? This action cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setShowClearDialog(false)}
            >
              Cancel
            </Button>
            <Button variant="destructive" onClick={handleClear}>
              Clear
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
