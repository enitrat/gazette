import { useCallback, useEffect, useRef, useState } from "react";
import type { SerializedElement } from "@/lib/api";
import { useElementsStore } from "@/stores/elements-store";
import { CANVAS } from "@gazette/shared";

type ResizeHandle = "nw" | "n" | "ne" | "e" | "se" | "s" | "sw" | "w";

interface SelectionOverlayProps {
  element: SerializedElement;
}

interface ResizeState {
  isResizing: boolean;
  handle: ResizeHandle | null;
  startX: number;
  startY: number;
  startWidth: number;
  startHeight: number;
  startLeft: number;
  startTop: number;
}

export function SelectionOverlay({ element }: SelectionOverlayProps) {
  const [resizeState, setResizeState] = useState<ResizeState>({
    isResizing: false,
    handle: null,
    startX: 0,
    startY: 0,
    startWidth: 0,
    startHeight: 0,
    startLeft: 0,
    startTop: 0,
  });

  const updateElementLocal = useElementsStore((state) => state.updateElementLocal);
  const updateElement = useElementsStore((state) => state.updateElement);
  const resizeStateRef = useRef(resizeState);

  useEffect(() => {
    resizeStateRef.current = resizeState;
  }, [resizeState]);

  const handleResizeStart = useCallback(
    (handle: ResizeHandle) => (e: React.MouseEvent | React.TouchEvent) => {
      e.stopPropagation();

      const clientX = "touches" in e ? e.touches[0].clientX : e.clientX;
      const clientY = "touches" in e ? e.touches[0].clientY : e.clientY;

      setResizeState({
        isResizing: true,
        handle,
        startX: clientX,
        startY: clientY,
        startWidth: element.position.width,
        startHeight: element.position.height,
        startLeft: element.position.x,
        startTop: element.position.y,
      });
    },
    [element.position]
  );

  useEffect(() => {
    if (!resizeState.isResizing) return;

    const handleMove = (e: MouseEvent | TouchEvent) => {
      e.preventDefault();

      const clientX = "touches" in e ? e.touches[0].clientX : e.clientX;
      const clientY = "touches" in e ? e.touches[0].clientY : e.clientY;

      const state = resizeStateRef.current;
      const deltaX = clientX - state.startX;
      const deltaY = clientY - state.startY;

      let newWidth = state.startWidth;
      let newHeight = state.startHeight;
      let newX = state.startLeft;
      let newY = state.startTop;

      // Calculate new dimensions based on handle
      switch (state.handle) {
        case "e":
          newWidth = Math.max(50, state.startWidth + deltaX);
          break;
        case "w":
          newWidth = Math.max(50, state.startWidth - deltaX);
          newX = state.startLeft + (state.startWidth - newWidth);
          break;
        case "s":
          newHeight = Math.max(30, state.startHeight + deltaY);
          break;
        case "n":
          newHeight = Math.max(30, state.startHeight - deltaY);
          newY = state.startTop + (state.startHeight - newHeight);
          break;
        case "se":
          newWidth = Math.max(50, state.startWidth + deltaX);
          newHeight = Math.max(30, state.startHeight + deltaY);
          break;
        case "sw":
          newWidth = Math.max(50, state.startWidth - deltaX);
          newHeight = Math.max(30, state.startHeight + deltaY);
          newX = state.startLeft + (state.startWidth - newWidth);
          break;
        case "ne":
          newWidth = Math.max(50, state.startWidth + deltaX);
          newHeight = Math.max(30, state.startHeight - deltaY);
          newY = state.startTop + (state.startHeight - newHeight);
          break;
        case "nw":
          newWidth = Math.max(50, state.startWidth - deltaX);
          newHeight = Math.max(30, state.startHeight - deltaY);
          newX = state.startLeft + (state.startWidth - newWidth);
          newY = state.startTop + (state.startHeight - newHeight);
          break;
      }

      // Constrain to gazette bounds
      newX = Math.max(0, Math.min(CANVAS.WIDTH - newWidth, newX));
      newY = Math.max(0, Math.min(CANVAS.HEIGHT - newHeight, newY));

      updateElementLocal(element.id, {
        position: {
          x: newX,
          y: newY,
          width: newWidth,
          height: newHeight,
        },
      });
    };

    const handleEnd = async () => {
      setResizeState((prev) => ({
        ...prev,
        isResizing: false,
      }));

      // Persist to server
      const finalElement = useElementsStore.getState().getElementById(element.id);
      if (finalElement) {
        try {
          await updateElement(element.id, {
            position: finalElement.position,
          });
        } catch (error) {
          console.error("Failed to update element size:", error);
        }
      }
    };

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
  }, [resizeState.isResizing, element.id, updateElementLocal, updateElement]);

  // Base visual size for the handle
  const visualSize = 16;
  // Touch target size (44px minimum for accessibility)
  const touchTargetSize = 44;
  const touchTargetOffset = (touchTargetSize - visualSize) / 2;

  const handleStyle = {
    position: "absolute" as const,
    width: `${visualSize}px`,
    height: `${visualSize}px`,
    backgroundColor: "#3b82f6",
    border: "2px solid white",
    borderRadius: "50%",
    cursor: "pointer",
    boxShadow: "0 2px 4px rgba(0,0,0,0.2)",
    transition: "transform 0.15s ease",
    touchAction: "none",
  };

  // Invisible larger touch target
  const touchTargetStyle = {
    position: "absolute" as const,
    width: `${touchTargetSize}px`,
    height: `${touchTargetSize}px`,
    left: `${-touchTargetOffset}px`,
    top: `${-touchTargetOffset}px`,
    pointerEvents: "auto" as const,
  };

  const handleHoverStyle = {
    transform: "scale(1.15)",
  };

  return (
    <div
      style={{
        position: "absolute",
        left: -2,
        top: -2,
        width: element.position.width + 4,
        height: element.position.height + 4,
        border: "2px solid #3b82f6",
        pointerEvents: "none",
        borderRadius: "2px",
        boxShadow: "0 0 0 1px rgba(59, 130, 246, 0.2)",
      }}
    >
      {/* Corner handles with larger touch targets */}
      <div style={{ position: "absolute", left: -8, top: -8, cursor: "nw-resize" }}>
        <div
          style={touchTargetStyle}
          onMouseDown={handleResizeStart("nw")}
          onTouchStart={handleResizeStart("nw")}
        />
        <div
          style={{ ...handleStyle, position: "relative", pointerEvents: "none" }}
          onMouseEnter={(e) => Object.assign(e.currentTarget.style, handleHoverStyle)}
          onMouseLeave={(e) => Object.assign(e.currentTarget.style, { transform: "scale(1)" })}
        />
      </div>
      <div style={{ position: "absolute", right: -8, top: -8, cursor: "ne-resize" }}>
        <div
          style={touchTargetStyle}
          onMouseDown={handleResizeStart("ne")}
          onTouchStart={handleResizeStart("ne")}
        />
        <div
          style={{ ...handleStyle, position: "relative", pointerEvents: "none" }}
          onMouseEnter={(e) => Object.assign(e.currentTarget.style, handleHoverStyle)}
          onMouseLeave={(e) => Object.assign(e.currentTarget.style, { transform: "scale(1)" })}
        />
      </div>
      <div style={{ position: "absolute", right: -8, bottom: -8, cursor: "se-resize" }}>
        <div
          style={touchTargetStyle}
          onMouseDown={handleResizeStart("se")}
          onTouchStart={handleResizeStart("se")}
        />
        <div
          style={{ ...handleStyle, position: "relative", pointerEvents: "none" }}
          onMouseEnter={(e) => Object.assign(e.currentTarget.style, handleHoverStyle)}
          onMouseLeave={(e) => Object.assign(e.currentTarget.style, { transform: "scale(1)" })}
        />
      </div>
      <div style={{ position: "absolute", left: -8, bottom: -8, cursor: "sw-resize" }}>
        <div
          style={touchTargetStyle}
          onMouseDown={handleResizeStart("sw")}
          onTouchStart={handleResizeStart("sw")}
        />
        <div
          style={{ ...handleStyle, position: "relative", pointerEvents: "none" }}
          onMouseEnter={(e) => Object.assign(e.currentTarget.style, handleHoverStyle)}
          onMouseLeave={(e) => Object.assign(e.currentTarget.style, { transform: "scale(1)" })}
        />
      </div>

      {/* Edge handles with larger touch targets */}
      <div
        style={{
          position: "absolute",
          left: "50%",
          top: -8,
          transform: "translateX(-50%)",
          cursor: "n-resize",
        }}
      >
        <div
          style={touchTargetStyle}
          onMouseDown={handleResizeStart("n")}
          onTouchStart={handleResizeStart("n")}
        />
        <div
          style={{ ...handleStyle, position: "relative", pointerEvents: "none" }}
          onMouseEnter={(e) => Object.assign(e.currentTarget.style, handleHoverStyle)}
          onMouseLeave={(e) => Object.assign(e.currentTarget.style, { transform: "scale(1)" })}
        />
      </div>
      <div
        style={{
          position: "absolute",
          right: -8,
          top: "50%",
          transform: "translateY(-50%)",
          cursor: "e-resize",
        }}
      >
        <div
          style={touchTargetStyle}
          onMouseDown={handleResizeStart("e")}
          onTouchStart={handleResizeStart("e")}
        />
        <div
          style={{ ...handleStyle, position: "relative", pointerEvents: "none" }}
          onMouseEnter={(e) => Object.assign(e.currentTarget.style, handleHoverStyle)}
          onMouseLeave={(e) => Object.assign(e.currentTarget.style, { transform: "scale(1)" })}
        />
      </div>
      <div
        style={{
          position: "absolute",
          left: "50%",
          bottom: -8,
          transform: "translateX(-50%)",
          cursor: "s-resize",
        }}
      >
        <div
          style={touchTargetStyle}
          onMouseDown={handleResizeStart("s")}
          onTouchStart={handleResizeStart("s")}
        />
        <div
          style={{ ...handleStyle, position: "relative", pointerEvents: "none" }}
          onMouseEnter={(e) => Object.assign(e.currentTarget.style, handleHoverStyle)}
          onMouseLeave={(e) => Object.assign(e.currentTarget.style, { transform: "scale(1)" })}
        />
      </div>
      <div
        style={{
          position: "absolute",
          left: -8,
          top: "50%",
          transform: "translateY(-50%)",
          cursor: "w-resize",
        }}
      >
        <div
          style={touchTargetStyle}
          onMouseDown={handleResizeStart("w")}
          onTouchStart={handleResizeStart("w")}
        />
        <div
          style={{ ...handleStyle, position: "relative", pointerEvents: "none" }}
          onMouseEnter={(e) => Object.assign(e.currentTarget.style, handleHoverStyle)}
          onMouseLeave={(e) => Object.assign(e.currentTarget.style, { transform: "scale(1)" })}
        />
      </div>
    </div>
  );
}
