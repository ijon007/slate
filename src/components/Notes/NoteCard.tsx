import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Trash } from "@phosphor-icons/react";
import { format } from "date-fns";

interface NoteCardProps {
  note: {
    id: string;
    title: string;
    content: string;
    updatedAt: number;
  };
  onNoteClick: (noteId: string) => void;
  onDeleteClick: (noteId: string) => void;
}

const getPreview = (content: string, maxLength = 100) => {
  const plainText = content.replace(/[#*_`\[\]()]/g, "").trim();
  return plainText.length > maxLength
    ? plainText.substring(0, maxLength) + "..."
    : plainText || "No content";
};

export function NoteCard({ note, onNoteClick, onDeleteClick }: NoteCardProps) {
  return (
    <Card
      className="cursor-pointer hover:bg-muted/50 transition-colors py-2"
      onClick={() => onNoteClick(note.id)}
      role="button"
      tabIndex={0}
      onKeyDown={(e) => {
        if (e.key === "Enter" || e.key === " ") {
          e.preventDefault();
          onNoteClick(note.id);
        }
      }}
      aria-label={`Open note: ${note.title}`}
    >
      <CardHeader className="p-0 px-2 pb-0">
        <div className="flex items-start justify-between">
          <CardTitle className="text-sm font-medium line-clamp-1">
            {note.title}
          </CardTitle>
          <Button
            variant="destructive"
            size="icon"
            onClick={(e) => {
              e.stopPropagation();
              onDeleteClick(note.id);
            }}
            aria-label={`Delete note: ${note.title}`}
          >
            <Trash className="size-3" weight="bold" />
          </Button>
        </div>
      </CardHeader>
      <CardContent className="p-0 px-2 pt-0">
        <p className="text-xs text-muted-foreground line-clamp-2 mb-2">
          {getPreview(note.content)}
        </p>
        <p className="text-xs text-muted-foreground">
          {format(new Date(note.updatedAt), "MMM d, yyyy")}
        </p>
      </CardContent>
    </Card>
  );
}
