import { create } from "zustand";
import { persist } from "zustand/middleware";
import { toast } from "sonner";
import type {
  DrawingElement,
  ToolType,
  HistoryState,
  CanvasState,
} from "@/lib/drawing/types";
import { HISTORY_LIMIT, DEFAULT_ZOOM, DEFAULT_STROKE_COLOR, DEFAULT_FILL_COLOR } from "@/lib/drawing/constants";

export interface Note {
  id: string;
  title: string;
  content: string;
  createdAt: number;
  updatedAt: number;
}

interface AppState {
  // Drawing state
  elements: DrawingElement[];
  selectedTool: ToolType;
  selectedElementIds: string[];
  canvasState: CanvasState;
  history: HistoryState;
  strokeColor: string;
  fillColor: string;
  canvasBackgroundColorDark: string;
  canvasBackgroundColorLight: string;
  canvasLocked: boolean;

  // Notes state
  notes: Note[];

  // Drawing actions
  addElement: (element: DrawingElement) => void;
  updateElement: (id: string, updates: Partial<DrawingElement>) => void;
  deleteElement: (id: string) => void;
  deleteElements: (ids: string[]) => void;
  setSelectedTool: (tool: ToolType) => void;
  setSelectedElementIds: (ids: string[]) => void;
  clearCanvas: () => void;
  setElements: (elements: DrawingElement[]) => void;
  setStrokeColor: (color: string) => void;
  setFillColor: (color: string) => void;
  setCanvasBackgroundColorDark: (color: string) => void;
  setCanvasBackgroundColorLight: (color: string) => void;
  setCanvasLocked: (locked: boolean) => void;

  // Canvas actions
  setZoom: (zoom: number) => void;
  setOffset: (x: number, y: number) => void;
  resetCanvas: () => void;

  // History actions
  pushState: () => void;
  undo: () => void;
  redo: () => void;
  canUndo: () => boolean;
  canRedo: () => boolean;

  // Notes actions
  addNote: (note: Omit<Note, "id" | "createdAt" | "updatedAt">) => Note;
  updateNote: (id: string, updates: Partial<Omit<Note, "id" | "createdAt">>) => void;
  deleteNote: (id: string) => void;
  getNote: (id: string) => Note | undefined;
}

