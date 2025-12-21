import { CANVAS, GAZETTE_COLORS } from "./constants";

type CropData = {
  x: number;
  y: number;
  zoom: number;
};

export const CANVAS_FRAME = {
  width: CANVAS.WIDTH,
  height: CANVAS.HEIGHT,
  outerInset: 24,
  innerInset: 28,
  outerBorderWidth: 1,
  innerBorderWidth: 0.5,
  backgroundColor: GAZETTE_COLORS.paper,
  ruleColor: GAZETTE_COLORS.rule,
  borderColor: GAZETTE_COLORS.border,
  shadow: "0 1px 3px rgba(0, 0, 0, 0.08), 0 8px 30px rgba(0, 0, 0, 0.12)",
} as const;

export const getPageFrameInlineStyle = (): Record<string, string | number> => ({
  position: "relative",
  width: `${CANVAS_FRAME.width}px`,
  height: `${CANVAS_FRAME.height}px`,
  backgroundColor: CANVAS_FRAME.backgroundColor,
  boxShadow: CANVAS_FRAME.shadow,
  overflow: "hidden",
});

export const getPageRuleInlineStyle = (
  variant: "outer" | "inner"
): Record<string, string | number> => ({
  position: "absolute",
  inset: `${variant === "outer" ? CANVAS_FRAME.outerInset : CANVAS_FRAME.innerInset}px`,
  border: `${
    variant === "outer" ? CANVAS_FRAME.outerBorderWidth : CANVAS_FRAME.innerBorderWidth
  }px solid ${variant === "outer" ? CANVAS_FRAME.ruleColor : CANVAS_FRAME.borderColor}`,
  pointerEvents: "none",
});

export const getImageCropInlineStyle = (
  cropData?: CropData | null
): Record<string, string | undefined> => {
  if (!cropData) {
    return {
      objectPosition: "center",
    };
  }

  return {
    objectPosition: `${-cropData.x}px ${-cropData.y}px`,
    transform: `scale(${cropData.zoom})`,
    transformOrigin: "top left",
  };
};

export const getImageCropCss = (cropData?: CropData | null): string => {
  if (!cropData) return "";
  return `object-position: ${-cropData.x}px ${-cropData.y}px; transform: scale(${cropData.zoom}); transform-origin: top left;`;
};
