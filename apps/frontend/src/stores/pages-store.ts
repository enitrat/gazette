import { create } from "zustand";
import type { Template } from "@gazette/shared";
import { TEMPLATES } from "@gazette/shared/constants";
import { api, parseApiError } from "@/lib/api";

export type PageSummary = {
  id: string;
  order: number;
  templateId: Template;
  title: string;
  subtitle: string;
  elementCount?: number;
};

type PagesState = {
  pages: PageSummary[];
  isLoading: boolean;
  error: string | null;
  fetchPages: (projectId: string) => Promise<void>;
  createPage: (
    projectId: string,
    templateId?: Template,
    afterPageId?: string
  ) => Promise<PageSummary | null>;
  reorderPages: (projectId: string, pageIds: string[]) => Promise<boolean>;
  setPages: (pages: PageSummary[]) => void;
};

export const usePagesStore = create<PagesState>((set, get) => ({
  pages: [],
  isLoading: false,
  error: null,
  setPages: (pages) => set({ pages }),
  fetchPages: async (projectId) => {
    if (!projectId) {
      set({ error: "Missing project ID.", pages: [] });
      return;
    }

    set({ isLoading: true, error: null });
    try {
      const data = await api.get(`projects/${projectId}/pages`).json<{ pages?: PageSummary[] }>();
      const pages = Array.isArray(data.pages) ? data.pages : [];

      pages.sort((a, b) => a.order - b.order);
      set({ pages, isLoading: false });
    } catch (error) {
      const parsed = await parseApiError(error);
      set({
        pages: [],
        isLoading: false,
        error: parsed.message,
      });
    }
  },
  createPage: async (projectId, templateId = TEMPLATES.MASTHEAD, afterPageId) => {
    if (!projectId) {
      set({ error: "Missing project ID." });
      return null;
    }

    try {
      const created = await api
        .post(`projects/${projectId}/pages`, {
          json: {
            templateId,
            afterPageId,
          },
        })
        .json<PageSummary>();
      set((state) => {
        const pages = [...state.pages, created].sort((a, b) => a.order - b.order);
        return { pages };
      });
      return created;
    } catch (error) {
      const parsed = await parseApiError(error);
      set({
        error: parsed.message,
      });
      return null;
    }
  },
  reorderPages: async (projectId, pageIds) => {
    if (!projectId) {
      set({ error: "Missing project ID." });
      return false;
    }

    const previousPages = get().pages;
    if (pageIds.length === 0 || previousPages.length === 0) {
      return false;
    }

    const byId = new Map(previousPages.map((page) => [page.id, page]));
    const seen = new Set<string>();
    const nextPages: PageSummary[] = [];

    for (const [index, pageId] of pageIds.entries()) {
      const page = byId.get(pageId);
      if (!page || seen.has(pageId)) {
        continue;
      }
      seen.add(pageId);
      nextPages.push({ ...page, order: index });
    }

    const remaining = previousPages
      .filter((page) => !seen.has(page.id))
      .sort((a, b) => a.order - b.order);

    const mergedPages = [...nextPages, ...remaining].map((page, index) => ({
      ...page,
      order: index,
    }));

    set({ pages: mergedPages, error: null });

    try {
      await api.patch("pages/reorder", {
        json: {
          pageIds: mergedPages.map((page) => page.id),
          projectId,
        },
      });
      return true;
    } catch (error) {
      const parsed = await parseApiError(error);
      set({ pages: previousPages, error: parsed.message });
      return false;
    }
  },
}));
