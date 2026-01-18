import { cn } from "@/lib/utils";

interface PresetButtonProps {
  selected: boolean;
  onClick: () => void;
  children: React.ReactNode;
  ariaLabel: string;
}

export function PresetButton({ selected, onClick, children, ariaLabel }: PresetButtonProps) {
  return (
    <button
      className={cn(
        "size-10 rounded border-2 transition-all flex items-center justify-center",
        selected
          ? "border-primary bg-primary/10 scale-105"
          : "border-border hover:scale-105 hover:bg-muted"
      )}
      onClick={onClick}
      aria-label={ariaLabel}
    >
      {children}
    </button>
  );
}
