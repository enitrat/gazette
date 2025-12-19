import type { CanvasElement, TextStyle } from "@/types/editor";

const TEXT_DEFAULTS: Record<Exclude<CanvasElement["type"], "image">, TextStyle> = {
  headline: {
    fontFamily: "Old Standard TT",
    fontSize: 32,
    lineHeight: 1.2,
    letterSpacing: 0,
    color: "#2C2416",
    textAlign: "left",
    bold: true,
  },
  subheading: {
    fontFamily: "Libre Baskerville",
    fontSize: 20,
    lineHeight: 1.4,
    letterSpacing: 0,
    color: "#5C4033",
    textAlign: "left",
    italic: true,
  },
  caption: {
    fontFamily: "EB Garamond",
    fontSize: 14,
    lineHeight: 1.5,
    letterSpacing: 0,
    color: "#8B7355",
    textAlign: "left",
  },
};

export const FONT_OPTIONS = [
  { label: "Inter", value: "Inter" },
  { label: "Old Standard TT", value: "Old Standard TT" },
  { label: "Libre Baskerville", value: "Libre Baskerville" },
  { label: "EB Garamond", value: "EB Garamond" },
  { label: "Playfair Display", value: "Playfair Display" },
  { label: "Georgia", value: "Georgia" },
  { label: "Times New Roman", value: "Times New Roman" },
  { label: "Garamond", value: "Garamond" },
  { label: "Serif", value: "serif" },
  { label: "Sans Serif", value: "sans-serif" },
];

export const getDefaultTextStyle = (elementType: CanvasElement["type"]): TextStyle => {
  if (elementType === "image") return {};
  return TEXT_DEFAULTS[elementType];
};

export const resolveTextStyle = (element: CanvasElement): TextStyle => {
  if (element.type === "image") return {};
  return {
    ...TEXT_DEFAULTS[element.type],
    ...(element.style ?? {}),
  };
};
