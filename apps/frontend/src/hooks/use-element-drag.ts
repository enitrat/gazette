import { useCallback, useEffect, useRef, useState } from "react";
import type { SerializedElement } from "@/lib/api";
import { useElementsStore } from "@/stores/elements-store";
import { CANVAS } from "@gazette/shared";

interface DragState {
  isDragging: boolean;
  startX: number;
  startY: number;
  startElementX: number;
  startElementY: number;
}

interface UseElementDragOptions {
  element: SerializedElement;
  onDragStart?: () => void;
  onDragEnd?: () => void;
  disabled?: boolean;
}

export function useElementDrag({
  element,
  onDragStart,
  onDragEnd,
  disabled,
}: UseElementDragOptions) {
  const [dragState, setDragState] = useState<DragState>({
    isDragging: false,
    startX: 0,
    startY: 0,
    startElementX: 0,
    startElementY: 0,
  });

  const updateElementLocal = useElementsStore((state) => state.updateElementLocal);
  const updateElement = useElementsStore((state) => state.updateElement);
  const dragStateRef = useRef(dragState);

  // Keep ref in sync
  useEffect(() => {
    dragStateRef.current = dragState;
  }, [dragState]);

  const handleMouseDown = useCallback(
    (e: React.MouseEvent | React.TouchEvent) => {
      if (disabled) return;

      e.stopPropagation();

      const clientX = "touches" in e ? e.touches[0].clientX : e.clientX;
      const clientY = "touches" in e ? e.touches[0].clientY : e.clientY;

      setDragState({
        isDragging: true,
        startX: clientX,
        startY: clientY,
        startElementX: element.position.x,
        startElementY: element.position.y,
      });

      onDragStart?.();
    },
    [disabled, element.position.x, element.position.y, onDragStart]
  );

  useEffect(() => {
    if (!dragState.isDragging) return;

    const handleMove = (e: MouseEvent | TouchEvent) => {
      e.preventDefault();

      const clientX = "touches" in e ? e.touches[0].clientX : e.clientX;
      const clientY = "touches" in e ? e.touches[0].clientY : e.clientY;

      const state = dragStateRef.current;
      const deltaX = clientX - state.startX;
      const deltaY = clientY - state.startY;

      const newX = state.startElementX + deltaX;
      const newY = state.startElementY + deltaY;

      // Constrain to gazette page bounds
      const constrainedX = Math.max(0, Math.min(CANVAS.WIDTH - element.position.width, newX));
      const constrainedY = Math.max(0, Math.min(CANVAS.HEIGHT - element.position.height, newY));

      // Update local state immediately for smooth dragging
      updateElementLocal(element.id, {
        position: {
          ...element.position,
          x: constrainedX,
          y: constrainedY,
        },
      });
    };

    const handleEnd = async () => {
      const state = dragStateRef.current;

      setDragState({
        ...state,
        isDragging: false,
      });

      // Get the final position from the element
      const finalElement = useElementsStore.getState().getElementById(element.id);
      if (finalElement) {
        // Persist to server
        try {
          await updateElement(element.id, {
            position: finalElement.position,
          });
        } catch (error) {
          console.error("Failed to update element position:", error);
        }
      }

      onDragEnd?.();
    };

    // Add event listeners
    document.addEventListener("mousemove", handleMove);
    document.addEventListener("mouseup", handleEnd);
    document.addEventListener("touchmove", handleMove, { passive: false });
    document.addEventListener("touchend", handleEnd);

    return () => {
      document.removeEventListener("mousemove", handleMove);
      document.removeEventListener("mouseup", handleEnd);
      document.removeEventListener("touchmove", handleMove);
      document.removeEventListener("touchend", handleEnd);
    };
  }, [
    dragState.isDragging,
    element.id,
    element.position.width,
    element.position.height,
    updateElementLocal,
    updateElement,
    onDragEnd,
  ]);

  return {
    isDragging: dragState.isDragging,
    handleMouseDown,
    handleTouchStart: handleMouseDown,
  };
}
