import type { FillPattern, Sloppiness, EdgeRounding } from "@/lib/drawing/types";

// Helper function to apply sloppiness jitter (deterministic based on value)
export function applySloppiness(value: number, sloppiness: Sloppiness, seed: number = 0): number {
  if (sloppiness === "subtle") return value;
  const jitterMap = {
    subtle: 0,
    moderate: 2,
    high: 4,
  };
  const jitter = jitterMap[sloppiness];
  // Use a simple hash-like function for deterministic jitter
  const hash = Math.sin(value * 0.1 + seed) * jitter;
  return value + hash;
}

// Helper function to draw fill patterns
export function drawFillPattern(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  width: number,
  height: number,
  pattern: FillPattern,
  color: string,
  opacity: number
) {
  ctx.save();
  ctx.fillStyle = color;
  ctx.globalAlpha = opacity;
  ctx.strokeStyle = color;
  ctx.lineWidth = 1;

  switch (pattern) {
    case "solid":
      ctx.fillRect(x, y, width, height);
      break;
    case "cross-hatch": {
      const spacing = 8;
      ctx.beginPath();
      // Diagonal lines top-left to bottom-right
      for (let i = -height; i < width + height; i += spacing) {
        ctx.moveTo(x + i, y);
        ctx.lineTo(x + i + height, y + height);
      }
      // Diagonal lines top-right to bottom-left
      for (let i = -height; i < width + height; i += spacing) {
        ctx.moveTo(x + width - i, y);
        ctx.lineTo(x + width - i - height, y + height);
      }
      ctx.stroke();
      break;
    }
    case "grid": {
      const spacing = 8;
      ctx.beginPath();
      // Vertical lines
      for (let i = 0; i <= width; i += spacing) {
        ctx.moveTo(x + i, y);
        ctx.lineTo(x + i, y + height);
      }
      // Horizontal lines
      for (let i = 0; i <= height; i += spacing) {
        ctx.moveTo(x, y + i);
        ctx.lineTo(x + width, y + i);
      }
      ctx.stroke();
      break;
    }
    case "dotted": {
      const spacing = 6;
      ctx.beginPath();
      for (let i = spacing; i < width; i += spacing) {
        for (let j = spacing; j < height; j += spacing) {
          ctx.moveTo(x + i, y + j);
          ctx.arc(x + i, y + j, 1, 0, Math.PI * 2);
        }
      }
      ctx.fill();
      break;
    }
  }
  ctx.restore();
}

// Helper function to get border radius based on edge rounding
export function getBorderRadius(
  width: number,
  height: number,
  edgeRounding: EdgeRounding
): number {
  if (edgeRounding === "sharp") {
    return 0;
  }
  return Math.min(width, height) * 0.1;
}

// Helper function to draw rounded rectangle with fallback
export function drawRoundedRect(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  width: number,
  height: number,
  radius: number
) {
  if (radius === 0) {
    ctx.rect(x, y, width, height);
    return;
  }

  // Use roundRect if available (modern browsers)
  if (typeof ctx.roundRect === 'function') {
    ctx.roundRect(x, y, width, height, radius);
    return;
  }

  // Fallback for older browsers using arcTo
  ctx.beginPath();
  ctx.moveTo(x + radius, y);
  ctx.lineTo(x + width - radius, y);
  ctx.arcTo(x + width, y, x + width, y + radius, radius);
  ctx.lineTo(x + width, y + height - radius);
  ctx.arcTo(x + width, y + height, x + width - radius, y + height, radius);
  ctx.lineTo(x + radius, y + height);
  ctx.arcTo(x, y + height, x, y + height - radius, radius);
  ctx.lineTo(x, y + radius);
  ctx.arcTo(x, y, x + radius, y, radius);
  ctx.closePath();
}

// Helper function to apply stroke style
export function applyStrokeStyle(ctx: CanvasRenderingContext2D, strokeStyle: string) {
  switch (strokeStyle) {
    case "solid":
      ctx.setLineDash([]);
      break;
    case "dashed":
      ctx.setLineDash([8, 4]);
      break;
    case "dotted":
      ctx.setLineDash([2, 4]);
      break;
  }
}
