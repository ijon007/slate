import type { ToolType } from "./types";

export const DEFAULT_STROKE_COLOR = "#FFFFFF";
export const DEFAULT_FILL_COLOR = "#FFFFFF";
export const DEFAULT_STROKE_WIDTH = 2;
export const DEFAULT_FONT_SIZE = 24;
export const DEFAULT_FONT_FAMILY = "Inter";

export const MIN_STROKE_WIDTH = 1;
export const MAX_STROKE_WIDTH = 20;

export const STROKE_WIDTH_THIN = 1;
export const STROKE_WIDTH_MEDIUM = 3;
export const STROKE_WIDTH_THICK = 5;

export const DEFAULT_FILL_PATTERN = "solid";
export const DEFAULT_SLOPPINESS = "moderate";
export const DEFAULT_EDGE_ROUNDING = "rounded";

export const MIN_ZOOM = 0.1;
export const MAX_ZOOM = 5;
export const DEFAULT_ZOOM = 1;
export const ZOOM_STEP = 0.1;

export const HISTORY_LIMIT = 50;

export const TOOL_SHORTCUTS: Record<ToolType, string> = {
  selection: "V",
  rectangle: "R",
  circle: "C",
  arrow: "A",
  line: "L",
  text: "T",
  freehand: "F",
};

export const COLORS = [
  "#000000",
  "#FFFFFF",
  "#FF0000",
  "#00FF00",
  "#0000FF",
  "#FFFF00",
  "#FF00FF",
  "#00FFFF",
  "#FFA500",
  "#800080",
  "#FFC0CB",
  "#A52A2A",
  "#808080",
  "#000080",
  "#008000",
];
