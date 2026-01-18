// Helper function to get computed CSS color value
export function getComputedColor(cssVariable: string): string {
  if (typeof window === "undefined") return "#0066ff";
  
  const tempEl = document.createElement("div");
  tempEl.style.color = `var(${cssVariable})`;
  document.body.appendChild(tempEl);
  const computedColor = window.getComputedStyle(tempEl).color;
  document.body.removeChild(tempEl);
  
  // If we get a valid rgb/rgba value, return it
  if (computedColor && computedColor !== "rgba(0, 0, 0, 0)") {
    return computedColor;
  }
  
  // Fallback to a default primary-like color
  return "#0066ff";
}
