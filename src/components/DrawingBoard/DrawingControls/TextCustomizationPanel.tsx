import { Separator } from "@/components/ui/separator";
import { Slider } from "@/components/ui/slider";
import { PresetButton } from "./PresetButton";
import { useStore } from "@/lib/storage/store";
import { cn } from "@/lib/utils";
import { PencilSimple, Code, TextAa } from "@phosphor-icons/react";

// Stroke colors from the image reference
const TEXT_STROKE_COLORS = [
  "#FFFFFF", // White/light grey
  "#FF6B6B", // Coral/light red
  "#51CF66", // Bright green
  "#74C0FC", // Sky blue
  "#FFA94D", // Orange/brown
];

// Font family options
const FONT_FAMILIES = [
  { id: "handwriting", name: "Handwriting", value: "Kalam", icon: PencilSimple },
  { id: "sans", name: "Sans", value: "Inter", icon: TextAa },
  { id: "monofont", name: "Monofont", value: "monospace", icon: Code },
] as const;

// Font size options
const FONT_SIZES = [
  { id: "small", label: "S", value: 16 },
  { id: "medium", label: "M", value: 24 },
  { id: "large", label: "L", value: 32 },
  { id: "xlarge", label: "XL", value: 48 },
] as const;

// Text align options
type TextAlign = "left" | "center" | "right";

const TEXT_ALIGNS: Array<{ id: TextAlign; icon: React.ReactNode }> = [
  {
    id: "left",
    icon: (
      <svg className="size-4" viewBox="0 0 16 16" fill="currentColor">
        <path d="M2 3h12v1H2V3zm0 3h8v1H2V6zm0 3h12v1H2V9zm0 3h8v1H2v-1z" />
      </svg>
    ),
  },
  {
    id: "center",
    icon: (
      <svg className="size-4" viewBox="0 0 16 16" fill="currentColor">
        <path d="M2 3h12v1H2V3zm2 3h8v1H4V6zm-2 3h12v1H2V9zm2 3h8v1H4v-1z" />
      </svg>
    ),
  },
  {
    id: "right",
    icon: (
      <svg className="size-4" viewBox="0 0 16 16" fill="currentColor">
        <path d="M2 3h12v1H2V3zm4 3h8v1H6V6zm-4 3h12v1H2V9zm4 3h8v1H6v-1z" />
      </svg>
    ),
  },
];

export function TextCustomizationPanel() {
  const {
    elements,
    selectedElementIds,
    updateElement,
  } = useStore();

  // Get selected text element
  const selectedElement = selectedElementIds.length === 1
    ? elements.find((el) => el.id === selectedElementIds[0] && el.type === "text")
    : null;

  if (!selectedElement || selectedElement.type !== "text") {
    return null;
  }

  const currentStrokeColor = selectedElement.strokeColor;
  const currentFontFamily = selectedElement.fontFamily;
  const currentFontSize = selectedElement.fontSize;
  const currentOpacity = selectedElement.opacity;
  
  // Determine current text align (we'll need to add this to the TextElement type)
  // For now, default to "left"
  const currentTextAlign: TextAlign = (selectedElement as any).textAlign || "left";

  const handleStrokeColorChange = (color: string) => {
    updateElement(selectedElement.id, { strokeColor: color });
  };

  const handleFontFamilyChange = (fontFamily: string) => {
    updateElement(selectedElement.id, { fontFamily });
  };

  const handleFontSizeChange = (fontSize: number) => {
    updateElement(selectedElement.id, { fontSize, height: fontSize });
  };

  const handleTextAlignChange = (textAlign: TextAlign) => {
    updateElement(selectedElement.id, { textAlign } as any);
  };

  const handleOpacityChange = (opacity: number) => {
    updateElement(selectedElement.id, { opacity });
  };

  return (
    <div
      className="fixed left-4 top-16 z-20 flex flex-col gap-3 bg-card/80 backdrop-blur-sm border border-border rounded-lg p-4 shadow-lg w-72 max-w-[calc(100vw-2rem)] max-h-[calc(100vh-5rem)] overflow-y-auto"
      role="complementary"
      aria-label="Text Customization"
    >
      {/* Stroke Section */}
      <div className="space-y-2">
        <div className="text-xs font-medium">Stroke</div>
        <div className="flex gap-2 flex-wrap">
          {TEXT_STROKE_COLORS.map((color) => (
            <button
              key={color}
              className={cn(
                "size-9 rounded-md border-2 transition-all",
                currentStrokeColor === color
                  ? "border-primary scale-110"
                  : "border-border hover:scale-105"
              )}
              style={{ backgroundColor: color }}
              onClick={() => handleStrokeColorChange(color)}
              aria-label={`Select stroke color ${color}`}
            />
          ))}
        </div>
      </div>

      <Separator />

      {/* Font Family Section */}
      <div className="space-y-2">
        <div className="text-xs font-medium">Font family</div>
        <div className="flex gap-2">
          {FONT_FAMILIES.map((font) => {
            const Icon = font.icon;
            return (
              <PresetButton
                key={font.id}
                selected={currentFontFamily === font.value}
                onClick={() => handleFontFamilyChange(font.value)}
                ariaLabel={font.name}
              >
                <Icon className="size-4" weight="bold" />
              </PresetButton>
            );
          })}
        </div>
      </div>

      <Separator />

      {/* Font Size Section */}
      <div className="space-y-2">
        <div className="text-xs font-medium">Font size</div>
        <div className="flex gap-2">
          {FONT_SIZES.map((size) => (
            <PresetButton
              key={size.id}
              selected={currentFontSize === size.value}
              onClick={() => handleFontSizeChange(size.value)}
              ariaLabel={`Font size ${size.label}`}
            >
              <span className="text-xs font-medium">{size.label}</span>
            </PresetButton>
          ))}
        </div>
      </div>

      <Separator />

      {/* Text Align Section */}
      <div className="space-y-2">
        <div className="text-xs font-medium">Text align</div>
        <div className="flex gap-2">
          {TEXT_ALIGNS.map((align) => (
            <PresetButton
              key={align.id}
              selected={currentTextAlign === align.id}
              onClick={() => handleTextAlignChange(align.id)}
              ariaLabel={`Align ${align.id}`}
            >
              {align.icon}
            </PresetButton>
          ))}
        </div>
      </div>

      <Separator />

      {/* Opacity Section */}
      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <div className="text-xs font-medium">Opacity</div>
          <span className="text-xs text-muted-foreground">
            {Math.round(currentOpacity * 100)}
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
    </div>
  );
}
