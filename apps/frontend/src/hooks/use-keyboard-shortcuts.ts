import { useEffect, useCallback } from 'react';
import { useElementsStore } from '@/stores/elements-store';
import { usePagesStore } from '@/stores/pages-store';
import { useUIStore } from '@/stores/ui-store';

interface UseKeyboardShortcutsOptions {
  /**
   * Whether to enable keyboard shortcuts (default: true)
   */
  enabled?: boolean;
}

/**
 * Hook that handles keyboard shortcuts for the editor.
 * Automatically detects when user is typing in inputs/textareas to avoid conflicts.
 */
export function useKeyboardShortcuts(options: UseKeyboardShortcutsOptions = {}) {
  const { enabled = true } = options;

  // Store hooks
  const {
    selectedId,
    deleteElement,
    clearSelection,
    copySelected,
    paste,
    getSelectedElement,
    updateElementLocal,
  } = useElementsStore();

  const currentPageId = usePagesStore((state) => state.currentPageId);
  const editingId = useElementsStore((state) => state.editingId);
  const closeDialog = useUIStore((state) => state.closeDialog);
  const activeDialog = useUIStore((state) => state.activeDialog);

  /**
   * Check if user is currently typing in an input/textarea/contenteditable
   */
  const isTypingInInput = useCallback(() => {
    const activeElement = document.activeElement;
    if (!activeElement) return false;

    const tagName = activeElement.tagName.toLowerCase();
    const isInput = tagName === 'input' || tagName === 'textarea';
    const isContentEditable = activeElement.getAttribute('contenteditable') === 'true';
    const isEditing = !!editingId;

    return isInput || isContentEditable || isEditing;
  }, [editingId]);

  /**
   * Handle element nudging with arrow keys
   */
  const nudgeElement = useCallback(
    (direction: 'up' | 'down' | 'left' | 'right', largeStep: boolean) => {
      if (!selectedId) return;

      const element = getSelectedElement();
      if (!element) return;

      const step = largeStep ? 10 : 1;
      const { x, y } = element.position;

      let newX = x;
      let newY = y;

      switch (direction) {
        case 'up':
          newY = y - step;
          break;
        case 'down':
          newY = y + step;
          break;
        case 'left':
          newX = x - step;
          break;
        case 'right':
          newX = x + step;
          break;
      }

      // Update position locally (optimistic update)
      updateElementLocal(element.id, {
        position: {
          ...element.position,
          x: newX,
          y: newY,
        },
      });

      // Sync to backend after a delay (debounced in practice via multiple calls)
      // The actual API sync would be handled by the drag hook on mouse up
    },
    [selectedId, getSelectedElement, updateElementLocal]
  );

  /**
   * Main keyboard event handler
   */
  useEffect(() => {
    if (!enabled) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      // Check if user is typing
      const typing = isTypingInInput();

      // Handle Escape - always works, even when typing
      if (e.key === 'Escape') {
        e.preventDefault();
        if (activeDialog) {
          closeDialog();
        } else {
          clearSelection();
        }
        return;
      }

      // Don't handle other shortcuts if user is typing
      if (typing) return;

      const isMac = navigator.platform.toUpperCase().indexOf('MAC') >= 0;
      const cmdOrCtrl = isMac ? e.metaKey : e.ctrlKey;

      // Delete/Backspace - delete selected element
      if ((e.key === 'Delete' || e.key === 'Backspace') && selectedId) {
        e.preventDefault();
        deleteElement(selectedId);
        return;
      }

      // Cmd/Ctrl+C - copy selected element
      if (cmdOrCtrl && e.key === 'c' && selectedId) {
        e.preventDefault();
        copySelected();
        return;
      }

      // Cmd/Ctrl+V - paste element
      if (cmdOrCtrl && e.key === 'v' && currentPageId) {
        e.preventDefault();
        paste(currentPageId);
        return;
      }

      // Arrow keys - nudge selected element
      if (selectedId && ['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight'].includes(e.key)) {
        e.preventDefault();
        const largeStep = e.shiftKey;

        switch (e.key) {
          case 'ArrowUp':
            nudgeElement('up', largeStep);
            break;
          case 'ArrowDown':
            nudgeElement('down', largeStep);
            break;
          case 'ArrowLeft':
            nudgeElement('left', largeStep);
            break;
          case 'ArrowRight':
            nudgeElement('right', largeStep);
            break;
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);

    return () => {
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [
    enabled,
    selectedId,
    currentPageId,
    activeDialog,
    deleteElement,
    clearSelection,
    copySelected,
    paste,
    closeDialog,
    isTypingInInput,
    nudgeElement,
  ]);

  return {
    isTypingInInput,
  };
}
