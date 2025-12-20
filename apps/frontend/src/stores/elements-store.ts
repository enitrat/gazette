import { create } from 'zustand';
import type { CreateElement, UpdateElement, TextStyle } from '@gazette/shared';
import type { SerializedElement } from '@/lib/api';
import api from '@/lib/api';
import { toast } from 'sonner';

// Re-export TextStyle from shared for convenience
export type { TextStyle } from '@gazette/shared';

// Extended element with optional local style
// Note: style can be null (from API) or undefined (not set)
export type ElementWithStyle = SerializedElement & {
  style?: TextStyle | null;
};

interface ElementsState {
  elements: ElementWithStyle[];
  selectedId: string | null;
  editingId: string | null;
  clipboard: ElementWithStyle | null;
  isLoading: boolean;
  error: string | null;

  // Actions
  fetchElements: (pageId: string) => Promise<void>;
  createElement: (pageId: string, data: CreateElement) => Promise<SerializedElement>;
  updateElement: (elementId: string, data: UpdateElement) => Promise<void>;
  deleteElement: (elementId: string) => Promise<void>;

  // Selection
  selectElement: (id: string | null) => void;
  clearSelection: () => void;

  // Editing
  startEditing: (id: string) => void;
  stopEditing: () => void;

  // Clipboard
  copySelected: () => void;
  paste: (pageId: string) => Promise<void>;

  // Helpers
  getSelectedElement: () => ElementWithStyle | null;
  getElementById: (id: string) => ElementWithStyle | null;

  // Local updates (for optimistic UI)
  updateElementLocal: (id: string, updates: Partial<ElementWithStyle>) => void;
  updateElementStyle: (id: string, styleUpdates: Partial<TextStyle>) => void;
}

