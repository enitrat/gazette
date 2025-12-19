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
}));
