import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { Trash } from "@phosphor-icons/react";
import { toast } from "sonner";
import { useStore } from "@/lib/storage/store";

interface ClearCanvasDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function ClearCanvasDialog({ open, onOpenChange }: ClearCanvasDialogProps) {
  const { clearCanvas } = useStore();

  const handleClear = () => {
    clearCanvas();
    onOpenChange(false);
    toast.success("Canvas cleared");
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Clear Canvas</DialogTitle>
          <DialogDescription>
            Are you sure you want to clear the entire canvas? This action cannot be undone.
          </DialogDescription>
        </DialogHeader>
        <DialogFooter>
          <Button
            variant="outline"
            onClick={() => onOpenChange(false)}
          >
            Cancel
          </Button>
          <Button variant="destructive" onClick={handleClear}>
            <Trash className="size-4" />
            Clear canvas
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
