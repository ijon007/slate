import type { DrawingElement, Point } from "@/lib/drawing/types";
import {
  DEFAULT_STROKE_WIDTH,
  DEFAULT_FILL_PATTERN,
  DEFAULT_SLOPPINESS,
  DEFAULT_EDGE_ROUNDING,
} from "@/lib/drawing/constants";

interface CreateElementParams {
  id: string;
  type: "rectangle" | "circle" | "line" | "arrow" | "freehand";
  startPoint: Point;
  endPoint: Point;
  strokeColor: string;
  fillColor: string;
  minSize?: number;
}

export function createDrawingElement({
  id,
  type,
  startPoint,
  endPoint,
  strokeColor,
  fillColor,
  minSize = 1,
}: CreateElementParams): DrawingElement {
  switch (type) {
    case "rectangle":
      return {
        id,
        type: "rectangle",
        x: Math.min(startPoint.x, endPoint.x),
        y: Math.min(startPoint.y, endPoint.y),
        width: Math.max(minSize, Math.abs(endPoint.x - startPoint.x)),
        height: Math.max(minSize, Math.abs(endPoint.y - startPoint.y)),
        strokeColor,
        fillColor,
        strokeWidth: DEFAULT_STROKE_WIDTH,
        strokeStyle: "solid",
        opacity: 1,
        angle: 0,
        fillPattern: DEFAULT_FILL_PATTERN,
        sloppiness: DEFAULT_SLOPPINESS,
        edgeRounding: DEFAULT_EDGE_ROUNDING,
      };
    case "circle":
      return {
        id,
        type: "circle",
        x: Math.min(startPoint.x, endPoint.x),
        y: Math.min(startPoint.y, endPoint.y),
        width: Math.max(minSize, Math.abs(endPoint.x - startPoint.x)),
        height: Math.max(minSize, Math.abs(endPoint.y - startPoint.y)),
        strokeColor,
        fillColor,
        strokeWidth: DEFAULT_STROKE_WIDTH,
        strokeStyle: "solid",
        opacity: 1,
        angle: 0,
        fillPattern: DEFAULT_FILL_PATTERN,
        sloppiness: DEFAULT_SLOPPINESS,
        edgeRounding: DEFAULT_EDGE_ROUNDING,
      };
    case "line": {
      const dx = endPoint.x - startPoint.x;
      const dy = endPoint.y - startPoint.y;
      const distance = Math.sqrt(dx * dx + dy * dy);
      const finalX2 = distance < 10 ? startPoint.x + 50 : endPoint.x;
      const finalY2 = distance < 10 ? startPoint.y + 50 : endPoint.y;
      return {
        id,
        type: "line",
        x: startPoint.x,
        y: startPoint.y,
        x2: finalX2,
        y2: finalY2,
        strokeColor,
        fillColor,
        strokeWidth: DEFAULT_STROKE_WIDTH,
        strokeStyle: "solid",
        opacity: 1,
        angle: 0,
        fillPattern: DEFAULT_FILL_PATTERN,
        sloppiness: DEFAULT_SLOPPINESS,
        edgeRounding: DEFAULT_EDGE_ROUNDING,
      };
    }
    case "arrow":
      return {
        id,
        type: "arrow",
        x: startPoint.x,
        y: startPoint.y,
        x2: endPoint.x,
        y2: endPoint.y,
        strokeColor,
        fillColor,
        strokeWidth: DEFAULT_STROKE_WIDTH,
        strokeStyle: "solid",
        opacity: 1,
        angle: 0,
        fillPattern: DEFAULT_FILL_PATTERN,
        sloppiness: DEFAULT_SLOPPINESS,
        edgeRounding: DEFAULT_EDGE_ROUNDING,
      };
    case "freehand":
      return {
        id,
        type: "freehand",
        x: startPoint.x,
        y: startPoint.y,
        points: [startPoint, endPoint],
        strokeColor,
        fillColor,
        strokeWidth: DEFAULT_STROKE_WIDTH,
        strokeStyle: "solid",
        opacity: 1,
        angle: 0,
        fillPattern: DEFAULT_FILL_PATTERN,
        sloppiness: DEFAULT_SLOPPINESS,
        edgeRounding: DEFAULT_EDGE_ROUNDING,
      };
  }
}

export function createTextElement(
  id: string,
  position: Point,
  strokeColor: string,
  fillColor: string,
  fontSize: number,
  fontFamily: string
): DrawingElement {
  return {
    id,
    type: "text",
    x: position.x,
    y: position.y,
    text: "",
    fontSize,
    fontFamily,
    width: 100,
    height: fontSize,
    strokeColor,
    fillColor,
    strokeWidth: DEFAULT_STROKE_WIDTH,
    strokeStyle: "solid",
    opacity: 1,
    angle: 0,
    fillPattern: DEFAULT_FILL_PATTERN,
    sloppiness: DEFAULT_SLOPPINESS,
    edgeRounding: DEFAULT_EDGE_ROUNDING,
    textAlign: "left",
  };
}

export function ensureMinimumSize(element: DrawingElement, minSize: number = 20): DrawingElement {
  if (element.type === "rectangle" || element.type === "circle") {
    if (element.width < minSize || element.height < minSize) {
      return {
        ...element,
        width: Math.max(minSize, element.width),
        height: Math.max(minSize, element.height),
      };
    }
  } else if (element.type === "line") {
    const dx = (element.x2 || 0) - element.x;
    const dy = (element.y2 || 0) - element.y;
    const distance = Math.sqrt(dx * dx + dy * dy);
    if (distance < 10) {
      return {
        ...element,
        x2: element.x + 50,
        y2: element.y + 50,
      };
    }
  }
  return element;
}

export function getElementEndPoint(element: DrawingElement, startPoint: Point): Point {
  if (element.type === "line" || element.type === "arrow") {
    return {
      x: element.x2 || startPoint.x,
      y: element.y2 || startPoint.y,
    };
  } else if (element.type === "rectangle" || element.type === "circle" || element.type === "text") {
    return {
      x: element.x + element.width,
      y: element.y + element.height,
    };
  }
  return {
    x: startPoint.x + 50,
    y: startPoint.y + 50,
  };
}
