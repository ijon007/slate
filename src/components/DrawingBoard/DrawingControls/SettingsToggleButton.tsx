import { Button } from "@/components/ui/button";
import { List } from "@phosphor-icons/react";

interface SettingsToggleButtonProps {
  showSettings: boolean;
  onToggle: () => void;
}

export function SettingsToggleButton({ showSettings, onToggle }: SettingsToggleButtonProps) {
  return (
    <Button
      variant="outline"
      className="fixed left-4 top-4 z-30 size-9"
      onClick={onToggle}
      aria-label={showSettings ? "Hide settings" : "Show settings"}
      title={showSettings ? "Hide settings" : "Show settings"}
    >
      <List className="size-4" />
    </Button>
  );
}
