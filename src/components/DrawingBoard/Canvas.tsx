import { useEffect, useRef, useState, useCallback } from "react";
import rough from "roughjs";
import type { DrawingElement, Point } from "@/lib/drawing/types";
import { useStore } from "@/lib/storage/store";
import {
  isPointInElement,
  toWorldCoordinates,
  toScreenCoordinates,
  getElementBounds,
} from "@/lib/drawing/utils";
import {
  DEFAULT_STROKE_WIDTH,
  DEFAULT_FONT_SIZE,
  DEFAULT_FONT_FAMILY,
  MIN_ZOOM,
  MAX_ZOOM,
  ZOOM_STEP,
  DEFAULT_FILL_PATTERN,
  DEFAULT_SLOPPINESS,
  DEFAULT_EDGE_ROUNDING,
} from "@/lib/drawing/constants";
import type { FillPattern, Sloppiness, EdgeRounding } from "@/lib/drawing/types";

const HANDLE_SIZE = 8;
const HANDLE_HIT_THRESHOLD = 10;

// Helper function to apply sloppiness jitter (deterministic based on value)
function applySloppiness(value: number, sloppiness: Sloppiness, seed: number = 0): number {
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
function drawFillPattern(
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
function getBorderRadius(
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
function drawRoundedRect(
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
function applyStrokeStyle(ctx: CanvasRenderingContext2D, strokeStyle: string) {
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

type ResizeHandle =
  | "nw"
  | "n"
  | "ne"
  | "e"
  | "se"
  | "s"
  | "sw"
  | "w"
  | null;

interface DrawingState {
  isDrawing: boolean;
  startPoint: Point | null;
  currentElement: DrawingElement | null;
  isDragging: boolean;
  dragOffset: Point | null;
  isResizing: boolean;
  resizeHandle: ResizeHandle;
  resizeStartBounds: { minX: number; minY: number; maxX: number; maxY: number } | null;
  isPanning: boolean;
  panStart: Point | null;
}

export function Canvas() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const roughInstanceRef = useRef<ReturnType<typeof rough.svg> | null>(null);
  const animationFrameRef = useRef<number | null>(null);

  const {
    elements,
    selectedTool,
    selectedElementIds,
    canvasState,
    addElement,
    updateElement,
    setSelectedElementIds,
    setOffset,
    setZoom,
    strokeColor,
    fillColor,
    canvasBackgroundColorDark,
    canvasBackgroundColorLight,
  } = useStore();

  const [drawingState, setDrawingState] = useState<DrawingState>({
    isDrawing: false,
    startPoint: null,
    currentElement: null,
    isDragging: false,
    dragOffset: null,
    isResizing: false,
    resizeHandle: null,
    resizeStartBounds: null,
    isPanning: false,
    panStart: null,
  });

  // Track theme state to trigger redraws
  const [isDarkTheme, setIsDarkTheme] = useState(() => {
    if (typeof window !== "undefined") {
      return document.documentElement.classList.contains("dark") ||
             window.matchMedia("(prefers-color-scheme: dark)").matches;
    }
    return true;
  });

  // Initialize canvas and rough.js
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const dpr = window.devicePixelRatio || 1;
    const rect = canvas.getBoundingClientRect();

    canvas.width = rect.width * dpr;
    canvas.height = rect.height * dpr;

    ctx.scale(dpr, dpr);
    ctx.imageSmoothingEnabled = true;

    // Initialize Rough.js (we'll use SVG mode but render to canvas)
    const svg = document.createElementNS("http://www.w3.org/2000/svg", "svg");
    roughInstanceRef.current = rough.svg(svg);

    const handleResize = () => {
      if (!canvas) return;
      const rect = canvas.getBoundingClientRect();
      const dpr = window.devicePixelRatio || 1;
      canvas.width = rect.width * dpr;
      canvas.height = rect.height * dpr;
      ctx.scale(dpr, dpr);
      draw();
    };

    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  // Get world coordinates from screen coordinates
  const getWorldPoint = useCallback(
    (screenPoint: Point): Point => {
      return toWorldCoordinates(
        screenPoint,
        canvasState.zoom,
        canvasState.offsetX,
        canvasState.offsetY
      );
    },
    [canvasState.zoom, canvasState.offsetX, canvasState.offsetY]
  );

  // Get screen coordinates from world coordinates
  const getScreenPoint = useCallback(
    (worldPoint: Point): Point => {
      return toScreenCoordinates(
        worldPoint,
        canvasState.zoom,
        canvasState.offsetX,
        canvasState.offsetY
      );
    },
    [canvasState.zoom, canvasState.offsetX, canvasState.offsetY]
  );

  // Draw a single element
  const drawElement = useCallback(
    (ctx: CanvasRenderingContext2D, element: DrawingElement) => {
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
          const x = Math.round(screenPoint.x);
          const y = Math.round(screenPoint.y + element.fontSize);
          ctx.font = `${element.fontSize}px ${element.fontFamily}`;
          ctx.fillStyle = element.strokeColor;
          ctx.globalAlpha = element.opacity;
          ctx.fillText(element.text, x, y);
          ctx.globalAlpha = 1;
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
    },
    [getScreenPoint]
  );

  // Draw selection handles
  const drawHandles = useCallback(
    (ctx: CanvasRenderingContext2D, element: DrawingElement) => {
      const bounds = getElementBounds(element);
      const corners = [
        { x: bounds.minX, y: bounds.minY }, // nw
        { x: (bounds.minX + bounds.maxX) / 2, y: bounds.minY }, // n
        { x: bounds.maxX, y: bounds.minY }, // ne
        { x: bounds.maxX, y: (bounds.minY + bounds.maxY) / 2 }, // e
        { x: bounds.maxX, y: bounds.maxY }, // se
        { x: (bounds.minX + bounds.maxX) / 2, y: bounds.maxY }, // s
        { x: bounds.minX, y: bounds.maxY }, // sw
        { x: bounds.minX, y: (bounds.minY + bounds.maxY) / 2 }, // w
      ];

      corners.forEach((corner) => {
        const screenPoint = getScreenPoint(corner);
        ctx.fillStyle = "#fff";
        ctx.strokeStyle = "#0066ff";
        ctx.lineWidth = 2;
        ctx.fillRect(
          screenPoint.x - HANDLE_SIZE / 2,
          screenPoint.y - HANDLE_SIZE / 2,
          HANDLE_SIZE,
          HANDLE_SIZE
        );
        ctx.strokeRect(
          screenPoint.x - HANDLE_SIZE / 2,
          screenPoint.y - HANDLE_SIZE / 2,
          HANDLE_SIZE,
          HANDLE_SIZE
        );
      });
    },
    [getScreenPoint]
  );

  // Get resize handle at point
  const getResizeHandle = useCallback(
    (point: Point, element: DrawingElement): ResizeHandle => {
      const bounds = getElementBounds(element);
      const corners = [
        { handle: "nw" as const, x: bounds.minX, y: bounds.minY },
        { handle: "n" as const, x: (bounds.minX + bounds.maxX) / 2, y: bounds.minY },
        { handle: "ne" as const, x: bounds.maxX, y: bounds.minY },
        { handle: "e" as const, x: bounds.maxX, y: (bounds.minY + bounds.maxY) / 2 },
        { handle: "se" as const, x: bounds.maxX, y: bounds.maxY },
        { handle: "s" as const, x: (bounds.minX + bounds.maxX) / 2, y: bounds.maxY },
        { handle: "sw" as const, x: bounds.minX, y: bounds.maxY },
        { handle: "w" as const, x: bounds.minX, y: (bounds.minY + bounds.maxY) / 2 },
      ];

      for (const corner of corners) {
        const screenPoint = getScreenPoint(corner);
        const dx = point.x - screenPoint.x;
        const dy = point.y - screenPoint.y;
        if (Math.sqrt(dx * dx + dy * dy) < HANDLE_HIT_THRESHOLD) {
          return corner.handle;
        }
      }
      return null;
    },
    [getScreenPoint]
  );

  // Draw grid
  const drawGrid = useCallback((ctx: CanvasRenderingContext2D, width: number, height: number) => {
    const gridSize = 20 * canvasState.zoom;
    // Use theme-appropriate grid color
    ctx.strokeStyle = isDarkTheme ? "rgba(255, 255, 255, 0.05)" : "rgba(0, 0, 0, 0.1)";
    ctx.lineWidth = 1;

    const offsetX = (canvasState.offsetX * canvasState.zoom) % gridSize;
    const offsetY = (canvasState.offsetY * canvasState.zoom) % gridSize;

    for (let x = -offsetX; x < width; x += gridSize) {
      ctx.beginPath();
      ctx.moveTo(x, 0);
      ctx.lineTo(x, height);
      ctx.stroke();
    }

    for (let y = -offsetY; y < height; y += gridSize) {
      ctx.beginPath();
      ctx.moveTo(0, y);
      ctx.lineTo(width, y);
      ctx.stroke();
    }
  }, [canvasState.zoom, canvasState.offsetX, canvasState.offsetY, isDarkTheme]);

  // Main draw function
  const draw = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    ctx.clearRect(0, 0, canvas.width, canvas.height);

    // Use theme-appropriate background color
    const backgroundColor = isDarkTheme ? canvasBackgroundColorDark : canvasBackgroundColorLight;

    // Fill canvas background
    ctx.fillStyle = backgroundColor;
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // Draw grid background
    drawGrid(ctx, canvas.width, canvas.height);

    // Draw all elements
    elements.forEach((element) => {
      drawElement(ctx, element);
    });

    // Draw current element being drawn
    if (drawingState.currentElement) {
      drawElement(ctx, drawingState.currentElement);
    }

    // Draw selection handles
    selectedElementIds.forEach((id) => {
      const element = elements.find((el) => el.id === id);
      if (element) {
        drawHandles(ctx, element);
      }
    });
  }, [elements, selectedElementIds, drawingState.currentElement, drawElement, drawHandles, canvasBackgroundColorDark, canvasBackgroundColorLight, isDarkTheme, drawGrid]);

  // Watch for theme changes and update state
  useEffect(() => {
    const updateTheme = () => {
      const isDark = document.documentElement.classList.contains("dark") ||
                     (window.matchMedia && window.matchMedia("(prefers-color-scheme: dark)").matches);
      setIsDarkTheme(isDark);
    };

    const observer = new MutationObserver(() => {
      updateTheme();
    });

    // Observe changes to the classList of documentElement and body
    observer.observe(document.documentElement, {
      attributes: true,
      attributeFilter: ['class'],
    });
    observer.observe(document.body, {
      attributes: true,
      attributeFilter: ['class'],
    });

    // Also listen to system theme changes
    const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
    const handleThemeChange = () => {
      updateTheme();
    };
    mediaQuery.addEventListener('change', handleThemeChange);

    // Initial check
    updateTheme();

    return () => {
      observer.disconnect();
      mediaQuery.removeEventListener('change', handleThemeChange);
    };
  }, []);

  // Render loop
  useEffect(() => {
    const animate = () => {
      draw();
      animationFrameRef.current = requestAnimationFrame(animate);
    };
    animationFrameRef.current = requestAnimationFrame(animate);
    return () => {
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
      }
    };
  }, [draw]);

  // Mouse event handlers
  const getMousePoint = (e: React.MouseEvent | MouseEvent): Point => {
    const canvas = canvasRef.current;
    if (!canvas) return { x: 0, y: 0 };
    const rect = canvas.getBoundingClientRect();
    return {
      x: e.clientX - rect.left,
      y: e.clientY - rect.top,
    };
  };

  const handleMouseDown = (e: React.MouseEvent) => {
    const point = getMousePoint(e);
    const worldPoint = getWorldPoint(point);

    // Check if panning (space or middle mouse)
    if (e.button === 1 || (e.button === 0 && e.shiftKey)) {
      setDrawingState({
        ...drawingState,
        isPanning: true,
        panStart: point,
      });
      return;
    }

    if (selectedTool === "selection") {
      // Check if clicking on resize handle
      if (selectedElementIds.length === 1) {
        const element = elements.find((el) => el.id === selectedElementIds[0]);
        if (element) {
          const handle = getResizeHandle(point, element);
          if (handle) {
            const bounds = getElementBounds(element);
            setDrawingState({
              ...drawingState,
              isResizing: true,
              resizeHandle: handle,
              resizeStartBounds: bounds,
            });
            return;
          }
        }
      }

      // Check if clicking on element
      let clickedElement: DrawingElement | null = null;
      for (let i = elements.length - 1; i >= 0; i--) {
        if (isPointInElement(worldPoint, elements[i])) {
          clickedElement = elements[i];
          break;
        }
      }

      if (clickedElement) {
        if (e.shiftKey) {
          // Multi-select
          if (selectedElementIds.includes(clickedElement.id)) {
            setSelectedElementIds(
              selectedElementIds.filter((id) => id !== clickedElement!.id)
            );
          } else {
            setSelectedElementIds([...selectedElementIds, clickedElement.id]);
          }
        } else {
          setSelectedElementIds([clickedElement.id]);
        }
        // Start dragging
        const bounds = getElementBounds(clickedElement);
        setDrawingState({
          ...drawingState,
          isDragging: true,
          dragOffset: {
            x: worldPoint.x - bounds.minX,
            y: worldPoint.y - bounds.minY,
          },
        });
      } else {
        // Deselect
        setSelectedElementIds([]);
      }
    } else if (selectedTool === "text") {
      // Create text element on click
      const id = crypto.randomUUID();
      const newTextElement: DrawingElement = {
        id,
        type: "text",
        x: worldPoint.x,
        y: worldPoint.y,
        text: "Text",
        fontSize: DEFAULT_FONT_SIZE,
        fontFamily: DEFAULT_FONT_FAMILY,
        width: 100,
        height: DEFAULT_FONT_SIZE,
        strokeColor: strokeColor,
        fillColor: fillColor,
        strokeWidth: DEFAULT_STROKE_WIDTH,
        strokeStyle: "solid",
        opacity: 1,
        angle: 0,
        fillPattern: DEFAULT_FILL_PATTERN,
        sloppiness: DEFAULT_SLOPPINESS,
        edgeRounding: DEFAULT_EDGE_ROUNDING,
      };
      addElement(newTextElement);
      setSelectedElementIds([id]);
    } else {
      // Start drawing
      setDrawingState({
        ...drawingState,
        isDrawing: true,
        startPoint: worldPoint,
      });
    }
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    const point = getMousePoint(e);
    const worldPoint = getWorldPoint(point);

    if (drawingState.isPanning && drawingState.panStart) {
      const dx = point.x - drawingState.panStart.x;
      const dy = point.y - drawingState.panStart.y;
      setOffset(
        canvasState.offsetX - dx / canvasState.zoom,
        canvasState.offsetY - dy / canvasState.zoom
      );
      setDrawingState({
        ...drawingState,
        panStart: point,
      });
      return;
    }

    if (drawingState.isResizing && drawingState.resizeHandle && drawingState.resizeStartBounds) {
      const bounds = drawingState.resizeStartBounds;
      const element = elements.find((el) => el.id === selectedElementIds[0]);
      if (!element) return;

      let newBounds = { ...bounds };

      switch (drawingState.resizeHandle) {
        case "nw":
          newBounds.minX = worldPoint.x;
          newBounds.minY = worldPoint.y;
          newBounds.maxX = bounds.maxX;
          newBounds.maxY = bounds.maxY;
          break;
        case "n":
          newBounds.minY = worldPoint.y;
          break;
        case "ne":
          newBounds.maxX = worldPoint.x;
          newBounds.minY = worldPoint.y;
          break;
        case "e":
          newBounds.maxX = worldPoint.x;
          break;
        case "se":
          newBounds.maxX = worldPoint.x;
          newBounds.maxY = worldPoint.y;
          break;
        case "s":
          newBounds.maxY = worldPoint.y;
          break;
        case "sw":
          newBounds.minX = worldPoint.x;
          newBounds.maxY = worldPoint.y;
          break;
        case "w":
          newBounds.minX = worldPoint.x;
          break;
      }

      // Update element based on type
      if (element.type === "rectangle" || element.type === "circle" || element.type === "text") {
        const width = newBounds.maxX - newBounds.minX;
        const height = newBounds.maxY - newBounds.minY;
        updateElement(element.id, {
          x: newBounds.minX,
          y: newBounds.minY,
          width: Math.max(10, width),
          height: Math.max(10, height),
        });
      } else if (element.type === "line" || element.type === "arrow") {
        if (drawingState.resizeHandle === "nw" || drawingState.resizeHandle === "w" || drawingState.resizeHandle === "n") {
          updateElement(element.id, {
            x: newBounds.minX,
            y: newBounds.minY,
          });
        } else {
          updateElement(element.id, {
            x2: newBounds.maxX,
            y2: newBounds.maxY,
          });
        }
      }
      return;
    }

    if (drawingState.isDragging && drawingState.dragOffset) {
      selectedElementIds.forEach((id) => {
        const element = elements.find((el) => el.id === id);
        if (element) {
          updateElement(id, {
            x: worldPoint.x - drawingState.dragOffset!.x,
            y: worldPoint.y - drawingState.dragOffset!.y,
          });
        }
      });
      return;
    }

    if (drawingState.isDrawing && drawingState.startPoint) {
      const { startPoint } = drawingState;
      // Use existing element ID if available, otherwise create new one
      const id = drawingState.currentElement?.id || crypto.randomUUID();

      let newElement: DrawingElement | null = null;
      const minSize = 1; // Minimum size for preview (can be very small)

      switch (selectedTool) {
        case "rectangle":
          newElement = {
            id,
            type: "rectangle",
            x: Math.min(startPoint.x, worldPoint.x),
            y: Math.min(startPoint.y, worldPoint.y),
            width: Math.max(minSize, Math.abs(worldPoint.x - startPoint.x)),
            height: Math.max(minSize, Math.abs(worldPoint.y - startPoint.y)),
            strokeColor: strokeColor,
            fillColor: fillColor,
            strokeWidth: DEFAULT_STROKE_WIDTH,
            strokeStyle: "solid",
            opacity: 1,
            angle: 0,
            fillPattern: DEFAULT_FILL_PATTERN,
            sloppiness: DEFAULT_SLOPPINESS,
            edgeRounding: DEFAULT_EDGE_ROUNDING,
          };
          break;
        case "circle":
          newElement = {
            id,
            type: "circle",
            x: Math.min(startPoint.x, worldPoint.x),
            y: Math.min(startPoint.y, worldPoint.y),
            width: Math.max(minSize, Math.abs(worldPoint.x - startPoint.x)),
            height: Math.max(minSize, Math.abs(worldPoint.y - startPoint.y)),
            strokeColor: strokeColor,
            fillColor: fillColor,
            strokeWidth: DEFAULT_STROKE_WIDTH,
            strokeStyle: "solid",
            opacity: 1,
            angle: 0,
            fillPattern: DEFAULT_FILL_PATTERN,
            sloppiness: DEFAULT_SLOPPINESS,
            edgeRounding: DEFAULT_EDGE_ROUNDING,
          };
          break;
        case "line":
          newElement = {
            id,
            type: "line",
            x: startPoint.x,
            y: startPoint.y,
            x2: worldPoint.x,
            y2: worldPoint.y,
            strokeColor: strokeColor,
            fillColor: fillColor,
            strokeWidth: DEFAULT_STROKE_WIDTH,
            strokeStyle: "solid",
            opacity: 1,
            angle: 0,
            fillPattern: DEFAULT_FILL_PATTERN,
            sloppiness: DEFAULT_SLOPPINESS,
            edgeRounding: DEFAULT_EDGE_ROUNDING,
          };
          break;
        case "arrow":
          newElement = {
            id,
            type: "arrow",
            x: startPoint.x,
            y: startPoint.y,
            x2: worldPoint.x,
            y2: worldPoint.y,
            strokeColor: strokeColor,
            fillColor: fillColor,
            strokeWidth: DEFAULT_STROKE_WIDTH,
            strokeStyle: "solid",
            opacity: 1,
            angle: 0,
            fillPattern: DEFAULT_FILL_PATTERN,
            sloppiness: DEFAULT_SLOPPINESS,
            edgeRounding: DEFAULT_EDGE_ROUNDING,
          };
          break;
        case "text":
          // Text is handled separately on click
          break;
        case "freehand":
          if (!drawingState.currentElement || drawingState.currentElement.type !== "freehand") {
            newElement = {
              id,
              type: "freehand",
              x: startPoint.x,
              y: startPoint.y,
              points: [startPoint, worldPoint],
              strokeColor: strokeColor,
              fillColor: fillColor,
              strokeWidth: DEFAULT_STROKE_WIDTH,
              strokeStyle: "solid",
              opacity: 1,
              angle: 0,
              fillPattern: DEFAULT_FILL_PATTERN,
              sloppiness: DEFAULT_SLOPPINESS,
              edgeRounding: DEFAULT_EDGE_ROUNDING,
            };
          } else {
            newElement = {
              ...drawingState.currentElement,
              points: [...drawingState.currentElement.points, worldPoint],
            };
          }
          break;
      }

      if (newElement) {
        setDrawingState({
          ...drawingState,
          currentElement: newElement,
        });
      }
    }
  };

  const handleMouseUp = (e?: React.MouseEvent) => {
    if (drawingState.isDrawing && drawingState.startPoint && selectedTool !== "selection" && selectedTool !== "text") {
      const { startPoint } = drawingState;
      let elementToAdd = drawingState.currentElement;
      
      // Get current mouse position
      let worldPoint = startPoint;
      if (e) {
        const point = getMousePoint(e);
        worldPoint = getWorldPoint(point);
      } else if (drawingState.currentElement) {
        // If no event but we have a current element, use its end point
        if (drawingState.currentElement.type === "line" || drawingState.currentElement.type === "arrow") {
          worldPoint = {
            x: drawingState.currentElement.x2 || startPoint.x,
            y: drawingState.currentElement.y2 || startPoint.y,
          };
        } else if (drawingState.currentElement.type === "rectangle" || drawingState.currentElement.type === "circle" || drawingState.currentElement.type === "text") {
          worldPoint = {
            x: drawingState.currentElement.x + drawingState.currentElement.width,
            y: drawingState.currentElement.y + drawingState.currentElement.height,
          };
        } else {
          worldPoint = {
            x: startPoint.x + 50,
            y: startPoint.y + 50,
          };
        }
      } else {
        // Fallback: use startPoint with offset
        worldPoint = {
          x: startPoint.x + 50,
          y: startPoint.y + 50,
        };
      }
      
      // Use existing element ID if available, otherwise create new one
      const id = drawingState.currentElement?.id || crypto.randomUUID();
      const minSize = 20; // Minimum size for shapes to ensure visibility

      // Ensure minimum sizes for existing elements, or create new ones
      if (elementToAdd) {
        // Use existing element but enforce minimum sizes
        if (elementToAdd.type === "rectangle" || elementToAdd.type === "circle") {
          if (elementToAdd.width < minSize || elementToAdd.height < minSize) {
            elementToAdd = {
              ...elementToAdd,
              width: Math.max(minSize, elementToAdd.width),
              height: Math.max(minSize, elementToAdd.height),
            };
          }
        } else if (elementToAdd.type === "line") {
          const dx = (elementToAdd.x2 || 0) - elementToAdd.x;
          const dy = (elementToAdd.y2 || 0) - elementToAdd.y;
          const distance = Math.sqrt(dx * dx + dy * dy);
          if (distance < 10) {
            elementToAdd = {
              ...elementToAdd,
              x2: elementToAdd.x + 50,
              y2: elementToAdd.y + 50,
            };
          }
        }
      } else {
        // Create new element if it doesn't exist
        switch (selectedTool) {
          case "rectangle": {
            const rectWidth = Math.abs(worldPoint.x - startPoint.x);
            const rectHeight = Math.abs(worldPoint.y - startPoint.y);
            elementToAdd = {
              id,
              type: "rectangle",
              x: Math.min(startPoint.x, worldPoint.x),
              y: Math.min(startPoint.y, worldPoint.y),
              width: Math.max(minSize, rectWidth),
              height: Math.max(minSize, rectHeight),
              strokeColor: strokeColor,
              fillColor: fillColor,
              strokeWidth: DEFAULT_STROKE_WIDTH,
              strokeStyle: "solid",
              opacity: 1,
              angle: 0,
              fillPattern: DEFAULT_FILL_PATTERN,
              sloppiness: DEFAULT_SLOPPINESS,
              edgeRounding: DEFAULT_EDGE_ROUNDING,
            };
            break;
          }
          case "circle": {
            const circleWidth = Math.abs(worldPoint.x - startPoint.x);
            const circleHeight = Math.abs(worldPoint.y - startPoint.y);
            elementToAdd = {
              id,
              type: "circle",
              x: Math.min(startPoint.x, worldPoint.x),
              y: Math.min(startPoint.y, worldPoint.y),
              width: Math.max(minSize, circleWidth),
              height: Math.max(minSize, circleHeight),
              strokeColor: strokeColor,
              fillColor: fillColor,
              strokeWidth: DEFAULT_STROKE_WIDTH,
              strokeStyle: "solid",
              opacity: 1,
              angle: 0,
              fillPattern: DEFAULT_FILL_PATTERN,
              sloppiness: DEFAULT_SLOPPINESS,
              edgeRounding: DEFAULT_EDGE_ROUNDING,
            };
            break;
          }
          case "line": {
            // For lines, ensure there's at least a small visible distance
            const dx = worldPoint.x - startPoint.x;
            const dy = worldPoint.y - startPoint.y;
            const distance = Math.sqrt(dx * dx + dy * dy);
            const finalX2 = distance < 10 ? startPoint.x + 50 : worldPoint.x;
            const finalY2 = distance < 10 ? startPoint.y + 50 : worldPoint.y;
            elementToAdd = {
              id,
              type: "line",
              x: startPoint.x,
              y: startPoint.y,
              x2: finalX2,
              y2: finalY2,
              strokeColor: strokeColor,
              fillColor: fillColor,
              strokeWidth: DEFAULT_STROKE_WIDTH,
              strokeStyle: "solid",
              opacity: 1,
              angle: 0,
              fillPattern: DEFAULT_FILL_PATTERN,
              sloppiness: DEFAULT_SLOPPINESS,
              edgeRounding: DEFAULT_EDGE_ROUNDING,
            };
            break;
          }
          case "arrow": {
            elementToAdd = {
              id,
              type: "arrow",
              x: startPoint.x,
              y: startPoint.y,
              x2: worldPoint.x,
              y2: worldPoint.y,
              strokeColor: strokeColor,
              fillColor: fillColor,
              strokeWidth: DEFAULT_STROKE_WIDTH,
              strokeStyle: "solid",
              opacity: 1,
              angle: 0,
              fillPattern: DEFAULT_FILL_PATTERN,
              sloppiness: DEFAULT_SLOPPINESS,
              edgeRounding: DEFAULT_EDGE_ROUNDING,
            };
            break;
          }
          case "freehand": {
            elementToAdd = {
              id,
              type: "freehand",
              x: startPoint.x,
              y: startPoint.y,
              points: [startPoint],
              strokeColor: strokeColor,
              fillColor: fillColor,
              strokeWidth: DEFAULT_STROKE_WIDTH,
              strokeStyle: "solid",
              opacity: 1,
              angle: 0,
              fillPattern: DEFAULT_FILL_PATTERN,
              sloppiness: DEFAULT_SLOPPINESS,
              edgeRounding: DEFAULT_EDGE_ROUNDING,
            };
            break;
          }
        }
      }

      // Always add the element if we have one
      if (elementToAdd) {
        addElement(elementToAdd);
      }

      setDrawingState({
        isDrawing: false,
        startPoint: null,
        currentElement: null,
        isDragging: false,
        dragOffset: null,
        isResizing: false,
        resizeHandle: null,
        resizeStartBounds: null,
        isPanning: false,
        panStart: null,
      });
    } else {
      setDrawingState({
        ...drawingState,
        isDrawing: false,
        isDragging: false,
        isResizing: false,
        isPanning: false,
        panStart: null,
      });
    }
  };

  const handleWheel = (e: React.WheelEvent) => {
    e.preventDefault();
    const delta = e.deltaY > 0 ? -ZOOM_STEP : ZOOM_STEP;
    const newZoom = Math.max(
      MIN_ZOOM,
      Math.min(MAX_ZOOM, canvasState.zoom + delta)
    );
    setZoom(newZoom);
  };

  return (
    <div
      ref={containerRef}
      className="absolute inset-0 w-full h-full overflow-hidden"
      onWheel={handleWheel}
    >
      <canvas
        ref={canvasRef}
        className="absolute inset-0 w-full h-full cursor-crosshair"
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onMouseLeave={handleMouseUp}
        style={{ touchAction: "none" }}
        aria-label="Drawing canvas"
      />
    </div>
  );
}
