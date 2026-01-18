import { Input } from "@/components/ui/input";
import { MagnifyingGlass } from "@phosphor-icons/react";

interface NotesSearchBarProps {
  searchQuery: string;
  onSearchChange: (query: string) => void;
}

export function NotesSearchBar({ searchQuery, onSearchChange }: NotesSearchBarProps) {
  return (
    <div className="relative">
      <MagnifyingGlass className="absolute left-2 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
      <Input
        type="text"
        placeholder="Search notes..."
        value={searchQuery}
        onChange={(e) => onSearchChange(e.target.value)}
        className="pl-8"
        aria-label="Search notes"
      />
    </div>
  );
}
