import { useEffect, useRef, useState, useCallback, useMemo } from "react";
import rough from "roughjs";
import type { Point } from "@/lib/drawing/types";
import { useStore } from "@/lib/storage/store";
import {
  toWorldCoordinates,
  toScreenCoordinates,
} from "@/lib/drawing/utils";
import {
  MIN_ZOOM,
  MAX_ZOOM,
  ZOOM_STEP,
} from "@/lib/drawing/constants";
import { createElementRenderer } from "./Canvas/ElementRenderer";
import { createSelectionHandlesRenderer, createResizeHandleGetter } from "./Canvas/SelectionHandles";
import { createGridRenderer } from "./Canvas/GridRenderer";
import { createBoxSelectionRenderer } from "./Canvas/BoxSelectionRenderer";
import { createMouseHandlers, createGetMousePoint, type DrawingState } from "./Canvas/mouseHandlers";

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
    isBoxSelecting: false,
    boxSelectionStart: null,
    boxSelectionEnd: null,
    boxSelectionShiftKey: false,
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

  // Create renderer instances
  const drawElement = useCallback(
    createElementRenderer({ getScreenPoint }),
    [getScreenPoint]
  );

  const drawHandles = useCallback(
    createSelectionHandlesRenderer({ getScreenPoint }),
    [getScreenPoint]
  );

  const getResizeHandle = useCallback(
    createResizeHandleGetter({ getScreenPoint }),
    [getScreenPoint]
  );

  const drawGrid = useCallback(
    createGridRenderer({
      zoom: canvasState.zoom,
      offsetX: canvasState.offsetX,
      offsetY: canvasState.offsetY,
      isDarkTheme,
    }),
    [canvasState.zoom, canvasState.offsetX, canvasState.offsetY, isDarkTheme]
  );

  const drawBoxSelection = useCallback(
    createBoxSelectionRenderer({ getScreenPoint }),
    [getScreenPoint]
  );

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

    // Draw box selection rectangle
    if (drawingState.isBoxSelecting && drawingState.boxSelectionStart && drawingState.boxSelectionEnd) {
      drawBoxSelection(ctx, drawingState.boxSelectionStart, drawingState.boxSelectionEnd);
    }
  }, [elements, selectedElementIds, drawingState.currentElement, drawingState.isBoxSelecting, drawingState.boxSelectionStart, drawingState.boxSelectionEnd, drawElement, drawHandles, canvasBackgroundColorDark, canvasBackgroundColorLight, isDarkTheme, drawGrid, drawBoxSelection]);

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
  const getMousePoint = useCallback(
    createGetMousePoint(canvasRef as React.RefObject<HTMLCanvasElement>),
    []
  );

  const mouseHandlers = useMemo(
    () => createMouseHandlers({
      getMousePoint,
      getWorldPoint,
      getResizeHandle,
      drawingState,
      setDrawingState,
      selectedTool,
      selectedElementIds,
      elements,
      canvasState,
      strokeColor,
      fillColor,
      addElement,
      updateElement,
      setSelectedElementIds,
      setOffset,
    }),
    [
      getMousePoint,
      getWorldPoint,
      getResizeHandle,
      drawingState,
      selectedTool,
      selectedElementIds,
      elements,
      canvasState,
      strokeColor,
      fillColor,
      addElement,
      updateElement,
      setSelectedElementIds,
      setOffset,
    ]
  );

  const { handleMouseDown, handleMouseMove, handleMouseUp } = mouseHandlers;

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
