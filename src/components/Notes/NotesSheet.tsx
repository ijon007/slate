import { useState, useEffect } from "react";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { NotesList } from "./NotesList";
import { Notebook } from "@phosphor-icons/react";
import { useNavigate } from "@tanstack/react-router";
import { Route } from "@/routes/index";

export function NotesSheet() {
  const navigate = useNavigate();
  const search = Route.useSearch();
  const shouldOpen = search.notes === "open";
  const [open, setOpen] = useState(shouldOpen);

  useEffect(() => {
    setOpen(shouldOpen);
  }, [shouldOpen]);

  const handleOpenChange = (newOpen: boolean) => {
    setOpen(newOpen);
    if (!newOpen) {
      // Remove the notes=open param when closing
      navigate({
        to: "/",
        search: { notes: undefined },
        replace: true,
      });
    }
  };

  return (
    <Sheet open={open} onOpenChange={handleOpenChange}>
      <SheetTrigger
        render={
          <Button
            variant="default"
            size="icon"
            className="fixed top-4 right-4 z-20 shadow-lg size-9"
            aria-label="Open notes"
          >
            <Notebook className="size-4" weight="bold" />
          </Button>
        }
      />
      <SheetContent side="right" className="right-0! top-0! bottom-0! h-screen! w-full overflow-y-auto sm:right-4! sm:top-4! sm:bottom-4! sm:h-[calc(100vh-2rem)]! sm:rounded-lg sm:max-w-4xl p-0 border!" showCloseButton={false}>
        <NotesList onClose={() => setOpen(false)} />
      </SheetContent>
    </Sheet>
  );
}
