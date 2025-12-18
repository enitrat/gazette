import { create } from "zustand";
import type { Template } from "@gazette/shared";

const API_BASE = import.meta.env.VITE_API_URL ?? "http://localhost:3000/api";

export type PageSummary = {
  id: string;
  order: number;
  template: Template;
  title: string;
  subtitle: string;
  elementCount?: number;
};

type PagesState = {
  pages: PageSummary[];
  isLoading: boolean;
  error: string | null;
  fetchPages: (projectId: string, token?: string | null) => Promise<void>;
  createPage: (
    projectId: string,
    token?: string | null,
    template?: Template,
    afterPageId?: string
  ) => Promise<PageSummary | null>;
  setPages: (pages: PageSummary[]) => void;
};

function buildAuthHeaders(token?: string | null) {
  return token ? { Authorization: `Bearer ${token}` } : {};
}

export const usePagesStore = create<PagesState>((set) => ({
  pages: [],
  isLoading: false,
  error: null,
  setPages: (pages) => set({ pages }),
  fetchPages: async (projectId, token) => {
    if (!projectId) {
      set({ error: "Missing project ID.", pages: [] });
      return;
    }

    set({ isLoading: true, error: null });
    try {
      const response = await fetch(`${API_BASE}/projects/${projectId}/pages`, {
        headers: {
          "Content-Type": "application/json",
          ...buildAuthHeaders(token),
        },
      });

      if (!response.ok) {
        throw new Error(`Failed to load pages (${response.status})`);
      }

      const data = (await response.json()) as { pages?: PageSummary[]; data?: PageSummary[] };
      const pages = Array.isArray(data.pages)
        ? data.pages
        : Array.isArray(data.data)
          ? data.data
          : [];

      pages.sort((a, b) => a.order - b.order);
      set({ pages, isLoading: false });
    } catch (error) {
      set({
        pages: [],
        isLoading: false,
        error: error instanceof Error ? error.message : "Unable to load pages.",
      });
    }
  },
  createPage: async (projectId, token, template = "classic-front", afterPageId) => {
    if (!projectId) {
      set({ error: "Missing project ID." });
      return null;
    }

    try {
      const response = await fetch(`${API_BASE}/projects/${projectId}/pages`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...buildAuthHeaders(token),
        },
        body: JSON.stringify({
          template,
          afterPageId,
        }),
      });

      if (!response.ok) {
        throw new Error(`Failed to create page (${response.status})`);
      }

      const created = (await response.json()) as PageSummary;
      set((state) => {
        const pages = [...state.pages, created].sort((a, b) => a.order - b.order);
        return { pages };
      });
      return created;
    } catch (error) {
      set({
        error: error instanceof Error ? error.message : "Unable to create page.",
      });
      return null;
    }
  },
}));
