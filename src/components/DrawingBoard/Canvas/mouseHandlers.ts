import type { DrawingElement, Point } from "@/lib/drawing/types";
import { isPointInElement, getElementBounds, elementIntersectsBox } from "@/lib/drawing/utils";
import type { ResizeHandle } from "./SelectionHandles";
import { createDrawingElement, createTextElement, ensureMinimumSize, getElementEndPoint } from "./elementCreators";
import {
  DEFAULT_STROKE_WIDTH,
  DEFAULT_FONT_SIZE,
  DEFAULT_FONT_FAMILY,
} from "@/lib/drawing/constants";

export interface DrawingState {
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
  isBoxSelecting: boolean;
  boxSelectionStart: Point | null;
  boxSelectionEnd: Point | null;
  boxSelectionShiftKey: boolean;
}

interface MouseHandlersParams {
  getMousePoint: (e: React.MouseEvent | MouseEvent) => Point;
  getWorldPoint: (point: Point) => Point;
  getResizeHandle: (point: Point, element: DrawingElement) => ResizeHandle;
  drawingState: DrawingState;
  setDrawingState: React.Dispatch<React.SetStateAction<DrawingState>>;
  selectedTool: string;
  selectedElementIds: string[];
  elements: DrawingElement[];
  canvasState: { zoom: number; offsetX: number; offsetY: number };
  strokeColor: string;
  fillColor: string;
  addElement: (element: DrawingElement) => void;
  updateElement: (id: string, updates: Partial<DrawingElement>) => void;
  setSelectedElementIds: (ids: string[]) => void;
  setOffset: (x: number, y: number) => void;
}

