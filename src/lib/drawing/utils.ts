import type {
  DrawingElement,
  RectangleElement,
  CircleElement,
  LineElement,
  ArrowElement,
  TextElement,
  FreehandElement,
  Point,
} from "./types";

export function pointInRectangle(
  point: Point,
  x: number,
  y: number,
  width: number,
  height: number
): boolean {
  return (
    point.x >= x &&
    point.x <= x + width &&
    point.y >= y &&
    point.y <= y + height
  );
}

export function pointInCircle(
  point: Point,
  centerX: number,
  centerY: number,
  radius: number
): boolean {
  const dx = point.x - centerX;
  const dy = point.y - centerY;
  return dx * dx + dy * dy <= radius * radius;
}

export function pointOnLine(
  point: Point,
  x1: number,
  y1: number,
  x2: number,
  y2: number,
  threshold = 5
): boolean {
  const A = point.x - x1;
  const B = point.y - y1;
  const C = x2 - x1;
  const D = y2 - y1;

  const dot = A * C + B * D;
  const lenSq = C * C + D * D;
  let param = -1;

  if (lenSq !== 0) {
    param = dot / lenSq;
  }

  let xx: number, yy: number;

  if (param < 0) {
    xx = x1;
    yy = y1;
  } else if (param > 1) {
    xx = x2;
    yy = y2;
  } else {
    xx = x1 + param * C;
    yy = y1 + param * D;
  }

  const dx = point.x - xx;
  const dy = point.y - yy;
  return Math.sqrt(dx * dx + dy * dy) < threshold;
}

export function pointInFreehand(
  point: Point,
  points: Point[],
  threshold = 10
): boolean {
  for (let i = 0; i < points.length - 1; i++) {
    if (pointOnLine(point, points[i].x, points[i].y, points[i + 1].x, points[i + 1].y, threshold)) {
      return true;
    }
  }
  return false;
}

export function isPointInElement(
  point: Point,
  element: DrawingElement
): boolean {
  switch (element.type) {
    case "rectangle":
      return pointInRectangle(point, element.x, element.y, element.width, element.height);
    case "circle": {
      const centerX = element.x + element.width / 2;
      const centerY = element.y + element.height / 2;
      const radius = Math.max(element.width, element.height) / 2;
      return pointInCircle(point, centerX, centerY, radius);
    }
    case "line":
      return pointOnLine(point, element.x, element.y, element.x2, element.y2);
    case "arrow":
      return pointOnLine(point, element.x, element.y, element.x2, element.y2);
    case "text":
      return pointInRectangle(point, element.x, element.y, element.width, element.height);
    case "freehand":
      return pointInFreehand(point, element.points);
    default:
      return false;
  }
}

export function getElementBounds(element: DrawingElement): {
  minX: number;
  minY: number;
  maxX: number;
  maxY: number;
} {
  switch (element.type) {
    case "rectangle":
    case "circle":
    case "text":
      return {
        minX: element.x,
        minY: element.y,
        maxX: element.x + element.width,
        maxY: element.y + element.height,
      };
    case "line":
    case "arrow":
      return {
        minX: Math.min(element.x, element.x2),
        minY: Math.min(element.y, element.y2),
        maxX: Math.max(element.x, element.x2),
        maxY: Math.max(element.y, element.y2),
      };
    case "freehand": {
      if (element.points.length === 0) {
        return { minX: 0, minY: 0, maxX: 0, maxY: 0 };
      }
      const xs = element.points.map((p) => p.x);
      const ys = element.points.map((p) => p.y);
      return {
        minX: Math.min(...xs),
        minY: Math.min(...ys),
        maxX: Math.max(...xs),
        maxY: Math.max(...ys),
      };
    }
  }
}

export function getBoundingBox(elements: DrawingElement[]): {
  minX: number;
  minY: number;
  maxX: number;
  maxY: number;
} {
  if (elements.length === 0) {
    return { minX: 0, minY: 0, maxX: 0, maxY: 0 };
  }

  const bounds = elements.map(getElementBounds);
  return {
    minX: Math.min(...bounds.map((b) => b.minX)),
    minY: Math.min(...bounds.map((b) => b.minY)),
    maxX: Math.max(...bounds.map((b) => b.maxX)),
    maxY: Math.max(...bounds.map((b) => b.maxY)),
  };
}

export function elementIntersectsBox(
  element: DrawingElement,
  boxMinX: number,
  boxMinY: number,
  boxMaxX: number,
  boxMaxY: number
): boolean {
  const bounds = getElementBounds(element);
  
  // AABB (Axis-Aligned Bounding Box) intersection check
  // Two boxes intersect if they overlap on both axes
  const intersectsX = bounds.maxX >= boxMinX && bounds.minX <= boxMaxX;
  const intersectsY = bounds.maxY >= boxMinY && bounds.minY <= boxMaxY;
  
  return intersectsX && intersectsY;
}

