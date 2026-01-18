import type { DrawingElement, Point } from "@/lib/drawing/types";
import {
  applySloppiness,
  drawFillPattern,
  getBorderRadius,
  drawRoundedRect,
  applyStrokeStyle,
} from "./drawingUtils";

interface ElementRendererProps {
  getScreenPoint: (worldPoint: Point) => Point;
}

export function createElementRenderer({ getScreenPoint }: ElementRendererProps) {
  return function drawElement(ctx: CanvasRenderingContext2D, element: DrawingElement) {
    const screenPoint = getScreenPoint({ x: element.x, y: element.y });

    switch (element.type) {
      case "rectangle": {
        const screenEnd = getScreenPoint({
          x: element.x + element.width,
          y: element.y + element.height,
        });
        // Round coordinates to prevent sub-pixel rendering issues that cause shaking
        let x = Math.round(screenPoint.x);
        let y = Math.round(screenPoint.y);
        let width = Math.round(screenEnd.x - screenPoint.x);
        let height = Math.round(screenEnd.y - screenPoint.y);
        
        // Apply sloppiness (deterministic based on element ID)
        const seed = element.id.charCodeAt(0) || 0;
        if (element.sloppiness !== "subtle") {
          x = applySloppiness(x, element.sloppiness, seed);
          y = applySloppiness(y, element.sloppiness, seed + 1);
          width = applySloppiness(width, element.sloppiness, seed + 2);
          height = applySloppiness(height, element.sloppiness, seed + 3);
        }
        
        const borderRadius = getBorderRadius(Math.abs(width), Math.abs(height), element.edgeRounding);
        
        // Draw with native canvas for clean, solid fills
        ctx.save();
        ctx.beginPath();
        
        // Use rounded rectangle if needed
        drawRoundedRect(ctx, x, y, width, height, borderRadius);
        
        // Fill first (if not transparent)
        if (element.fillColor !== "transparent") {
          if (element.fillPattern === "solid") {
            ctx.fillStyle = element.fillColor;
            ctx.globalAlpha = element.opacity;
            ctx.fill();
          } else {
            // For patterns, we need to clip to the rounded rectangle
            ctx.save();
            ctx.beginPath();
            drawRoundedRect(ctx, x, y, width, height, borderRadius);
            ctx.clip();
            drawFillPattern(ctx, x, y, width, height, element.fillPattern, element.fillColor, element.opacity);
            ctx.restore();
          }
        }
        
        // Then stroke for border
        ctx.beginPath();
        drawRoundedRect(ctx, x, y, width, height, borderRadius);
        ctx.strokeStyle = element.strokeColor;
        ctx.lineWidth = element.strokeWidth;
        ctx.globalAlpha = element.opacity;
        applyStrokeStyle(ctx, element.strokeStyle);
        ctx.stroke();
        
        ctx.restore();
        break;
      }
      case "circle": {
        const screenEnd = getScreenPoint({
          x: element.x + element.width,
          y: element.y + element.height,
        });
        let width = screenEnd.x - screenPoint.x;
        let height = screenEnd.y - screenPoint.y;
        
        // Apply sloppiness (deterministic based on element ID)
        const seed = element.id.charCodeAt(0) || 0;
        if (element.sloppiness !== "subtle") {
          width = applySloppiness(width, element.sloppiness, seed);
          height = applySloppiness(height, element.sloppiness, seed + 1);
        }
        
        const radius = Math.max(Math.abs(width), Math.abs(height)) / 2;
        // Round coordinates to prevent sub-pixel rendering issues
        let centerX = Math.round(screenPoint.x + width / 2);
        let centerY = Math.round(screenPoint.y + height / 2);
        
        // Apply sloppiness to center
        if (element.sloppiness !== "subtle") {
          centerX = applySloppiness(centerX, element.sloppiness, seed + 2);
          centerY = applySloppiness(centerY, element.sloppiness, seed + 3);
        }
        
        const roundedRadius = Math.round(radius);
        
        // Draw with native canvas for clean, solid fills
        ctx.save();
        ctx.beginPath();
        ctx.arc(centerX, centerY, roundedRadius, 0, Math.PI * 2);
        
        // Fill first (if not transparent)
        if (element.fillColor !== "transparent") {
          if (element.fillPattern === "solid") {
            ctx.fillStyle = element.fillColor;
            ctx.globalAlpha = element.opacity;
            ctx.fill();
          } else {
            // For circles, draw pattern in bounding box and clip to circle
            ctx.save();
            ctx.beginPath();
            ctx.arc(centerX, centerY, roundedRadius, 0, Math.PI * 2);
            ctx.clip();
            const patternX = centerX - roundedRadius;
            const patternY = centerY - roundedRadius;
            const patternSize = roundedRadius * 2;
            drawFillPattern(ctx, patternX, patternY, patternSize, patternSize, element.fillPattern, element.fillColor, element.opacity);
            ctx.restore();
          }
        }
        
        // Then stroke for border
        ctx.beginPath();
        ctx.arc(centerX, centerY, roundedRadius, 0, Math.PI * 2);
        ctx.strokeStyle = element.strokeColor;
        ctx.lineWidth = element.strokeWidth;
        ctx.globalAlpha = element.opacity;
        applyStrokeStyle(ctx, element.strokeStyle);
        ctx.stroke();
        
        ctx.restore();
        break;
      }
      case "line": {
        const screenEnd = getScreenPoint({ x: element.x2, y: element.y2 });
        // Round coordinates to prevent sub-pixel rendering issues that cause shaking
        let x1 = Math.round(screenPoint.x);
        let y1 = Math.round(screenPoint.y);
        let x2 = Math.round(screenEnd.x);
        let y2 = Math.round(screenEnd.y);
        
        // Apply sloppiness (deterministic based on element ID)
        const seed = element.id.charCodeAt(0) || 0;
        if (element.sloppiness !== "subtle") {
          x1 = applySloppiness(x1, element.sloppiness, seed);
          y1 = applySloppiness(y1, element.sloppiness, seed + 1);
          x2 = applySloppiness(x2, element.sloppiness, seed + 2);
          y2 = applySloppiness(y2, element.sloppiness, seed + 3);
        }
        
        // Draw with native canvas for clean lines
        ctx.save();
        ctx.beginPath();
        ctx.moveTo(x1, y1);
        ctx.lineTo(x2, y2);
        ctx.strokeStyle = element.strokeColor;
        ctx.lineWidth = element.strokeWidth;
        ctx.globalAlpha = element.opacity;
        applyStrokeStyle(ctx, element.strokeStyle);
        ctx.stroke();
        ctx.restore();
        break;
      }
      case "arrow": {
        const screenEnd = getScreenPoint({ x: element.x2, y: element.y2 });
        // Round coordinates to prevent sub-pixel rendering issues that cause shaking
        let x1 = Math.round(screenPoint.x);
        let y1 = Math.round(screenPoint.y);
        let x2 = Math.round(screenEnd.x);
        let y2 = Math.round(screenEnd.y);
        
        // Apply sloppiness (deterministic based on element ID)
        const seed = element.id.charCodeAt(0) || 0;
        if (element.sloppiness !== "subtle") {
          x1 = applySloppiness(x1, element.sloppiness, seed);
          y1 = applySloppiness(y1, element.sloppiness, seed + 1);
          x2 = applySloppiness(x2, element.sloppiness, seed + 2);
          y2 = applySloppiness(y2, element.sloppiness, seed + 3);
        }
        
        const dx = x2 - x1;
        const dy = y2 - y1;
        const angle = Math.atan2(dy, dx);
        
        // Calculate arrowhead dimensions based on stroke width
        const arrowLength = Math.max(15, element.strokeWidth * 3);
        const arrowAngle = Math.PI / 6;
        
        // Draw the line from start all the way to the tip using native canvas for reliability
        ctx.save();
        ctx.beginPath();
        ctx.moveTo(x1, y1);
        ctx.lineTo(x2, y2);
        ctx.strokeStyle = element.strokeColor;
        ctx.lineWidth = element.strokeWidth;
        ctx.globalAlpha = element.opacity;
        applyStrokeStyle(ctx, element.strokeStyle);
        ctx.stroke();
        
        // Draw arrowhead at the end - the line connects to the tip
        // Calculate arrowhead points
        const arrowX1 = Math.round(x2 - arrowLength * Math.cos(angle - arrowAngle));
        const arrowY1 = Math.round(y2 - arrowLength * Math.sin(angle - arrowAngle));
        const arrowX2 = Math.round(x2 - arrowLength * Math.cos(angle + arrowAngle));
        const arrowY2 = Math.round(y2 - arrowLength * Math.sin(angle + arrowAngle));
        
        ctx.beginPath();
        ctx.moveTo(x2, y2);
        ctx.lineTo(arrowX1, arrowY1);
        ctx.lineTo(arrowX2, arrowY2);
        ctx.closePath();
        ctx.fillStyle = element.strokeColor;
        ctx.fill();
        ctx.stroke();
        ctx.restore();
        break;
      }
      case "text": {
        // Round coordinates to prevent sub-pixel rendering issues
        const screenEnd = getScreenPoint({
          x: element.x + element.width,
          y: element.y + element.height,
        });
        const x = Math.round(screenPoint.x);
        const y = Math.round(screenPoint.y + element.fontSize);
        const width = Math.abs(screenEnd.x - screenPoint.x);
        
        ctx.font = `${element.fontSize}px ${element.fontFamily}`;
        ctx.fillStyle = element.strokeColor;
        ctx.globalAlpha = element.opacity;
        
        // Set text alignment
        const textAlign = element.textAlign || "left";
        ctx.textAlign = textAlign;
        ctx.textBaseline = "top";
        
        // Calculate x position based on alignment
        let textX = x;
        if (textAlign === "center") {
          textX = x + width / 2;
        } else if (textAlign === "right") {
          textX = x + width;
        }
        
        ctx.fillText(element.text, textX, y);
        ctx.globalAlpha = 1;
        ctx.textAlign = "left"; // Reset to default
        break;
      }
      case "freehand": {
        if (element.points.length < 2) break;
        ctx.beginPath();
        const firstPoint = getScreenPoint(element.points[0]);
        // Round coordinates to prevent sub-pixel rendering issues
        let x = Math.round(firstPoint.x);
        let y = Math.round(firstPoint.y);
        
        // Apply sloppiness (deterministic based on element ID)
        const seed = element.id.charCodeAt(0) || 0;
        if (element.sloppiness !== "subtle") {
          x = applySloppiness(x, element.sloppiness, seed);
          y = applySloppiness(y, element.sloppiness, seed + 1);
        }
        
        ctx.moveTo(x, y);
        for (let i = 1; i < element.points.length; i++) {
          const point = getScreenPoint(element.points[i]);
          let px = Math.round(point.x);
          let py = Math.round(point.y);
          
          // Apply sloppiness
          if (element.sloppiness !== "subtle") {
            px = applySloppiness(px, element.sloppiness, seed + i * 2);
            py = applySloppiness(py, element.sloppiness, seed + i * 2 + 1);
          }
          
          ctx.lineTo(px, py);
        }
        ctx.strokeStyle = element.strokeColor;
        ctx.lineWidth = element.strokeWidth;
        ctx.globalAlpha = element.opacity;
        applyStrokeStyle(ctx, element.strokeStyle);
        ctx.stroke();
        ctx.globalAlpha = 1;
        break;
      }
    }
  };
}
