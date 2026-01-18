import { useState } from "react";
import { useStore } from "@/lib/storage/store";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Plus, Trash, MagnifyingGlass } from "@phosphor-icons/react";
import { format } from "date-fns";
import { cn } from "@/lib/utils";
import { toast } from "sonner";
import { useNavigate } from "@tanstack/react-router";

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

  const getPreview = (content: string, maxLength = 100) => {
    const plainText = content.replace(/[#*_`\[\]()]/g, "").trim();
    return plainText.length > maxLength
      ? plainText.substring(0, maxLength) + "..."
      : plainText || "No content";
  };

  return (
    <div className="flex flex-col h-full">
      <div className="p-4 border-b space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-semibold">Notes</h2>
          <Button
            variant="default"
            size="sm"
            onClick={handleNewNote}
            aria-label="Create new note"
          >
            <Plus className="size-4 mr-2" />
            New Note
          </Button>
        </div>
        <div className="relative">
          <MagnifyingGlass className="absolute left-2 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
          <Input
            type="text"
            placeholder="Search notes..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-8"
            aria-label="Search notes"
          />
        </div>
      </div>

      <ScrollArea className="flex-1">
        <div className="p-4 space-y-3">
          {filteredNotes.length === 0 ? (
            <div className="text-center py-12 text-muted-foreground">
              {searchQuery ? "No notes found" : "No notes yet. Create one to get started!"}
            </div>
          ) : (
            filteredNotes.map((note) => (
              <Card
                key={note.id}
                className="cursor-pointer hover:bg-muted/50 transition-colors"
                onClick={() => handleNoteClick(note.id)}
                role="button"
                tabIndex={0}
                onKeyDown={(e) => {
                  if (e.key === "Enter" || e.key === " ") {
                    e.preventDefault();
                    handleNoteClick(note.id);
                  }
                }}
                aria-label={`Open note: ${note.title}`}
              >
                <CardHeader className="pb-2">
                  <div className="flex items-start justify-between gap-2">
                    <CardTitle className="text-sm font-medium line-clamp-1">
                      {note.title}
                    </CardTitle>
                    <Button
                      variant="ghost"
                      size="icon-xs"
                      onClick={(e) => {
                        e.stopPropagation();
                        setShowDeleteDialog(note.id);
                      }}
                      aria-label={`Delete note: ${note.title}`}
                      className="shrink-0"
                    >
                      <Trash className="size-3.5" />
                    </Button>
                  </div>
                </CardHeader>
                <CardContent className="pt-0">
                  <p className="text-xs text-muted-foreground line-clamp-2 mb-2">
                    {getPreview(note.content)}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    {format(new Date(note.updatedAt), "MMM d, yyyy")}
                  </p>
                </CardContent>
              </Card>
            ))
          )}
        </div>
      </ScrollArea>

      <Dialog open={showDeleteDialog !== null} onOpenChange={(open) => !open && setShowDeleteDialog(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete Note</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete this note? This action cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setShowDeleteDialog(null)}
            >
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={() => showDeleteDialog && handleDelete(showDeleteDialog)}
            >
              Delete
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
