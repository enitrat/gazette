import { create } from "zustand";
import { api, apiBaseUrl, parseApiError } from "@/lib/api";
import type { CanvasElement } from "@/types/editor";

const normalizeAssetUrl = (url?: string | null) => {
  if (!url) return null;
  if (url.startsWith("http")) return url;
  try {
    return new URL(url, apiBaseUrl).toString();
  } catch {
    return url;
  }
};

type ApiElement = {
  id: string;
  type: CanvasElement["type"];
  position: CanvasElement["position"];
  content?: string;
  imageUrl?: string | null;
  cropData?: CanvasElement["cropData"];
  videoUrl?: string | null;
  videoStatus?: CanvasElement["videoStatus"];
};

type ElementsState = {
  elementsByPage: Record<string, CanvasElement[]>;
  isLoading: boolean;
  error: string | null;
  selectedElementId: string | null;
  fetchElements: (pageId: string) => Promise<void>;
  setElementsForPage: (pageId: string, elements: CanvasElement[]) => void;
  setSelectedElementId: (elementId: string | null) => void;
  createImageElement: (
    pageId: string,
    imageId: string,
    position: CanvasElement["position"],
    imageUrl: string,
    imageWidth: number,
    imageHeight: number
  ) => Promise<CanvasElement | null>;
};

export const useElementsStore = create<ElementsState>((set) => ({
  elementsByPage: {},
  isLoading: false,
  error: null,
  selectedElementId: null,
  setSelectedElementId: (elementId) => set({ selectedElementId: elementId }),
  setElementsForPage: (pageId, elements) =>
    set((state) => ({
      elementsByPage: {
        ...state.elementsByPage,
        [pageId]: elements,
      },
    })),
  fetchElements: async (pageId) => {
    if (!pageId) {
      set({ error: "Missing page ID." });
      return;
    }

    set({ isLoading: true, error: null });
    try {
      const data = await api.get(`pages/${pageId}/elements`).json<{ elements?: ApiElement[] }>();
      const elements = Array.isArray(data.elements) ? data.elements : [];
      const normalized = elements.map((element) => ({
        id: element.id,
        type: element.type,
        position: element.position,
        content: element.content,
        imageUrl: normalizeAssetUrl(element.imageUrl),
        cropData: element.cropData ?? null,
        videoUrl: normalizeAssetUrl(element.videoUrl),
        videoStatus: element.videoStatus,
      }));

      set((state) => {
        const nextSelected = normalized.some((item) => item.id === state.selectedElementId)
          ? state.selectedElementId
          : null;

        return {
          elementsByPage: {
            ...state.elementsByPage,
            [pageId]: normalized,
          },
          selectedElementId: nextSelected,
          isLoading: false,
        };
      });
    } catch (error) {
      const parsed = await parseApiError(error);
      set({ isLoading: false, error: parsed.message });
    }
  },
  createImageElement: async (pageId, imageId, position, imageUrl, imageWidth, imageHeight) => {
    if (!pageId) {
      set({ error: "Missing page ID." });
      return null;
    }

    try {
      const data = await api
        .post(`pages/${pageId}/elements`, {
          json: {
            type: "image",
            position,
            imageId,
          },
        })
        .json<ApiElement>();

      const normalized: CanvasElement = {
        id: data.id,
        type: data.type,
        position: data.position,
        imageUrl: normalizeAssetUrl(data.imageUrl) || imageUrl,
        imageWidth,
        imageHeight,
        cropData: data.cropData ?? null,
        videoUrl: normalizeAssetUrl(data.videoUrl),
        videoStatus: data.videoStatus ?? "none",
      };

      set((state) => ({
        elementsByPage: {
          ...state.elementsByPage,
          [pageId]: [...(state.elementsByPage[pageId] ?? []), normalized],
        },
      }));

      return normalized;
    } catch (error) {
      const parsed = await parseApiError(error);
      set({ error: parsed.message });
      return null;
    }
  },
}));
