import { useState } from "react";
import { useStore } from "@/lib/storage/store";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Plus } from "@phosphor-icons/react";
import { toast } from "sonner";
import { useNavigate } from "@tanstack/react-router";
import { NoteCard } from "./NoteCard";
import { NotesSearchBar } from "./NotesSearchBar";
import { DeleteNoteDialog } from "./DeleteNoteDialog";
import { NotesEmptyState } from "./NotesEmptyState";

interface NotesListProps {
  onClose?: () => void;
  onNoteSelect?: (noteId: string) => void;
}

export function NotesList({ onClose, onNoteSelect }: NotesListProps) {
  const { notes, addNote, deleteNote } = useStore();
  const [searchQuery, setSearchQuery] = useState("");
  const [showDeleteDialog, setShowDeleteDialog] = useState<string | null>(null);
  const navigate = useNavigate();

  const filteredNotes = notes.filter(
    (note) =>
      note.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      note.content.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const handleNewNote = () => {
    const note = addNote({
      title: "Untitled Note",
      content: "",
    });
    if (onNoteSelect) {
      onNoteSelect(note.id);
    } else {
      navigate({ to: `/notes/${note.id}` });
    }
  };

  const handleNoteClick = (noteId: string) => {
    if (onNoteSelect) {
      onNoteSelect(noteId);
    } else {
      navigate({ to: `/notes/${noteId}` });
    }
    onClose?.();
  };

  const handleDelete = (noteId: string) => {
    deleteNote(noteId);
    setShowDeleteDialog(null);
    toast.success("Note deleted");
  };

  return (
    <div className="flex flex-col h-full">
      <div className="p-2 space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-semibold">Notes</h2>
          <Button
            variant="default"
            onClick={handleNewNote}
            aria-label="Create new note"
          >
            <Plus className="size-3" weight="bold" />
            New Note
          </Button>
        </div>
        <NotesSearchBar searchQuery={searchQuery} onSearchChange={setSearchQuery} />
      </div>

      <ScrollArea className="flex-1">
        <div className="p-2 space-y-3">
          {filteredNotes.length === 0 ? (
            <NotesEmptyState hasSearchQuery={!!searchQuery} />
          ) : (
            filteredNotes.map((note) => (
              <NoteCard
                key={note.id}
                note={note}
                onNoteClick={handleNoteClick}
                onDeleteClick={(noteId) => setShowDeleteDialog(noteId)}
              />
            ))
          )}
        </div>
      </ScrollArea>

      <DeleteNoteDialog
        open={showDeleteDialog !== null}
        onOpenChange={(open) => !open && setShowDeleteDialog(null)}
        onConfirm={() => showDeleteDialog && handleDelete(showDeleteDialog)}
      />
    </div>
  );
}
