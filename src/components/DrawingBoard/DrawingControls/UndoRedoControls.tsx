import { Button } from "@/components/ui/button";
import { ArrowCounterClockwise, ArrowClockwise, Trash } from "@phosphor-icons/react";
import { useStore } from "@/lib/storage/store";

interface UndoRedoControlsProps {
  onClearClick: () => void;
}

export function UndoRedoControls({ onClearClick }: UndoRedoControlsProps) {
  const { canUndo, canRedo, undo, redo } = useStore();

  return (
    <div className="flex gap-2">
      <Button
        variant="outline"
        size="icon"
        onClick={undo}
        disabled={!canUndo()}
        aria-label="Undo"
        title="Undo (Ctrl+Z)"
      >
        <ArrowCounterClockwise className="size-4" />
      </Button>
      <Button
        variant="outline"
        size="icon"
        onClick={redo}
        disabled={!canRedo()}
        aria-label="Redo"
        title="Redo (Ctrl+Shift+Z)"
      >
        <ArrowClockwise className="size-4" />
      </Button>
      <Button
        variant="destructive"
        className="flex-1 justify-start"
        onClick={onClearClick}
        aria-label="Clear canvas"
      >
        <Trash className="size-4 mr-2" />
        Clear canvas
      </Button>
    </div>
  );
}
