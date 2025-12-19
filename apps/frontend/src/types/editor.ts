export type CanvasPosition = {
  x: number;
  y: number;
  width: number;
  height: number;
};

export type TextStyle = {
  fontFamily?: string;
  fontSize?: number;
  lineHeight?: number;
  letterSpacing?: number;
  color?: string;
  textAlign?: "left" | "center" | "right" | "justify";
  bold?: boolean;
  italic?: boolean;
  underline?: boolean;
  strikethrough?: boolean;
  marginHorizontal?: number;
  marginVertical?: number;
  paddingHorizontal?: number;
  paddingVertical?: number;
};

export type CanvasElement = {
  id: string;
  type: "image" | "headline" | "subheading" | "caption";
  position: CanvasPosition;
  content?: string;
  imageId?: string | null;
  imageUrl?: string | null;
  imageWidth?: number | null;
  imageHeight?: number | null;
  cropData?: {
    x: number;
    y: number;
    zoom: number;
  } | null;
  animationPrompt?: string | null;
  videoUrl?: string | null;
  videoStatus?: "none" | "pending" | "processing" | "complete" | "failed";
  isOptimistic?: boolean;
  style?: TextStyle;
};

export type CanvasPage = {
  id: string;
  title?: string | null;
  subtitle?: string | null;
  elements?: CanvasElement[];
};
