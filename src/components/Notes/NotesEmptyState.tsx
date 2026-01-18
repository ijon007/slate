interface NotesEmptyStateProps {
  hasSearchQuery: boolean;
}

export function NotesEmptyState({ hasSearchQuery }: NotesEmptyStateProps) {
  return (
    <div className="text-center py-12 text-muted-foreground">
      {hasSearchQuery ? "No notes found" : "No notes yet. Create one to get started!"}
    </div>
  );
}
