import { useState } from "react";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { NotesList } from "./NotesList";
import { Notebook } from "@phosphor-icons/react";

export function NotesSheet() {
  const [open, setOpen] = useState(false);

  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetTrigger
        render={
          <Button
            variant="default"
            size="default"
            className="fixed top-4 right-4 z-20 shadow-lg"
            aria-label="Open notes"
          >
            <Notebook className="size-4 mr-2" />
            Notes
          </Button>
        }
      />
      <SheetContent side="right" className="w-[400px] sm:w-[540px] p-0">
        <NotesList onClose={() => setOpen(false)} />
      </SheetContent>
    </Sheet>
  );
}
