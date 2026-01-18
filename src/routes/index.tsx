import { createFileRoute } from "@tanstack/react-router";
import { Canvas } from "@/components/DrawingBoard/Canvas";
import { Toolbar } from "@/components/DrawingBoard/Toolbar";
import { DrawingControls } from "@/components/DrawingBoard/DrawingControls";
import { NotesSheet } from "@/components/Notes/NotesSheet";
import { KeyboardShortcuts } from "@/components/KeyboardShortcuts";

export const Route = createFileRoute("/")({
  component: App,
  validateSearch: (search: Record<string, unknown>) => {
    return {
      notes: (search.notes as string) || undefined,
    };
  },
});

function App() {
  return (
    <div className="fixed inset-0 w-screen h-screen overflow-hidden">
      <Canvas />
      <Toolbar />
      <DrawingControls />
      <NotesSheet />
      <KeyboardShortcuts />
    </div>
  );
}
