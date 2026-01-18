import { useState, useEffect, useRef } from "react";
import { useStore } from "@/lib/storage/store";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { MarkdownRenderer } from "./MarkdownRenderer";
import { ArrowLeft, Eye, Pencil, Check } from "@phosphor-icons/react";
import { cn } from "@/lib/utils";
import { useNavigate } from "@tanstack/react-router";

interface NoteEditorProps {
  noteId: string;
  onBack?: () => void;
}

export function NoteEditor({ noteId, onBack }: NoteEditorProps) {
  const { getNote, updateNote } = useStore();
  const note = getNote(noteId);
  const navigate = useNavigate();

  const [title, setTitle] = useState(note?.title || "");
  const [content, setContent] = useState(note?.content || "");
  const [isPreview, setIsPreview] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [lastSaved, setLastSaved] = useState<Date | null>(
    note ? new Date(note.updatedAt) : null
  );

  const debounceTimerRef = useRef<NodeJS.Timeout | null>(null);
  const titleInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (note) {
      setTitle(note.title);
      setContent(note.content);
      setLastSaved(new Date(note.updatedAt));
    }
  }, [note]);

  useEffect(() => {
    if (!note) return;

    // Clear existing timer
    if (debounceTimerRef.current) {
      clearTimeout(debounceTimerRef.current);
    }

    setIsSaving(true);

    // Set new timer
    debounceTimerRef.current = setTimeout(() => {
      updateNote(noteId, {
        title,
        content,
      });
      setIsSaving(false);
      setLastSaved(new Date());
    }, 1000);

    return () => {
      if (debounceTimerRef.current) {
        clearTimeout(debounceTimerRef.current);
      }
    };
  }, [title, content, noteId, updateNote, note]);

  useEffect(() => {
    // Auto-focus title on new notes
    if (note && note.title === "Untitled Note" && titleInputRef.current) {
      titleInputRef.current.focus();
      titleInputRef.current.select();
    }
  }, [note]);

  const handleBack = () => {
    if (onBack) {
      onBack();
    } else {
      navigate({ to: "/notes" });
    }
  };

  if (!note) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="text-center">
          <p className="text-muted-foreground">Note not found</p>
          <Button variant="outline" onClick={handleBack} className="mt-4">
            <ArrowLeft className="size-4 mr-2" />
            Back to Notes
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-screen">
      {/* Header */}
      <div className="border-b p-4 flex items-center justify-between gap-4">
        <div className="flex items-center gap-4 flex-1 min-w-0">
          <Button
            variant="ghost"
            size="icon"
            onClick={handleBack}
            aria-label="Back to notes"
          >
            <ArrowLeft className="size-4" />
          </Button>
          <div className="flex-1 min-w-0">
            <Input
              ref={titleInputRef}
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Untitled Note"
              className="text-lg font-semibold border-0 focus-visible:ring-0 px-0 h-auto"
              aria-label="Note title"
            />
          </div>
        </div>
        <div className="flex items-center gap-2">
          {isSaving ? (
            <span className="text-xs text-muted-foreground">Saving...</span>
          ) : lastSaved ? (
            <span className="text-xs text-muted-foreground flex items-center gap-1">
              <Check className="size-3" />
              Saved
            </span>
          ) : null}
          <Button
            variant={isPreview ? "default" : "outline"}
            size="sm"
            onClick={() => setIsPreview(!isPreview)}
            aria-label={isPreview ? "Switch to edit mode" : "Switch to preview mode"}
            title={isPreview ? "Edit (Ctrl+P)" : "Preview (Ctrl+P)"}
          >
            {isPreview ? (
              <>
                <Pencil className="size-4 mr-2" />
                Edit
              </>
            ) : (
              <>
                <Eye className="size-4 mr-2" />
                Preview
              </>
            )}
          </Button>
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-hidden">
        {isPreview ? (
          <div className="h-full overflow-y-auto p-6">
            <MarkdownRenderer content={content} />
          </div>
        ) : (
          <Textarea
            value={content}
            onChange={(e) => setContent(e.target.value)}
            placeholder="Write your note in Markdown..."
            className="h-full resize-none border-0 rounded-none font-mono text-sm focus-visible:ring-0 p-6"
            aria-label="Note content"
          />
        )}
      </div>
    </div>
  );
}
