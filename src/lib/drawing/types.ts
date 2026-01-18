export type ToolType =
  | "selection"
  | "rectangle"
  | "circle"
  | "arrow"
  | "line"
  | "text"
  | "freehand";

export type ElementType =
  | "rectangle"
  | "circle"
  | "arrow"
  | "line"
  | "text"
  | "freehand";

export type StrokeStyle = "solid" | "dashed" | "dotted";
export type FillPattern = "solid" | "cross-hatch" | "grid" | "dotted";
export type Sloppiness = "subtle" | "moderate" | "high";
export type EdgeRounding = "sharp" | "rounded";

export interface Point {
  x: number;
  y: number;
}

export interface BaseElement {
  id: string;
  type: ElementType;
  x: number;
  y: number;
  strokeColor: string;
  fillColor: string;
  strokeWidth: number;
  strokeStyle: StrokeStyle;
  opacity: number;
  angle: number;
  fillPattern: FillPattern;
  sloppiness: Sloppiness;
  edgeRounding: EdgeRounding;
}

export interface RectangleElement extends BaseElement {
  type: "rectangle";
  width: number;
  height: number;
}

export interface CircleElement extends BaseElement {
  type: "circle";
  width: number;
  height: number;
}

export interface LineElement extends BaseElement {
  type: "line";
  x2: number;
  y2: number;
}

export interface ArrowElement extends BaseElement {
  type: "arrow";
  x2: number;
  y2: number;
}

export interface TextElement extends BaseElement {
  type: "text";
  text: string;
  fontSize: number;
  fontFamily: string;
  width: number;
  height: number;
}

export interface FreehandElement extends BaseElement {
  type: "freehand";
  points: Point[];
}

export type DrawingElement =
  | RectangleElement
  | CircleElement
  | LineElement
  | ArrowElement
  | TextElement
  | FreehandElement;

export interface CanvasState {
  zoom: number;
  offsetX: number;
  offsetY: number;
}

export interface HistoryState {
  past: DrawingElement[][];
  present: DrawingElement[];
  future: DrawingElement[][];
}
