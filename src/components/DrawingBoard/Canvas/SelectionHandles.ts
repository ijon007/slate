import type { DrawingElement, Point } from "@/lib/drawing/types";
import { getElementBounds } from "@/lib/drawing/utils";
import { getComputedColor } from "./colorUtils";

const HANDLE_SIZE = 8;
const HANDLE_HIT_THRESHOLD = 10;

export type ResizeHandle =
  | "nw"
  | "n"
  | "ne"
  | "e"
  | "se"
  | "s"
  | "sw"
  | "w"
  | null;

interface SelectionHandlesProps {
  getScreenPoint: (worldPoint: Point) => Point;
}

export function createSelectionHandlesRenderer({ getScreenPoint }: SelectionHandlesProps) {
  return function drawHandles(ctx: CanvasRenderingContext2D, element: DrawingElement) {
    const bounds = getElementBounds(element);
    
    // Get primary color from CSS
    const primaryColor = getComputedColor("--primary");
    
    // Convert bounds to screen coordinates
    const minScreen = getScreenPoint({ x: bounds.minX, y: bounds.minY });
    const maxScreen = getScreenPoint({ x: bounds.maxX, y: bounds.maxY });
    
    // Calculate screen rectangle dimensions
    const x = Math.min(minScreen.x, maxScreen.x);
    const y = Math.min(minScreen.y, maxScreen.y);
    const width = Math.abs(maxScreen.x - minScreen.x);
    const height = Math.abs(maxScreen.y - minScreen.y);
    
    // Round to prevent sub-pixel rendering issues
    const rectX = Math.round(x);
    const rectY = Math.round(y);
    const rectWidth = Math.round(width);
    const rectHeight = Math.round(height);
    
    ctx.save();
    
    // Draw border rectangle
    ctx.strokeStyle = primaryColor;
    ctx.lineWidth = 3;
    ctx.setLineDash([]);
    ctx.strokeRect(rectX, rectY, rectWidth, rectHeight);
    
    // Calculate handle positions on the border
    const handlePositions = [
      { x: rectX, y: rectY }, // nw
      { x: rectX + rectWidth / 2, y: rectY }, // n
      { x: rectX + rectWidth, y: rectY }, // ne
      { x: rectX + rectWidth, y: rectY + rectHeight / 2 }, // e
      { x: rectX + rectWidth, y: rectY + rectHeight }, // se
      { x: rectX + rectWidth / 2, y: rectY + rectHeight }, // s
      { x: rectX, y: rectY + rectHeight }, // sw
      { x: rectX, y: rectY + rectHeight / 2 }, // w
    ];
    
    // Draw handles
    handlePositions.forEach((pos) => {
      const handleX = Math.round(pos.x);
      const handleY = Math.round(pos.y);
      
      ctx.fillStyle = "#fff";
      ctx.strokeStyle = primaryColor;
      ctx.lineWidth = 2;
      ctx.setLineDash([]);
      ctx.fillRect(
        handleX - HANDLE_SIZE / 2,
        handleY - HANDLE_SIZE / 2,
        HANDLE_SIZE,
        HANDLE_SIZE
      );
      ctx.strokeRect(
        handleX - HANDLE_SIZE / 2,
        handleY - HANDLE_SIZE / 2,
        HANDLE_SIZE,
        HANDLE_SIZE
      );
    });
    
    ctx.restore();
  };
}

export function createResizeHandleGetter({ getScreenPoint }: SelectionHandlesProps) {
  return function getResizeHandle(point: Point, element: DrawingElement): ResizeHandle {
    const bounds = getElementBounds(element);
    
    // Convert bounds to screen coordinates (same as in drawHandles)
    const minScreen = getScreenPoint({ x: bounds.minX, y: bounds.minY });
    const maxScreen = getScreenPoint({ x: bounds.maxX, y: bounds.maxY });
    
    // Calculate screen rectangle dimensions
    const x = Math.min(minScreen.x, maxScreen.x);
    const y = Math.min(minScreen.y, maxScreen.y);
    const width = Math.abs(maxScreen.x - minScreen.x);
    const height = Math.abs(maxScreen.y - minScreen.y);
    
    // Round to match drawHandles
    const rectX = Math.round(x);
    const rectY = Math.round(y);
    const rectWidth = Math.round(width);
    const rectHeight = Math.round(height);
    
    // Calculate handle positions (must match drawHandles exactly)
    const handlePositions = [
      { handle: "nw" as const, x: rectX, y: rectY },
      { handle: "n" as const, x: rectX + rectWidth / 2, y: rectY },
      { handle: "ne" as const, x: rectX + rectWidth, y: rectY },
      { handle: "e" as const, x: rectX + rectWidth, y: rectY + rectHeight / 2 },
      { handle: "se" as const, x: rectX + rectWidth, y: rectY + rectHeight },
      { handle: "s" as const, x: rectX + rectWidth / 2, y: rectY + rectHeight },
      { handle: "sw" as const, x: rectX, y: rectY + rectHeight },
      { handle: "w" as const, x: rectX, y: rectY + rectHeight / 2 },
    ];

    for (const handlePos of handlePositions) {
      const dx = point.x - handlePos.x;
      const dy = point.y - handlePos.y;
      if (Math.sqrt(dx * dx + dy * dy) < HANDLE_HIT_THRESHOLD) {
        return handlePos.handle;
      }
    }
    return null;
  };
}
