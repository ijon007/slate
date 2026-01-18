import { Separator } from "@/components/ui/separator";
import { Slider } from "@/components/ui/slider";
import { ColorGrid } from "./ColorGrid";
import { PresetButton } from "./PresetButton";
import { useStore } from "@/lib/storage/store";
import {
  STROKE_WIDTH_THIN,
  STROKE_WIDTH_MEDIUM,
  STROKE_WIDTH_THICK,
} from "@/lib/drawing/constants";
import type { FillPattern, Sloppiness, EdgeRounding, StrokeStyle } from "@/lib/drawing/types";

export function CustomizationPanel() {
  const {
    elements,
    selectedElementIds,
    strokeColor,
    fillColor,
    setStrokeColor,
    setFillColor,
    updateElement,
  } = useStore();

  // Get selected element if exactly one is selected
  const selectedElement = selectedElementIds.length === 1
    ? elements.find((el) => el.id === selectedElementIds[0])
    : null;

  // Determine if we're editing a selected element or global defaults
  const isEditingElement = selectedElement !== null;

  // Get current values (from element or global defaults)
  const currentStrokeColor = isEditingElement && selectedElement ? selectedElement.strokeColor : strokeColor;
  const currentFillColor = isEditingElement && selectedElement ? selectedElement.fillColor : fillColor;
  const currentStrokeWidth = isEditingElement && selectedElement ? selectedElement.strokeWidth : 2;
  const currentStrokeStyle = isEditingElement && selectedElement ? selectedElement.strokeStyle : "solid";
  const currentFillPattern = isEditingElement && selectedElement ? selectedElement.fillPattern : "solid";
  const currentSloppiness = isEditingElement && selectedElement ? selectedElement.sloppiness : "moderate";
  const currentEdgeRounding = isEditingElement && selectedElement ? selectedElement.edgeRounding : "rounded";
  const currentOpacity = isEditingElement && selectedElement ? selectedElement.opacity : 1;

  // Handlers for element-specific updates
  const handleStrokeColorChange = (color: string) => {
    if (isEditingElement && selectedElement) {
      updateElement(selectedElement.id, { strokeColor: color });
    } else {
      setStrokeColor(color);
    }
  };

  const handleFillColorChange = (color: string) => {
    if (isEditingElement && selectedElement) {
      updateElement(selectedElement.id, { fillColor: color });
    } else {
      setFillColor(color);
    }
  };

  const handleStrokeWidthChange = (width: number) => {
    if (isEditingElement && selectedElement) {
      updateElement(selectedElement.id, { strokeWidth: width });
    }
    // Note: When not editing, stroke width is set per-element when drawing
  };

  const handleStrokeStyleChange = (style: StrokeStyle) => {
    if (isEditingElement && selectedElement) {
      updateElement(selectedElement.id, { strokeStyle: style });
    }
    // Note: When not editing, stroke style is set per-element when drawing
  };

  const handleFillPatternChange = (pattern: FillPattern) => {
    if (isEditingElement && selectedElement) {
      updateElement(selectedElement.id, { fillPattern: pattern });
    }
  };

  const handleSloppinessChange = (sloppiness: Sloppiness) => {
    if (isEditingElement && selectedElement) {
      updateElement(selectedElement.id, { sloppiness });
    }
  };

  const handleEdgeRoundingChange = (edgeRounding: EdgeRounding) => {
    if (isEditingElement && selectedElement && selectedElement.type === "rectangle") {
      updateElement(selectedElement.id, { edgeRounding });
    }
  };

  const handleOpacityChange = (opacity: number) => {
    if (isEditingElement && selectedElement) {
      updateElement(selectedElement.id, { opacity });
    }
  };

  return (
    <div
      className="fixed left-4 top-16 z-20 flex flex-col gap-3 bg-card/80 backdrop-blur-sm border border-border rounded-lg p-4 shadow-lg w-72 max-w-[calc(100vw-2rem)] max-h-[calc(100vh-5rem)] overflow-y-auto"
      role="complementary"
      aria-label="Customization"
    >
      {/* Stroke Section */}
      <div className="space-y-2">
        <div className="text-xs font-medium">Stroke</div>
        
        {/* Stroke Color */}
        <div className="flex items-center justify-between gap-2">
          <label className="text-xs text-muted-foreground w-20 shrink-0">Colors:</label>
          <ColorGrid
            selectedColor={currentStrokeColor}
            onColorChange={handleStrokeColorChange}
            label="Stroke"
          />
        </div>

        {/* Stroke Width */}
        <div className="space-y-1">
          <label className="text-xs text-muted-foreground">Stroke width:</label>
          <div className="flex gap-2">
            <PresetButton
              selected={currentStrokeWidth === STROKE_WIDTH_THIN}
              onClick={() => handleStrokeWidthChange(STROKE_WIDTH_THIN)}
              ariaLabel="Thin stroke"
            >
              <div className="w-6 h-0.5 bg-current" />
            </PresetButton>
            <PresetButton
              selected={currentStrokeWidth === STROKE_WIDTH_MEDIUM}
              onClick={() => handleStrokeWidthChange(STROKE_WIDTH_MEDIUM)}
              ariaLabel="Medium stroke"
            >
              <div className="w-6 h-1 bg-current" />
            </PresetButton>
            <PresetButton
              selected={currentStrokeWidth === STROKE_WIDTH_THICK}
              onClick={() => handleStrokeWidthChange(STROKE_WIDTH_THICK)}
              ariaLabel="Thick stroke"
            >
              <div className="w-6 h-2 bg-current" />
            </PresetButton>
          </div>
        </div>

        {/* Stroke Style */}
        <div className="space-y-1">
          <label className="text-xs text-muted-foreground">Stroke style:</label>
          <div className="flex gap-2">
            <PresetButton
              selected={currentStrokeStyle === "solid"}
              onClick={() => handleStrokeStyleChange("solid")}
              ariaLabel="Solid stroke"
            >
              <div className="w-6 h-0.5 bg-current" />
            </PresetButton>
            <PresetButton
              selected={currentStrokeStyle === "dashed"}
              onClick={() => handleStrokeStyleChange("dashed")}
              ariaLabel="Dashed stroke"
            >
              <svg className="w-6 h-2" viewBox="0 0 24 4">
                <line x1="0" y1="2" x2="8" y2="2" stroke="currentColor" strokeWidth="2" />
                <line x1="12" y1="2" x2="20" y2="2" stroke="currentColor" strokeWidth="2" />
              </svg>
            </PresetButton>
            <PresetButton
              selected={currentStrokeStyle === "dotted"}
              onClick={() => handleStrokeStyleChange("dotted")}
              ariaLabel="Dotted stroke"
            >
              <svg className="w-6 h-2" viewBox="0 0 24 4">
                <circle cx="4" cy="2" r="1" fill="currentColor" />
                <circle cx="10" cy="2" r="1" fill="currentColor" />
                <circle cx="16" cy="2" r="1" fill="currentColor" />
                <circle cx="22" cy="2" r="1" fill="currentColor" />
              </svg>
            </PresetButton>
          </div>
        </div>
      </div>

      <Separator />

      {/* Fill/Background Section */}
      {(!isEditingElement || (selectedElement && (selectedElement.type === "rectangle" || selectedElement.type === "circle"))) ? (
        <>
          <div className="space-y-2">
            <div className="text-xs font-medium">Background</div>
            
            {/* Fill Color */}
            <div className="flex items-center justify-between gap-2">
              <label className="text-xs text-muted-foreground w-20 shrink-0">Colors:</label>
              <ColorGrid
                selectedColor={currentFillColor}
                onColorChange={handleFillColorChange}
                label="Fill"
              />
            </div>

            {/* Fill Pattern - Only show when editing an element */}
            {isEditingElement && selectedElement && (selectedElement.type === "rectangle" || selectedElement.type === "circle") && (
              <div className="space-y-1">
                <label className="text-xs text-muted-foreground">Fill:</label>
                <div className="flex gap-2">
                  <PresetButton
                    selected={currentFillPattern === "cross-hatch"}
                    onClick={() => handleFillPatternChange("cross-hatch")}
                    ariaLabel="Cross-hatch fill"
                  >
                    <svg className="w-5 h-5" viewBox="0 0 16 16">
                      <line x1="0" y1="0" x2="16" y2="16" stroke="currentColor" strokeWidth="1" />
                      <line x1="16" y1="0" x2="0" y2="16" stroke="currentColor" strokeWidth="1" />
                    </svg>
                  </PresetButton>
                  <PresetButton
                    selected={currentFillPattern === "grid"}
                    onClick={() => handleFillPatternChange("grid")}
                    ariaLabel="Grid fill"
                  >
                    <svg className="w-5 h-5" viewBox="0 0 16 16">
                      <line x1="0" y1="0" x2="0" y2="16" stroke="currentColor" strokeWidth="1" />
                      <line x1="8" y1="0" x2="8" y2="16" stroke="currentColor" strokeWidth="1" />
                      <line x1="16" y1="0" x2="16" y2="16" stroke="currentColor" strokeWidth="1" />
                      <line x1="0" y1="0" x2="16" y2="0" stroke="currentColor" strokeWidth="1" />
                      <line x1="0" y1="8" x2="16" y2="8" stroke="currentColor" strokeWidth="1" />
                      <line x1="0" y1="16" x2="16" y2="16" stroke="currentColor" strokeWidth="1" />
                    </svg>
                  </PresetButton>
                  <PresetButton
                    selected={currentFillPattern === "solid"}
                    onClick={() => handleFillPatternChange("solid")}
                    ariaLabel="Solid fill"
                  >
                    <div className="w-5 h-5 bg-current" />
                  </PresetButton>
                </div>
              </div>
            )}
          </div>

          <Separator />
        </>
      ) : null}

      {/* Sloppiness Section */}
      {isEditingElement && (
        <>
          <div className="space-y-2">
            <div className="text-xs font-medium">Sloppiness</div>
            <div className="flex gap-2">
              <PresetButton
                selected={currentSloppiness === "subtle"}
                onClick={() => handleSloppinessChange("subtle")}
                ariaLabel="Subtle sloppiness"
              >
                <svg className="w-6 h-4" viewBox="0 0 24 8">
                  <path d="M 0 4 Q 6 2, 12 4 T 24 4" stroke="currentColor" strokeWidth="1.5" fill="none" />
                </svg>
              </PresetButton>
              <PresetButton
                selected={currentSloppiness === "moderate"}
                onClick={() => handleSloppinessChange("moderate")}
                ariaLabel="Moderate sloppiness"
              >
                <svg className="w-6 h-4" viewBox="0 0 24 8">
                  <path d="M 0 4 Q 4 1, 8 4 Q 12 7, 16 4 Q 20 1, 24 4" stroke="currentColor" strokeWidth="1.5" fill="none" />
                </svg>
              </PresetButton>
              <PresetButton
                selected={currentSloppiness === "high"}
                onClick={() => handleSloppinessChange("high")}
                ariaLabel="High sloppiness"
              >
                <svg className="w-6 h-4" viewBox="0 0 24 8">
                  <path d="M 0 4 Q 3 0, 6 4 Q 9 8, 12 4 Q 15 0, 18 4 Q 21 8, 24 4" stroke="currentColor" strokeWidth="1.5" fill="none" />
                </svg>
              </PresetButton>
            </div>
          </div>

          <Separator />
        </>
      )}

      {/* Edges Section */}
      {isEditingElement && selectedElement && selectedElement.type === "rectangle" && (
        <>
          <div className="space-y-2">
            <div className="text-xs font-medium">Edges</div>
            <div className="flex gap-2">
              <PresetButton
                selected={currentEdgeRounding === "sharp"}
                onClick={() => handleEdgeRoundingChange("sharp")}
                ariaLabel="Sharp edges"
              >
                <svg className="w-5 h-5" viewBox="0 0 16 16">
                  <rect x="2" y="2" width="12" height="12" stroke="currentColor" strokeWidth="1.5" fill="none" />
                </svg>
              </PresetButton>
              <PresetButton
                selected={currentEdgeRounding === "rounded"}
                onClick={() => handleEdgeRoundingChange("rounded")}
                ariaLabel="Rounded edges"
              >
                <svg className="w-5 h-5" viewBox="0 0 16 16">
                  <rect x="2" y="2" width="12" height="12" rx="2" ry="2" stroke="currentColor" strokeWidth="1.5" fill="none" />
                </svg>
              </PresetButton>
            </div>
          </div>

          <Separator />
        </>
      )}

      {/* Opacity Section */}
      {isEditingElement && (
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <div className="text-xs font-medium">Opacity</div>
            <span className="text-xs text-muted-foreground">
              {Math.round(currentOpacity * 100)}%
            </span>
          </div>
          <Slider
            value={[currentOpacity * 100]}
            min={0}
            max={100}
            step={1}
            onValueChange={(value) => {
              const numValue = Array.isArray(value) ? value[0] : value;
              if (typeof numValue === 'number') {
                handleOpacityChange(numValue / 100);
              }
            }}
            className="w-full"
          />
        </div>
      )}
    </div>
  );
}
