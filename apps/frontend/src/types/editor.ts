export type CanvasPosition = {
  x: number;
  y: number;
  width: number;
  height: number;
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
};

export type CanvasPage = {
  id: string;
  title?: string | null;
  subtitle?: string | null;
  elements?: CanvasElement[];
};