export const useElementsStore = create<ElementsState>((set, get) => ({
  elements: [],
  selectedId: null,
  editingId: null,
  clipboard: null,
  isLoading: false,
  error: null,

  fetchElements: async (pageId: string) => {
    set({ isLoading: true, error: null });
    try {
      const elements = await api.elements.list(pageId);
      set({ elements, isLoading: false });
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to fetch elements';
      set({ error: errorMessage, isLoading: false });

      // Show error toast with retry option
      toast.error('Failed to load elements', {
        description: errorMessage,
        action: {
          label: 'Retry',
          onClick: () => get().fetchElements(pageId),
        },
      });
    }
  },

  createElement: async (pageId: string, data: CreateElement) => {
    set({ error: null });
    try {
      const newElement = await api.elements.create(pageId, data);

      // Add the new element to the store
      const { elements } = get();
      set({
        elements: [...elements, newElement],
        selectedId: newElement.id
      });

      toast.success('Element added', {
        description: 'Your element has been added to the page',
      });

      return newElement;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to create element';
      set({ error: errorMessage });

      toast.error('Failed to create element', {
        description: errorMessage,
        action: {
          label: 'Retry',
          onClick: () => get().createElement(pageId, data),
        },
      });

      throw error;
    }
  },

  updateElement: async (elementId: string, data: UpdateElement) => {
    // Store original element for rollback
    const { elements } = get();
    const originalElement = elements.find(e => e.id === elementId);

    set({ error: null });
    try {
      const updatedElement = await api.elements.update(elementId, data);

      // Update the element in the store, preserving local-only properties (style)
      const updatedElements = elements.map(e => {
        if (e.id === elementId) {
          return {
            ...updatedElement,
            style: e.style, // Preserve frontend-only style
          } as ElementWithStyle;
        }
        return e;
      });

      set({ elements: updatedElements });
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to update element';
      set({ error: errorMessage });

      // Rollback to original element on error
      if (originalElement) {
        const rolledBackElements = elements.map(e =>
          e.id === elementId ? originalElement : e
        );
        set({ elements: rolledBackElements });
      }

      toast.error('Failed to update element', {
        description: errorMessage,
        action: {
          label: 'Retry',
          onClick: () => get().updateElement(elementId, data),
        },
      });

      throw error;
    }
  },

  deleteElement: async (elementId: string) => {
    // Store original state for rollback
    const { elements, selectedId } = get();
    const deletedElement = elements.find(e => e.id === elementId);

    // Optimistically remove the element
    const updatedElements = elements.filter(e => e.id !== elementId);
    const newSelectedId = selectedId === elementId ? null : selectedId;

    set({
      elements: updatedElements,
      selectedId: newSelectedId,
      editingId: null,
      error: null
    });

    try {
      await api.elements.delete(elementId);

      toast.success('Element deleted', {
        description: 'The element has been removed from the page',
      });
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to delete element';
      set({ error: errorMessage });

      // Rollback - restore the deleted element
      if (deletedElement) {
        set({
          elements: elements,
          selectedId: selectedId,
        });
      }

      toast.error('Failed to delete element', {
        description: errorMessage,
        action: {
          label: 'Retry',
          onClick: () => get().deleteElement(elementId),
        },
      });
    }
  },

  selectElement: (id: string | null) => {
    set({ selectedId: id });
  },

  clearSelection: () => {
    set({ selectedId: null, editingId: null });
  },

  startEditing: (id: string) => {
    set({ editingId: id, selectedId: id });
  },

  stopEditing: () => {
    set({ editingId: null });
  },

  copySelected: () => {
    const { selectedId, elements } = get();
    if (!selectedId) return;

    const element = elements.find(e => e.id === selectedId);
    if (element) {
      set({ clipboard: element });
    }
  },

  paste: async (pageId: string) => {
    const { clipboard } = get();
    if (!clipboard) return;

    // Create a copy of the element with offset position
    const createData: CreateElement = clipboard.type === 'image'
      ? {
          type: 'image',
          position: {
            x: clipboard.position.x + 20,
            y: clipboard.position.y + 20,
            width: clipboard.position.width,
            height: clipboard.position.height,
          },
          imageId: clipboard.imageId || undefined,
        }
      : {
          type: clipboard.type,
          position: {
            x: clipboard.position.x + 20,
            y: clipboard.position.y + 20,
            width: clipboard.position.width,
            height: clipboard.position.height,
          },
          content: clipboard.content || '',
        };

    try {
      await get().createElement(pageId, createData);
    } catch (error) {
      // Error already handled in createElement
      console.error('Failed to paste element:', error);
    }
  },

  getSelectedElement: () => {
    const { elements, selectedId } = get();
    if (!selectedId) return null;
    return elements.find(e => e.id === selectedId) || null;
  },

  getElementById: (id: string) => {
    const { elements } = get();
    return elements.find(e => e.id === id) || null;
  },

  updateElementLocal: (id: string, updates: Partial<ElementWithStyle>) => {
    const { elements } = get();
    const updatedElements = elements.map(e => {
      if (e.id === id) {
        // Properly merge updates while preserving the discriminated union type
        return { ...e, ...updates } as ElementWithStyle;
      }
      return e;
    });
    set({ elements: updatedElements });
  },

  updateElementStyle: async (id: string, styleUpdates: Partial<TextStyle>) => {
    const { elements } = get();
    const element = elements.find(e => e.id === id);
    if (!element) return;

    // Merge with existing style
    const newStyle = { ...(element.style || {}), ...styleUpdates };

    // Update local state immediately for responsive UI
    const updatedElements = elements.map(e => {
      if (e.id === id) {
        return {
          ...e,
          style: newStyle,
        } as ElementWithStyle;
      }
      return e;
    });
    set({ elements: updatedElements });

    // Persist to API
    try {
      await api.elements.update(id, { style: newStyle });
    } catch (error) {
      console.error('Failed to persist style:', error);
      // Rollback on error
      set({ elements });
    }
  },
}));
