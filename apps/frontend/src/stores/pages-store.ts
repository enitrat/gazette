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
  setPages: (pages: PageSummary[]) => void;
};

export const usePagesStore = create<PagesState>((set) => ({
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
}));
