import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { NotesList } from "@/components/Notes/NotesList";
import { Button } from "@/components/ui/button";
import { ArrowLeft } from "@phosphor-icons/react";

export const Route = createFileRoute("/notes/")({
  component: NotesIndex,
});

function NotesIndex() {
  const navigate = useNavigate();

  return (
    <div className="flex flex-col h-screen">
      <div className="border-b p-4 flex items-center gap-4">
        <Button
          variant="ghost"
          size="icon"
          onClick={() => navigate({ to: "/" })}
          aria-label="Back to drawing board"
        >
          <ArrowLeft className="size-4" />
        </Button>
        <h1 className="text-xl font-semibold">Notes</h1>
      </div>
      <div className="flex-1 overflow-hidden">
        <NotesList />
      </div>
    </div>
  );
}