export function rotatePoint(
  point: Point,
  centerX: number,
  centerY: number,
  angle: number
): Point {
  const cos = Math.cos(angle);
  const sin = Math.sin(angle);
  const dx = point.x - centerX;
  const dy = point.y - centerY;
  return {
    x: centerX + dx * cos - dy * sin,
    y: centerY + dx * sin + dy * cos,
  };
}

export function distance(p1: Point, p2: Point): number {
  const dx = p2.x - p1.x;
  const dy = p2.y - p1.y;
  return Math.sqrt(dx * dx + dy * dy);
}

export function toScreenCoordinates(
  point: Point,
  zoom: number,
  offsetX: number,
  offsetY: number
): Point {
  return {
    x: (point.x - offsetX) * zoom,
    y: (point.y - offsetY) * zoom,
  };
}

export function toWorldCoordinates(
  point: Point,
  zoom: number,
  offsetX: number,
  offsetY: number
): Point {
  return {
    x: point.x / zoom + offsetX,
    y: point.y / zoom + offsetY,
  };
}

export function elementsToSVG(elements: DrawingElement[]): string {
  const bounds = getBoundingBox(elements);
  const padding = 20;
  const width = bounds.maxX - bounds.minX + padding * 2;
  const height = bounds.maxY - bounds.minY + padding * 2;

  let svg = `<svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}" viewBox="${bounds.minX - padding} ${bounds.minY - padding} ${width} ${height}">`;

  elements.forEach((element) => {
    switch (element.type) {
      case "rectangle":
        svg += `<rect x="${element.x}" y="${element.y}" width="${element.width}" height="${element.height}" fill="${element.fillColor}" stroke="${element.strokeColor}" stroke-width="${element.strokeWidth}" opacity="${element.opacity}"/>`;
        break;
      case "circle": {
        const cx = element.x + element.width / 2;
        const cy = element.y + element.height / 2;
        const r = Math.max(element.width, element.height) / 2;
        svg += `<circle cx="${cx}" cy="${cy}" r="${r}" fill="${element.fillColor}" stroke="${element.strokeColor}" stroke-width="${element.strokeWidth}" opacity="${element.opacity}"/>`;
        break;
      }
      case "line":
        svg += `<line x1="${element.x}" y1="${element.y}" x2="${element.x2}" y2="${element.y2}" stroke="${element.strokeColor}" stroke-width="${element.strokeWidth}" opacity="${element.opacity}"/>`;
        break;
      case "arrow": {
        const dx = element.x2 - element.x;
        const dy = element.y2 - element.y;
        const angle = Math.atan2(dy, dx);
        const arrowLength = 10;
        const arrowAngle = Math.PI / 6;
        const x1 = element.x2 - arrowLength * Math.cos(angle - arrowAngle);
        const y1 = element.y2 - arrowLength * Math.sin(angle - arrowAngle);
        const x2 = element.x2 - arrowLength * Math.cos(angle + arrowAngle);
        const y2 = element.y2 - arrowLength * Math.sin(angle + arrowAngle);
        svg += `<line x1="${element.x}" y1="${element.y}" x2="${element.x2}" y2="${element.y2}" stroke="${element.strokeColor}" stroke-width="${element.strokeWidth}" opacity="${element.opacity}"/>`;
        svg += `<polygon points="${element.x2},${element.y2} ${x1},${y1} ${x2},${y2}" fill="${element.strokeColor}" opacity="${element.opacity}"/>`;
        break;
      }
      case "text":
        svg += `<text x="${element.x}" y="${element.y + element.fontSize}" font-family="${element.fontFamily}" font-size="${element.fontSize}" fill="${element.strokeColor}" opacity="${element.opacity}">${escapeXml(element.text)}</text>`;
        break;
      case "freehand":
        if (element.points.length > 0) {
          const path = element.points
            .map((p, i) => `${i === 0 ? "M" : "L"} ${p.x} ${p.y}`)
            .join(" ");
          svg += `<path d="${path}" fill="none" stroke="${element.strokeColor}" stroke-width="${element.strokeWidth}" opacity="${element.opacity}"/>`;
        }
        break;
    }
  });

  svg += "</svg>";
  return svg;
}

function escapeXml(text: string): string {
  return text
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&apos;");
}

export function downloadFile(content: string, filename: string, mimeType: string): void {
  const blob = new Blob([content], { type: mimeType });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}
