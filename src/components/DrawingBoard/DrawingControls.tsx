import { useState } from "react";
import { useStore } from "@/lib/storage/store";
import { SettingsToggleButton } from "./DrawingControls/SettingsToggleButton";
import { SettingsPanel } from "./DrawingControls/SettingsPanel";
import { CustomizationPanel } from "./DrawingControls/CustomizationPanel";
import { ClearCanvasDialog } from "./DrawingControls/ClearCanvasDialog";

export function DrawingControls() {
  const { selectedTool, elements, selectedElementIds } = useStore();

  const [showClearDialog, setShowClearDialog] = useState(false);
  const [showSettings, setShowSettings] = useState(true);

  // Get selected element if exactly one is selected
  const selectedElement = selectedElementIds.length === 1
    ? elements.find((el) => el.id === selectedElementIds[0])
    : null;

  // Determine if we're editing a selected element
  const isEditingElement = selectedElement !== null;

  // Show customization when tool is selected OR shape is selected
  const showCustomization = selectedTool !== "selection" || isEditingElement;

  return (
    <>
      <SettingsToggleButton
        showSettings={showSettings}
        onToggle={() => setShowSettings(!showSettings)}
      />

      {showSettings && (
        <SettingsPanel onClearClick={() => setShowClearDialog(true)} />
      )}

      {showCustomization && <CustomizationPanel />}

      <ClearCanvasDialog
        open={showClearDialog}
        onOpenChange={setShowClearDialog}
      />
    </>
  );
}
