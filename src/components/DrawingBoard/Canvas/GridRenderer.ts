import type { Point } from "@/lib/drawing/types";

interface GridRendererProps {
  zoom: number;
  offsetX: number;
  offsetY: number;
  isDarkTheme: boolean;
}

export function createGridRenderer({ zoom, offsetX, offsetY, isDarkTheme }: GridRendererProps) {
  return function drawGrid(ctx: CanvasRenderingContext2D, width: number, height: number) {
    const gridSize = 20 * zoom;
    // Use theme-appropriate grid color
    ctx.strokeStyle = isDarkTheme ? "rgba(255, 255, 255, 0.05)" : "rgba(0, 0, 0, 0.1)";
    ctx.lineWidth = 1;

    const offsetXScreen = (offsetX * zoom) % gridSize;
    const offsetYScreen = (offsetY * zoom) % gridSize;

    for (let x = -offsetXScreen; x < width; x += gridSize) {
      ctx.beginPath();
      ctx.moveTo(x, 0);
      ctx.lineTo(x, height);
      ctx.stroke();
    }

    for (let y = -offsetYScreen; y < height; y += gridSize) {
      ctx.beginPath();
      ctx.moveTo(0, y);
      ctx.lineTo(width, y);
      ctx.stroke();
    }
  };
}
