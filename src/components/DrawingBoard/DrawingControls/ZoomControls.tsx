import { Button } from "@/components/ui/button";
import { MagnifyingGlassPlus, MagnifyingGlassMinus, Minus } from "@phosphor-icons/react";
import { MAX_ZOOM, MIN_ZOOM, ZOOM_STEP } from "@/lib/drawing/constants";
import { useStore } from "@/lib/storage/store";
import { getBoundingBox } from "@/lib/drawing/utils";

export function ZoomControls() {
  const { elements, canvasState, setZoom, resetCanvas, setOffset } = useStore();

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

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <div className="text-xs font-medium">Canvas background</div>
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
  );
}