export function createMouseHandlers({
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
}: MouseHandlersParams) {
  const handleMouseDown = (e: React.MouseEvent) => {
    const point = getMousePoint(e);
    const worldPoint = getWorldPoint(point);

    // Check if panning (middle mouse button only)
    if (e.button === 1) {
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
        let willBeSelected = false;
        if (e.shiftKey) {
          // Multi-select
          if (selectedElementIds.includes(clickedElement.id)) {
            // Deselecting this element
            const newIds = selectedElementIds.filter((id) => id !== clickedElement!.id);
            setSelectedElementIds(newIds);
            willBeSelected = false;
          } else {
            // Adding to selection
            setSelectedElementIds([...selectedElementIds, clickedElement.id]);
            willBeSelected = true;
          }
        } else {
          setSelectedElementIds([clickedElement.id]);
          willBeSelected = true;
        }
        
        // Start dragging only if the clicked element will be selected
        if (willBeSelected) {
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
          // Element was deselected, don't start dragging
          setDrawingState({
            ...drawingState,
            isDragging: false,
            dragOffset: null,
          });
        }
      } else {
        // Clicked on empty canvas
        if (e.shiftKey) {
          // Maintain current selection when Shift+clicking empty space
          // Start box selection to add to selection
          setDrawingState({
            ...drawingState,
            isBoxSelecting: true,
            boxSelectionStart: worldPoint,
            boxSelectionEnd: worldPoint,
            boxSelectionShiftKey: true,
          });
        } else {
          // Deselect and start box selection
          setSelectedElementIds([]);
          setDrawingState({
            ...drawingState,
            isBoxSelecting: true,
            boxSelectionStart: worldPoint,
            boxSelectionEnd: worldPoint,
            boxSelectionShiftKey: false,
          });
        }
      }
    } else if (selectedTool === "text") {
      // Create text element on click
      const id = crypto.randomUUID();
      const newTextElement = createTextElement(
        id,
        worldPoint,
        strokeColor,
        fillColor,
        DEFAULT_FONT_SIZE,
        DEFAULT_FONT_FAMILY
      );
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

    if (drawingState.isBoxSelecting && drawingState.boxSelectionStart) {
      // Update box selection end point
      setDrawingState({
        ...drawingState,
        boxSelectionEnd: worldPoint,
      });
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

      if (selectedTool === "freehand" && drawingState.currentElement && drawingState.currentElement.type === "freehand") {
        newElement = {
          ...drawingState.currentElement,
          points: [...drawingState.currentElement.points, worldPoint],
        };
      } else if (selectedTool !== "text" && selectedTool !== "selection") {
        newElement = createDrawingElement({
          id,
          type: selectedTool as "rectangle" | "circle" | "line" | "arrow" | "freehand",
          startPoint,
          endPoint: worldPoint,
          strokeColor,
          fillColor,
          minSize,
        });
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
    // Handle box selection completion
    if (drawingState.isBoxSelecting && drawingState.boxSelectionStart && drawingState.boxSelectionEnd) {
      const boxMinX = Math.min(drawingState.boxSelectionStart.x, drawingState.boxSelectionEnd.x);
      const boxMinY = Math.min(drawingState.boxSelectionStart.y, drawingState.boxSelectionEnd.y);
      const boxMaxX = Math.max(drawingState.boxSelectionStart.x, drawingState.boxSelectionEnd.x);
      const boxMaxY = Math.max(drawingState.boxSelectionStart.y, drawingState.boxSelectionEnd.y);

      // Find all elements that intersect with the selection box
      const intersectingElements = elements.filter((element) =>
        elementIntersectsBox(element, boxMinX, boxMinY, boxMaxX, boxMaxY)
      );

      const intersectingIds = intersectingElements.map((el) => el.id);

      if (drawingState.boxSelectionShiftKey) {
        // Add to existing selection
        const newSelection = [...selectedElementIds];
        intersectingIds.forEach((id) => {
          if (!newSelection.includes(id)) {
            newSelection.push(id);
          }
        });
        setSelectedElementIds(newSelection);
      } else {
        // Replace selection
        setSelectedElementIds(intersectingIds);
      }

      // Reset box selection state
      setDrawingState({
        ...drawingState,
        isBoxSelecting: false,
        boxSelectionStart: null,
        boxSelectionEnd: null,
        boxSelectionShiftKey: false,
      });
      return;
    }

    if (drawingState.isDrawing && drawingState.startPoint && selectedTool !== "selection" && selectedTool !== "text") {
      const { startPoint } = drawingState;
      let elementToAdd = drawingState.currentElement;
      
      // Get current mouse position
      let worldPoint = startPoint;
      if (e) {
        const point = getMousePoint(e);
        worldPoint = getWorldPoint(point);
      } else if (drawingState.currentElement) {
        worldPoint = getElementEndPoint(drawingState.currentElement, startPoint);
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
        elementToAdd = ensureMinimumSize(elementToAdd, minSize);
      } else {
        // Create new element if it doesn't exist
        elementToAdd = createDrawingElement({
          id,
          type: selectedTool as "rectangle" | "circle" | "line" | "arrow" | "freehand",
          startPoint,
          endPoint: worldPoint,
          strokeColor,
          fillColor,
          minSize,
        });
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
        isBoxSelecting: false,
        boxSelectionStart: null,
        boxSelectionEnd: null,
        boxSelectionShiftKey: false,
      });
    } else {
      setDrawingState({
        ...drawingState,
        isDrawing: false,
        isDragging: false,
        isResizing: false,
        isPanning: false,
        panStart: null,
        isBoxSelecting: false,
        boxSelectionStart: null,
        boxSelectionEnd: null,
        boxSelectionShiftKey: false,
      });
    }
  };

  return { handleMouseDown, handleMouseMove, handleMouseUp };
}

export function createGetMousePoint(canvasRef: React.RefObject<HTMLCanvasElement>) {
  return (e: React.MouseEvent | MouseEvent): Point => {
    const canvas = canvasRef.current;
    if (!canvas) return { x: 0, y: 0 };
    const rect = canvas.getBoundingClientRect();
    return {
      x: e.clientX - rect.left,
      y: e.clientY - rect.top,
    };
  };
}
