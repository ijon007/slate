import { useEffect, useState } from "react";
import { useStore } from "@/lib/storage/store";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Keyboard } from "@phosphor-icons/react";

const SHORTCUTS = [
  {
    category: "Drawing Tools",
    shortcuts: [
      { key: "V", description: "Selection tool" },
      { key: "R", description: "Rectangle tool" },
      { key: "C", description: "Circle tool" },
      { key: "A", description: "Arrow tool" },
      { key: "L", description: "Line tool" },
      { key: "T", description: "Text tool" },
      { key: "F", description: "Freehand tool" },
    ],
  },
  {
    category: "Actions",
    shortcuts: [
      { key: "Ctrl/Cmd + Z", description: "Undo" },
      { key: "Ctrl/Cmd + Shift + Z", description: "Redo" },
      { key: "Delete/Backspace", description: "Delete selected element" },
      { key: "Escape", description: "Deselect all" },
      { key: "Ctrl/Cmd + A", description: "Select all" },
      { key: "Ctrl/Cmd + D", description: "Duplicate selected" },
      { key: "Space + Drag", description: "Pan canvas" },
      { key: "Ctrl/Cmd + 0", description: "Reset zoom" },
    ],
  },
  {
    category: "Notes",
    shortcuts: [
      { key: "Ctrl/Cmd + N", description: "New note" },
      { key: "Ctrl/Cmd + S", description: "Save note" },
      { key: "Ctrl/Cmd + P", description: "Toggle preview mode" },
    ],
  },
];

export function KeyboardShortcuts() {
  const {
    selectedTool,
    setSelectedTool,
    selectedElementIds,
    deleteElements,
    setSelectedElementIds,
    undo,
    redo,
    canUndo,
    canRedo,
    resetCanvas,
    addNote,
    canvasLocked,
  } = useStore();

  const [showHelp, setShowHelp] = useState(false);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Don't handle shortcuts when typing in inputs
      const target = e.target as HTMLElement;
      if (
        target.tagName === "INPUT" ||
        target.tagName === "TEXTAREA" ||
        target.isContentEditable
      ) {
        // Allow some shortcuts in text inputs
        if (
          (e.key === "p" || e.key === "P") &&
          (e.metaKey || e.ctrlKey) &&
          target.tagName === "TEXTAREA"
        ) {
          // Toggle preview in textarea (handled by NoteEditor)
          return;
        }
        return;
      }

      // Prevent tool shortcuts and actions when canvas is locked
      if (!canvasLocked) {
        // Tool shortcuts
        if (e.key === "v" || e.key === "V") {
          e.preventDefault();
          setSelectedTool("selection");
          return;
        }
        if (e.key === "r" || e.key === "R") {
          e.preventDefault();
          setSelectedTool("rectangle");
          return;
        }
        if (e.key === "c" || e.key === "C") {
          e.preventDefault();
          setSelectedTool("circle");
          return;
        }
        if (e.key === "a" || e.key === "A") {
          e.preventDefault();
          setSelectedTool("arrow");
          return;
        }
        if (e.key === "l" || e.key === "L") {
          e.preventDefault();
          setSelectedTool("line");
          return;
        }
        if (e.key === "t" || e.key === "T") {
          e.preventDefault();
          setSelectedTool("text");
          return;
        }
        if (e.key === "f" || e.key === "F") {
          e.preventDefault();
          setSelectedTool("freehand");
          return;
        }

        // Action shortcuts
        if ((e.metaKey || e.ctrlKey) && e.key === "z" && !e.shiftKey) {
          e.preventDefault();
          if (canUndo()) undo();
          return;
        }
        if ((e.metaKey || e.ctrlKey) && (e.key === "z" || e.key === "Z") && e.shiftKey) {
          e.preventDefault();
          if (canRedo()) redo();
          return;
        }
        if (e.key === "Delete" || e.key === "Backspace") {
          if (selectedElementIds.length > 0) {
            e.preventDefault();
            deleteElements(selectedElementIds);
          }
          return;
        }
        if (e.key === "Escape") {
          e.preventDefault();
          setSelectedElementIds([]);
          return;
        }
        if ((e.metaKey || e.ctrlKey) && e.key === "a") {
          e.preventDefault();
          // Select all elements
          const { elements } = useStore.getState();
          setSelectedElementIds(elements.map((el) => el.id));
          return;
        }
        if ((e.metaKey || e.ctrlKey) && e.key === "d") {
          e.preventDefault();
          // Duplicate selected elements (simplified - just copy IDs for now)
          // Full implementation would create new elements
          return;
        }
        if ((e.metaKey || e.ctrlKey) && e.key === "0") {
          e.preventDefault();
          resetCanvas();
          return;
        }
      }

      // Help shortcut
      if ((e.metaKey || e.ctrlKey) && e.key === "/") {
        e.preventDefault();
        setShowHelp(true);
        return;
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [
    selectedTool,
    setSelectedTool,
    selectedElementIds,
    deleteElements,
    setSelectedElementIds,
    undo,
    redo,
    canUndo,
    canRedo,
    resetCanvas,
    canvasLocked,
  ]);

  return (
    <>
      <Dialog open={showHelp} onOpenChange={setShowHelp}>
        <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Keyboard className="size-5" />
              Keyboard Shortcuts
            </DialogTitle>
            <DialogDescription>
              Press Ctrl/Cmd + / to toggle this help dialog
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-6 mt-4">
            {SHORTCUTS.map((category) => (
              <div key={category.category}>
                <h3 className="text-sm font-semibold mb-2">{category.category}</h3>
                <div className="space-y-2">
                  {category.shortcuts.map((shortcut) => (
                    <div
                      key={shortcut.key}
                      className="flex items-center justify-between py-1"
                    >
                      <span className="text-sm text-muted-foreground">
                        {shortcut.description}
                      </span>
                      <kbd className="px-2 py-1 text-xs font-semibold bg-muted rounded border border-border">
                        {shortcut.key}
                      </kbd>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}
