import { create } from "zustand";
import type { UpdateElement } from "@gazette/shared";
import { api, apiBaseUrl, parseApiError } from "@/lib/api";
import type { CanvasElement } from "@/types/editor";

const UPDATE_DEBOUNCE_MS = 400;
const pendingUpdates = new Map<string, UpdateElement>();
const pendingTimers = new Map<string, ReturnType<typeof setTimeout>>();

const isUuid = (value: string) =>
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(value);

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
  imageId?: string | null;
  imageUrl?: string | null;
  cropData?: CanvasElement["cropData"];
  animationPrompt?: string | null;
  videoUrl?: string | null;
  videoStatus?: CanvasElement["videoStatus"];
};

type ElementsState = {
  elementsByPage: Record<string, CanvasElement[]>;
  isLoading: boolean;
  error: string | null;
  selectedElementId: string | null;
  selectElement: (elementId: string | null) => void;
  fetchElements: (pageId: string) => Promise<void>;
  setElementsForPage: (pageId: string, elements: CanvasElement[]) => void;
  setSelectedElementId: (elementId: string | null) => void;
  updateElement: (
    pageId: string,
    elementId: string,
    updates: UpdateElement,
    options?: { immediate?: boolean }
  ) => void;
  reorderElement: (pageId: string, elementId: string, direction: "forward" | "backward") => void;
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
  selectElement: (elementId) => set({ selectedElementId: elementId }),
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
        imageId: element.imageId ?? null,
        imageUrl: normalizeAssetUrl(element.imageUrl),
        cropData: element.cropData ?? null,
        animationPrompt: element.animationPrompt ?? null,
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
  updateElement: (pageId, elementId, updates, options) => {
    if (!pageId || !elementId) return;
    if (!updates || Object.keys(updates).length === 0) return;

    set((state) => {
      const pageElements = state.elementsByPage[pageId] ?? [];
      const nextElements = pageElements.map((element) => {
        if (element.id !== elementId) return element;
        return {
          ...element,
          ...(updates.position ? { position: updates.position } : {}),
          ...(updates.content !== undefined ? { content: updates.content } : {}),
          ...(updates.cropData !== undefined ? { cropData: updates.cropData } : {}),
        };
      });

      return {
        elementsByPage: {
          ...state.elementsByPage,
          [pageId]: nextElements,
        },
      };
    });

    if (!isUuid(elementId)) {
      return;
    }

    const existing = pendingUpdates.get(elementId) ?? {};
    const nextUpdates: UpdateElement = {
      ...existing,
      ...updates,
    };
    pendingUpdates.set(elementId, nextUpdates);

    const existingTimer = pendingTimers.get(elementId);
    if (existingTimer) {
      clearTimeout(existingTimer);
    }

    const flush = async () => {
      const payload = pendingUpdates.get(elementId);
      pendingUpdates.delete(elementId);
      pendingTimers.delete(elementId);
      if (!payload || Object.keys(payload).length === 0) return;

      try {
        await api.put(`elements/${elementId}`, { json: payload });
      } catch (error) {
        const parsed = await parseApiError(error);
        console.error(parsed.message);
      }
    };

    if (options?.immediate) {
      void flush();
      return;
    }

    const timer = setTimeout(() => {
      void flush();
    }, UPDATE_DEBOUNCE_MS);
    pendingTimers.set(elementId, timer);
  },
  reorderElement: (pageId, elementId, direction) => {
    if (!pageId) return;
    set((state) => {
      const pageElements = state.elementsByPage[pageId] ?? [];
      const index = pageElements.findIndex((element) => element.id === elementId);
      if (index < 0) {
        return {};
      }
      const targetIndex =
        direction === "forward"
          ? Math.min(pageElements.length - 1, index + 1)
          : Math.max(0, index - 1);
      if (targetIndex === index) {
        return {};
      }
      const nextElements = [...pageElements];
      const [moved] = nextElements.splice(index, 1);
      nextElements.splice(targetIndex, 0, moved);
      return {
        elementsByPage: {
          ...state.elementsByPage,
          [pageId]: nextElements,
        },
      };
    });
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
        imageId: data.imageId ?? imageId,
        imageUrl: normalizeAssetUrl(data.imageUrl) || imageUrl,
        imageWidth,
        imageHeight,
        cropData: data.cropData ?? null,
        animationPrompt: data.animationPrompt ?? null,
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