export const useStore = create<AppState>()(
  persist(
    (set, get) => ({
      // Initial state
      elements: [],
      selectedTool: "selection",
      selectedElementIds: [],
      canvasState: {
        zoom: DEFAULT_ZOOM,
        offsetX: 0,
        offsetY: 0,
      },
      history: {
        past: [],
        present: [],
        future: [],
      },
      strokeColor: DEFAULT_STROKE_COLOR,
      fillColor: DEFAULT_FILL_COLOR,
      canvasBackgroundColorDark: "#0a0a0a", // Original darker background
      canvasBackgroundColorLight: "#ffffff", // Default light background
      canvasLocked: false,
      notes: [],

      // Drawing actions
      addElement: (element) => {
        set((state) => ({
          elements: [...state.elements, element],
        }));
        get().pushState();
      },

      updateElement: (id, updates) => {
        set((state) => ({
          elements: state.elements.map((el) =>
            el.id === id ? { ...el, ...updates } : el
          ),
        }));
      },

      deleteElement: (id) => {
        set((state) => ({
          elements: state.elements.filter((el) => el.id !== id),
          selectedElementIds: state.selectedElementIds.filter((eid) => eid !== id),
        }));
        get().pushState();
      },

      deleteElements: (ids) => {
        set((state) => ({
          elements: state.elements.filter((el) => !ids.includes(el.id)),
          selectedElementIds: state.selectedElementIds.filter((eid) => !ids.includes(eid)),
        }));
        get().pushState();
      },

      setSelectedTool: (tool) => {
        set({ selectedTool: tool });
      },

      setSelectedElementIds: (ids) => {
        set({ selectedElementIds: ids });
      },

      clearCanvas: () => {
        set({
          elements: [],
          selectedElementIds: [],
        });
        get().pushState();
      },

      setElements: (elements) => {
        set({ elements });
        get().pushState();
      },

      setStrokeColor: (color) => {
        set({ strokeColor: color });
      },

      setFillColor: (color) => {
        set({ fillColor: color });
      },

      setCanvasBackgroundColorDark: (color) => {
        set({ canvasBackgroundColorDark: color });
      },

      setCanvasBackgroundColorLight: (color) => {
        set({ canvasBackgroundColorLight: color });
      },

      setCanvasLocked: (locked) => {
        set({ canvasLocked: locked });
      },

      // Canvas actions
      setZoom: (zoom) => {
        set((state) => ({
          canvasState: {
            ...state.canvasState,
            zoom,
          },
        }));
      },

      setOffset: (x, y) => {
        set((state) => ({
          canvasState: {
            ...state.canvasState,
            offsetX: x,
            offsetY: y,
          },
        }));
      },

      resetCanvas: () => {
        set({
          canvasState: {
            zoom: DEFAULT_ZOOM,
            offsetX: 0,
            offsetY: 0,
          },
        });
      },

      // History actions
      pushState: () => {
        set((state) => {
          const newPast = [...state.history.past, state.history.present];
          const trimmedPast =
            newPast.length > HISTORY_LIMIT
              ? newPast.slice(-HISTORY_LIMIT)
              : newPast;

          return {
            history: {
              past: trimmedPast,
              present: state.elements,
              future: [],
            },
          };
        });
      },

      undo: () => {
        set((state) => {
          if (state.history.past.length === 0) return state;

          const previous = state.history.past[state.history.past.length - 1];
          const newPast = state.history.past.slice(0, -1);

          return {
            elements: previous,
            history: {
              past: newPast,
              present: previous,
              future: [state.history.present, ...state.history.future],
            },
          };
        });
      },

      redo: () => {
        set((state) => {
          if (state.history.future.length === 0) return state;

          const next = state.history.future[0];
          const newFuture = state.history.future.slice(1);

          return {
            elements: next,
            history: {
              past: [...state.history.past, state.history.present],
              present: next,
              future: newFuture,
            },
          };
        });
      },

      canUndo: () => {
        return get().history.past.length > 0;
      },

      canRedo: () => {
        return get().history.future.length > 0;
      },

      // Notes actions
      addNote: (noteData) => {
        const note: Note = {
          ...noteData,
          id: crypto.randomUUID(),
          createdAt: Date.now(),
          updatedAt: Date.now(),
        };

        set((state) => ({
          notes: [...state.notes, note],
        }));

        return note;
      },

      updateNote: (id, updates) => {
        set((state) => ({
          notes: state.notes.map((note) =>
            note.id === id
              ? { ...note, ...updates, updatedAt: Date.now() }
              : note
          ),
        }));
      },

      deleteNote: (id) => {
        set((state) => ({
          notes: state.notes.filter((note) => note.id !== id),
        }));
      },

      getNote: (id) => {
        return get().notes.find((note) => note.id === id);
      },
    }),
    {
      name: "excalidraw-clone-storage",
      version: 1,
      partialize: (state) => ({
        elements: state.elements,
        notes: state.notes,
        canvasState: state.canvasState,
      }),
      onRehydrateStorage: () => (state, error) => {
        if (error) {
          console.error("Failed to rehydrate storage:", error);
          toast.error("Failed to load saved data. Starting fresh.");
        }
      },
      storage: {
        getItem: (name) => {
          try {
            const value = localStorage.getItem(name);
            return value ? JSON.parse(value) : null;
          } catch (error) {
            console.error("Error reading from localStorage:", error);
            toast.error("Failed to read saved data");
            return null;
          }
        },
        setItem: (name, value) => {
          try {
            localStorage.setItem(name, JSON.stringify(value));
          } catch (error: any) {
            if (error?.name === "QuotaExceededError") {
              console.error("localStorage quota exceeded");
              toast.error("Storage limit reached. Some data may not be saved.");
            } else {
              console.error("Error writing to localStorage:", error);
              toast.error("Failed to save data");
            }
          }
        },
        removeItem: (name) => {
          try {
            localStorage.removeItem(name);
          } catch (error) {
            console.error("Error removing from localStorage:", error);
          }
        },
      },
    }
  )
);
