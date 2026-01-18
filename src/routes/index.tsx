import { createFileRoute } from "@tanstack/react-router";
import { Canvas } from "@/components/DrawingBoard/Canvas";
import { Toolbar } from "@/components/DrawingBoard/Toolbar";
import { DrawingControls } from "@/components/DrawingBoard/DrawingControls";
import { NotesSheet } from "@/components/Notes/NotesSheet";
import { KeyboardShortcuts } from "@/components/KeyboardShortcuts";

export const Route = createFileRoute("/")({
  component: App,
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
