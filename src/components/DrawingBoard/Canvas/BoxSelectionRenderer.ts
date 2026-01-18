import type { Point } from "@/lib/drawing/types";
import { getComputedColor } from "./colorUtils";

interface BoxSelectionRendererProps {
  getScreenPoint: (worldPoint: Point) => Point;
}

export function createBoxSelectionRenderer({ getScreenPoint }: BoxSelectionRendererProps) {
  return function drawBoxSelection(
    ctx: CanvasRenderingContext2D,
    start: Point,
    end: Point
  ) {
    const startScreen = getScreenPoint(start);
    const endScreen = getScreenPoint(end);
    
    const x = Math.min(startScreen.x, endScreen.x);
    const y = Math.min(startScreen.y, endScreen.y);
    const width = Math.abs(endScreen.x - startScreen.x);
    const height = Math.abs(endScreen.y - startScreen.y);

    // Get primary color from CSS
    const primaryColor = getComputedColor("--primary");

    ctx.save();
    // Draw semi-transparent fill
    ctx.fillStyle = primaryColor;
    ctx.globalAlpha = 0.1;
    ctx.fillRect(x, y, width, height);
    ctx.globalAlpha = 1;
    
    // Draw dashed border
    ctx.strokeStyle = primaryColor;
    ctx.lineWidth = 1;
    ctx.setLineDash([4, 4]);
    ctx.strokeRect(x, y, width, height);
    ctx.restore();
  };
}
