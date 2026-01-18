import { useState, useEffect, useRef } from "react";
import { useStore } from "@/lib/storage/store";
import { SettingsToggleButton } from "./DrawingControls/SettingsToggleButton";
import { SettingsPanel } from "./DrawingControls/SettingsPanel";
import { CustomizationPanel } from "./DrawingControls/CustomizationPanel";
import { TextCustomizationPanel } from "./DrawingControls/TextCustomizationPanel";
import { ClearCanvasDialog } from "./DrawingControls/ClearCanvasDialog";

export function DrawingControls() {
  const { selectedTool, elements, selectedElementIds } = useStore();

  const [showClearDialog, setShowClearDialog] = useState(false);
  const [showSettings, setShowSettings] = useState(true);

  // Get selected element if exactly one is selected
  const selectedElement = selectedElementIds.length === 1
    ? elements.find((el) => el.id === selectedElementIds[0])
    : null;

  // Check if selected element is a text element
  const isTextElement = selectedElement?.type === "text";

  // Determine if we're editing a selected element
  const isEditingElement = selectedElement !== null;

  // Show customization when tool is selected OR shape is selected (but not text)
  const showCustomization = (selectedTool !== "selection" || isEditingElement) && !isTextElement;

  // Track previous customization state to detect transitions
  const prevShowCustomizationRef = useRef(showCustomization);

  // Close settings panel when customization panel opens (to avoid overlap)
  // Only close when customization transitions from false to true
  useEffect(() => {
    const prevShowCustomization = prevShowCustomizationRef.current;
    if (!prevShowCustomization && showCustomization && showSettings) {
      setShowSettings(false);
    }
    prevShowCustomizationRef.current = showCustomization;
  }, [showCustomization, showSettings]);

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
      
      {isTextElement && <TextCustomizationPanel />}

      <ClearCanvasDialog
        open={showClearDialog}
        onOpenChange={setShowClearDialog}
      />
    </>
  );
}
