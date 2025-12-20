import { create } from 'zustand';
import type { PageListItem } from '@/lib/api';
import api from '@/lib/api';

interface PagesState {
  pages: PageListItem[];
  currentPageId: string | null;
  isLoading: boolean;
  error: string | null;

  // Actions
  fetchPages: (projectId: string) => Promise<void>;
  createPage: (projectId: string, templateId: string, afterPageId?: string) => Promise<void>;
  updatePage: (pageId: string, data: { title?: string; subtitle?: string }) => Promise<void>;
  deletePage: (pageId: string) => Promise<void>;
  reorderPages: (projectId: string, pageIds: string[]) => Promise<void>;
  setCurrentPage: (pageId: string | null) => void;

  // Getters
  getCurrentPage: () => PageListItem | null;
}

export const usePagesStore = create<PagesState>((set, get) => ({
  pages: [],
  currentPageId: null,
  isLoading: false,
  error: null,

  fetchPages: async (projectId: string) => {
    set({ isLoading: true, error: null });
    try {
      const pages = await api.pages.list(projectId);
      set({ pages, isLoading: false });
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to fetch pages';
      set({ error: errorMessage, isLoading: false });
    }
  },

  createPage: async (projectId: string, templateId: string, afterPageId?: string) => {
    set({ isLoading: true, error: null });
    try {
      const newPage = await api.pages.create(projectId, templateId);

      // Convert CreatePageResponse to PageListItem for storage
      const pageListItem: PageListItem = {
        id: newPage.id,
        order: newPage.order,
        templateId: newPage.templateId,
        title: newPage.title,
        subtitle: newPage.subtitle,
        elementCount: 0, // New page starts with 0 elements
      };

      // Add the new page to the store
      const { pages } = get();
      let updatedPages: PageListItem[];

      if (afterPageId) {
        // Insert after specified page
        const afterIndex = pages.findIndex(p => p.id === afterPageId);
        if (afterIndex !== -1) {
          updatedPages = [
            ...pages.slice(0, afterIndex + 1),
            pageListItem,
            ...pages.slice(afterIndex + 1),
          ];
        } else {
          // If afterPageId not found, append to end
          updatedPages = [...pages, pageListItem];
        }
      } else {
        // Append to end
        updatedPages = [...pages, pageListItem];
      }

      set({
        pages: updatedPages,
        currentPageId: newPage.id,
        isLoading: false
      });
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to create page';
      set({ error: errorMessage, isLoading: false });
      throw error; // Re-throw to propagate to caller
    }
  },

  updatePage: async (pageId: string, data: { title?: string; subtitle?: string }) => {
    set({ error: null });
    try {
      const updatedPage = await api.pages.update(pageId, data);

      // Update the page in the store (merge with existing to preserve elementCount)
      const { pages } = get();
      const updatedPages = pages.map(p => {
        if (p.id === pageId) {
          return {
            ...p,
            title: updatedPage.title,
            subtitle: updatedPage.subtitle,
          };
        }
        return p;
      });

      set({ pages: updatedPages });
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to update page';
      set({ error: errorMessage });
    }
  },

  deletePage: async (pageId: string) => {
    set({ error: null });
    try {
      await api.pages.delete(pageId);

      // Remove the page from the store
      const { pages, currentPageId } = get();
      const updatedPages = pages.filter(p => p.id !== pageId);

      // If the deleted page was current, clear selection or select another page
      let newCurrentPageId = currentPageId;
      if (currentPageId === pageId) {
        newCurrentPageId = updatedPages.length > 0 ? updatedPages[0].id : null;
      }

      set({
        pages: updatedPages,
        currentPageId: newCurrentPageId
      });
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to delete page';
      set({ error: errorMessage });
    }
  },

  reorderPages: async (projectId: string, pageIds: string[]) => {
    set({ error: null });

    // Optimistically update the order in the store
    const { pages } = get();
    const pageMap = new Map(pages.map(p => [p.id, p]));
    const reorderedPages = pageIds
      .map(id => pageMap.get(id))
      .filter((p): p is PageListItem => p !== undefined);

    // Store original order for rollback
    const originalPages = [...pages];

    set({ pages: reorderedPages });

    try {
      await api.pages.reorder(projectId, pageIds);
    } catch (error) {
      // Rollback on error
      set({ pages: originalPages });
      const errorMessage = error instanceof Error ? error.message : 'Failed to reorder pages';
      set({ error: errorMessage });
    }
  },

  setCurrentPage: (pageId: string | null) => {
    set({ currentPageId: pageId });
  },

  getCurrentPage: () => {
    const { pages, currentPageId } = get();
    if (!currentPageId) return null;
    return pages.find(p => p.id === currentPageId) || null;
  },
}));
