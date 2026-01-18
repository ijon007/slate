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
    canvasLocked,
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

  const [editingTextId, setEditingTextId] = useState<string | null>(null);
  const textInputRef = useRef<HTMLInputElement>(null);

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

    // Draw all elements (skip text element that's being edited)
    elements.forEach((element) => {
      if (element.type === "text" && element.id === editingTextId) {
        // Skip rendering text element when it's being edited
        return;
      }
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
  }, [elements, selectedElementIds, drawingState.currentElement, drawingState.isBoxSelecting, drawingState.boxSelectionStart, drawingState.boxSelectionEnd, drawElement, drawHandles, canvasBackgroundColorDark, canvasBackgroundColorLight, isDarkTheme, drawGrid, drawBoxSelection, editingTextId]);

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
      canvasLocked,
      setEditingTextId,
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
      canvasLocked,
      setEditingTextId,
    ]
  );

  const { handleMouseDown, handleMouseMove, handleMouseUp, handleDoubleClick } = mouseHandlers;

  // Focus text input when editing starts
  useEffect(() => {
    if (editingTextId && textInputRef.current) {
      // Small delay to ensure DOM is updated
      const timeoutId = setTimeout(() => {
        if (textInputRef.current) {
          textInputRef.current.focus();
          textInputRef.current.select();
        }
      }, 10);
      return () => clearTimeout(timeoutId);
    }
  }, [editingTextId]);

  // Get the text element being edited
  const editingTextElement = useMemo(() => {
    if (!editingTextId) return null;
    const element = elements.find((el) => el.id === editingTextId && el.type === "text");
    return element?.type === "text" ? element : null;
  }, [editingTextId, elements]);

  // Calculate text dimensions based on content
  const calculateTextDimensions = useCallback((text: string, fontSize: number, fontFamily: string) => {
    if (!canvasRef.current) return { width: 100 / canvasState.zoom, height: fontSize };
    
    const ctx = canvasRef.current.getContext("2d");
    if (!ctx) return { width: 100 / canvasState.zoom, height: fontSize };
    
    ctx.font = `${fontSize}px ${fontFamily}`;
    const metrics = ctx.measureText(text || " ");
    const textWidth = metrics.width;
    
    // Padding equivalent to p-1 (4px) but in world coordinates
    const padding = 4 / canvasState.zoom; // 4px padding in world coordinates
    const minWidth = 100 / canvasState.zoom; // Minimum width in world coordinates
    
    return {
      width: Math.max(minWidth, textWidth / canvasState.zoom + padding * 2),
      height: fontSize,
    };
  }, [canvasState.zoom]);

  // Handle text input changes
  const handleTextChange = (value: string) => {
    if (editingTextId && editingTextElement && editingTextElement.type === "text") {
      const dimensions = calculateTextDimensions(value, editingTextElement.fontSize, editingTextElement.fontFamily);
      updateElement(editingTextId, { 
        text: value,
        width: dimensions.width,
        height: dimensions.height,
      });
    }
  };

  // Handle text input blur/enter
  const handleTextBlur = () => {
    setEditingTextId(null);
  };

  const handleTextKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      setEditingTextId(null);
    } else if (e.key === "Escape") {
      setEditingTextId(null);
    }
  };

  const handleWheel = (e: React.WheelEvent) => {
    e.preventDefault();
    if (canvasLocked) return;
    const delta = e.deltaY > 0 ? -ZOOM_STEP : ZOOM_STEP;
    const newZoom = Math.max(
      MIN_ZOOM,
      Math.min(MAX_ZOOM, canvasState.zoom + delta)
    );
    setZoom(newZoom);
  };

  // Calculate input position and size to match text element bounds
  const inputBounds = useMemo(() => {
    if (!editingTextElement || editingTextElement.type !== "text" || !canvasRef.current || !containerRef.current) return null;
    
    // Get bounds in world coordinates - use the same logic as selection handles
    const bounds = {
      minX: editingTextElement.x,
      minY: editingTextElement.y,
      maxX: editingTextElement.x + editingTextElement.width,
      maxY: editingTextElement.y + editingTextElement.height,
    };
    
    // Convert to screen coordinates (relative to canvas)
    const minScreen = getScreenPoint({ x: bounds.minX, y: bounds.minY });
    const maxScreen = getScreenPoint({ x: bounds.maxX, y: bounds.maxY });
    
    // Calculate screen rectangle dimensions (same as selection handles)
    const x = Math.min(minScreen.x, maxScreen.x);
    const y = Math.min(minScreen.y, maxScreen.y);
    const width = Math.abs(maxScreen.x - minScreen.x);
    const height = Math.abs(maxScreen.y - minScreen.y);
    
    // Since both canvas and input are absolutely positioned in the same container,
    // and canvas uses inset-0, coordinates should be relative to container
    // But we need to ensure we're using the correct reference
    const canvasRect = canvasRef.current.getBoundingClientRect();
    const containerRect = containerRef.current.getBoundingClientRect();
    
    // Calculate offset from container to canvas (should be 0,0 if canvas is inset-0)
    const offsetX = canvasRect.left - containerRect.left;
    const offsetY = canvasRect.top - containerRect.top;
    
    return {
      left: Math.round(x + offsetX),
      top: Math.round(y + offsetY),
      width: Math.max(Math.round(width), 100),
      height: Math.max(Math.round(height), editingTextElement.fontSize),
    };
  }, [editingTextElement, getScreenPoint, canvasState.zoom, canvasState.offsetX, canvasState.offsetY]);

  return (
    <div
      ref={containerRef}
      className="absolute inset-0 w-full h-full overflow-hidden"
      onWheel={handleWheel}
    >
      <canvas
        ref={canvasRef}
        className="absolute inset-0 w-full h-full cursor-crosshair"
        onMouseDown={(e) => {
          if (!editingTextId) {
            handleMouseDown(e);
          }
        }}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onMouseLeave={handleMouseUp}
        onDoubleClick={handleDoubleClick}
        style={{ touchAction: "none", pointerEvents: editingTextId ? "none" : "auto" }}
        aria-label="Drawing canvas"
      />
      {editingTextElement && editingTextElement.type === "text" && inputBounds && (
        <input
          ref={textInputRef}
          type="text"
          value={editingTextElement.text}
          onChange={(e) => {
            handleTextChange(e.target.value);
          }}
          onBlur={handleTextBlur}
          onKeyDown={handleTextKeyDown}
          onClick={(e) => e.stopPropagation()}
          onMouseDown={(e) => {
            e.stopPropagation();
            e.preventDefault();
          }}
          onDoubleClick={(e) => e.stopPropagation()}
          placeholder="Type here..."
          style={{
            position: "absolute",
            left: `${inputBounds.left}px`,
            top: `${inputBounds.top}px`,
            width: `${inputBounds.width}px`,
            height: `${inputBounds.height}px`,
            fontFamily: `"${editingTextElement.fontFamily}", cursive`,
            fontSize: `${editingTextElement.fontSize}px`,
            color: editingTextElement.strokeColor || "#FFFFFF",
            backgroundColor: "transparent",
            border: "none",
            padding: "0",
            margin: "0",
            outline: "none",
            zIndex: 1000,
            pointerEvents: "auto",
            caretColor: editingTextElement.strokeColor || "#FFFFFF",
            lineHeight: `${editingTextElement.fontSize}px`,
            boxSizing: "border-box",
            textAlign: (editingTextElement.textAlign || "left") as "left" | "center" | "right",
            display: "block",
          }}
        />
      )}
    </div>
  );
}
