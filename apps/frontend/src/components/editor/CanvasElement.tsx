import { useEffect, useRef, useState, type PointerEvent as ReactPointerEvent } from "react";
import { cn } from "@/lib/utils";
import type { CanvasElement as CanvasElementType } from "@/types/editor";

type ResizeHandle = "n" | "s" | "e" | "w" | "ne" | "nw" | "se" | "sw";

type CanvasElementProps = {
  element: CanvasElementType;
  isSelected: boolean;
  scale: number;
  onSelect: (elementId: string) => void;
  onPositionCommit: (elementId: string, position: CanvasElementType["position"]) => void;
  onResizeCommit: (elementId: string, position: CanvasElementType["position"]) => void;
  onTextCommit: (elementId: string, content: string) => void;
  onImageDoubleClick?: (element: CanvasElementType) => void;
};

const GRID_SIZE = 8;
const MIN_TEXT_SIZE = 40;
const MIN_IMAGE_SIZE = 80;

const snap = (value: number) => Math.round(value / GRID_SIZE) * GRID_SIZE;

const clamp = (value: number, min: number) => Math.max(value, min);

const getMinSize = (type: CanvasElementType["type"]) =>
  type === "image" ? MIN_IMAGE_SIZE : MIN_TEXT_SIZE;

type DragState = {
  startPointer: { x: number; y: number };
  startPosition: CanvasElementType["position"];
};

type ResizeState = DragState & {
  handle: ResizeHandle;
};

const computeResize = (
  state: ResizeState,
  pointer: { x: number; y: number },
  scale: number,
  minSize: number
): CanvasElementType["position"] => {
  const dx = (pointer.x - state.startPointer.x) / scale;
  const dy = (pointer.y - state.startPointer.y) / scale;
  const start = state.startPosition;

  let nextX = start.x;
  let nextY = start.y;
  let nextWidth = start.width;
  let nextHeight = start.height;

  if (state.handle.includes("e")) {
    nextWidth = start.width + dx;
  }
  if (state.handle.includes("s")) {
    nextHeight = start.height + dy;
  }
  if (state.handle.includes("w")) {
    nextWidth = start.width - dx;
    nextX = start.x + dx;
  }
  if (state.handle.includes("n")) {
    nextHeight = start.height - dy;
    nextY = start.y + dy;
  }

  const clampedWidth = clamp(nextWidth, minSize);
  const clampedHeight = clamp(nextHeight, minSize);

  if (state.handle.includes("w")) {
    nextX = start.x + (start.width - clampedWidth);
  }
  if (state.handle.includes("n")) {
    nextY = start.y + (start.height - clampedHeight);
  }

  return {
    x: snap(nextX),
    y: snap(nextY),
    width: snap(clampedWidth),
    height: snap(clampedHeight),
  };
};

export function CanvasElement({
  element,
  isSelected,
  scale,
  onSelect,
  onPositionCommit,
  onResizeCommit,
  onTextCommit,
  onImageDoubleClick,
}: CanvasElementProps) {
  const [isDragging, setIsDragging] = useState(false);
  const [isResizing, setIsResizing] = useState(false);
  const [previewPosition, setPreviewPosition] = useState<CanvasElementType["position"] | null>(
    null
  );
  const [isEditing, setIsEditing] = useState(false);
  const [draftContent, setDraftContent] = useState(element.content ?? "");
  const dragStateRef = useRef<DragState | null>(null);
  const resizeStateRef = useRef<ResizeState | null>(null);
  const textareaRef = useRef<HTMLTextAreaElement | null>(null);

  useEffect(() => {
    setDraftContent(element.content ?? "");
  }, [element.content]);

  useEffect(() => {
    if (!isEditing) return;
    textareaRef.current?.focus();
  }, [isEditing]);

  useEffect(() => {
    if (!isDragging) return;

    const handleMove = (event: PointerEvent) => {
      const state = dragStateRef.current;
      if (!state) return;
      const dx = (event.clientX - state.startPointer.x) / scale;
      const dy = (event.clientY - state.startPointer.y) / scale;
      const next = {
        x: snap(state.startPosition.x + dx),
        y: snap(state.startPosition.y + dy),
        width: state.startPosition.width,
        height: state.startPosition.height,
      };
      setPreviewPosition(next);
    };

    const handleEnd = () => {
      const state = dragStateRef.current;
      dragStateRef.current = null;
      setIsDragging(false);
      if (state && previewPosition) {
        onPositionCommit(element.id, previewPosition);
      }
      setPreviewPosition(null);
    };

    window.addEventListener("pointermove", handleMove);
    window.addEventListener("pointerup", handleEnd);
    window.addEventListener("pointercancel", handleEnd);

    return () => {
      window.removeEventListener("pointermove", handleMove);
      window.removeEventListener("pointerup", handleEnd);
      window.removeEventListener("pointercancel", handleEnd);
    };
  }, [element.id, isDragging, onPositionCommit, previewPosition, scale]);

  useEffect(() => {
    if (!isResizing) return;

    const handleMove = (event: PointerEvent) => {
      const state = resizeStateRef.current;
      if (!state) return;
      const minSize = getMinSize(element.type);
      const next = computeResize(state, { x: event.clientX, y: event.clientY }, scale, minSize);
      setPreviewPosition(next);
    };

    const handleEnd = () => {
      const state = resizeStateRef.current;
      resizeStateRef.current = null;
      setIsResizing(false);
      if (state && previewPosition) {
        onResizeCommit(element.id, previewPosition);
      }
      setPreviewPosition(null);
    };

    window.addEventListener("pointermove", handleMove);
    window.addEventListener("pointerup", handleEnd);
    window.addEventListener("pointercancel", handleEnd);

    return () => {
      window.removeEventListener("pointermove", handleMove);
      window.removeEventListener("pointerup", handleEnd);
      window.removeEventListener("pointercancel", handleEnd);
    };
  }, [element.id, element.type, isResizing, onResizeCommit, previewPosition, scale]);

  const position = previewPosition ?? element.position;
  const isText = element.type !== "image";

  const startDrag = (event: ReactPointerEvent<HTMLDivElement>) => {
    if (isEditing) return;
    if (event.button !== 0) return;
    event.stopPropagation();
    onSelect(element.id);
    event.currentTarget.setPointerCapture(event.pointerId);
    dragStateRef.current = {
      startPointer: { x: event.clientX, y: event.clientY },
      startPosition: { ...element.position },
    };
    setIsDragging(true);
  };

  const startResize = (event: ReactPointerEvent<HTMLDivElement>, handle: ResizeHandle) => {
    if (isEditing) return;
    event.stopPropagation();
    event.preventDefault();
    event.currentTarget.setPointerCapture(event.pointerId);
    resizeStateRef.current = {
      handle,
      startPointer: { x: event.clientX, y: event.clientY },
      startPosition: { ...element.position },
    };
    setIsResizing(true);
  };

  const handleDoubleClick = () => {
    if (element.type === "image") {
      onImageDoubleClick?.(element);
      return;
    }
    setIsEditing(true);
    onSelect(element.id);
  };

  const handleCommit = () => {
    if (!isEditing) return;
    onTextCommit(element.id, draftContent);
    setIsEditing(false);
  };

  const handleCancel = () => {
    setDraftContent(element.content ?? "");
    setIsEditing(false);
  };

  return (
    <div
      className={cn(
        "group absolute rounded-sm",
        isDragging && "opacity-80",
        isSelected && "outline outline-2 outline-blue-500",
        !isEditing && "cursor-grab active:cursor-grabbing"
      )}
      style={{
        left: position.x,
        top: position.y,
        width: position.width,
        height: position.height,
      }}
      onPointerDown={startDrag}
      onDoubleClick={(event) => {
        event.stopPropagation();
        handleDoubleClick();
      }}
      onClick={(event) => {
        event.stopPropagation();
        onSelect(element.id);
      }}
    >
      <div className="pointer-events-none absolute inset-0 rounded-sm bg-blue-500/10 opacity-0 transition group-hover:opacity-100" />
      {element.type === "image" ? (
        element.imageUrl ? (
          <img
            src={element.imageUrl}
            alt=""
            className="h-full w-full rounded-sm object-cover sepia-vintage"
            draggable={false}
            loading="lazy"
            decoding="async"
          />
        ) : (
          <div className="flex h-full w-full items-center justify-center rounded-sm bg-cream/60 text-xs font-ui text-muted">
            Image pending
          </div>
        )
      ) : (
        <div
          className={cn(
            "h-full w-full whitespace-pre-wrap text-ink",
            element.type === "headline" && "font-headline text-xl",
            element.type === "subheading" && "font-subheading text-lg italic",
            element.type === "caption" && "font-body text-sm"
          )}
        >
          {element.content}
        </div>
      )}
      {isSelected ? (
        <div className="pointer-events-none absolute inset-0">
          {(["nw", "n", "ne", "e", "se", "s", "sw", "w"] as const).map((handle) => (
            <div
              key={handle}
              className={cn(
                "pointer-events-auto absolute h-2 w-2 rounded-sm border border-blue-500 bg-white",
                handle === "nw" && "-left-1 -top-1 cursor-nwse-resize",
                handle === "n" && "left-1/2 -top-1 -translate-x-1/2 cursor-ns-resize",
                handle === "ne" && "-right-1 -top-1 cursor-nesw-resize",
                handle === "e" && "top-1/2 -right-1 -translate-y-1/2 cursor-ew-resize",
                handle === "se" && "-right-1 -bottom-1 cursor-nwse-resize",
                handle === "s" && "left-1/2 -bottom-1 -translate-x-1/2 cursor-ns-resize",
                handle === "sw" && "-left-1 -bottom-1 cursor-nesw-resize",
                handle === "w" && "top-1/2 -left-1 -translate-y-1/2 cursor-ew-resize"
              )}
              onPointerDown={(event) => startResize(event, handle)}
            />
          ))}
        </div>
      ) : null}
      {isEditing && isText ? (
        <textarea
          ref={textareaRef}
          value={draftContent}
          onChange={(event) => setDraftContent(event.target.value)}
          onPointerDown={(event) => event.stopPropagation()}
          onBlur={handleCommit}
          onKeyDown={(event) => {
            if (event.key === "Escape") {
              event.preventDefault();
              handleCancel();
              return;
            }
            if ((event.metaKey || event.ctrlKey) && event.key === "Enter") {
              event.preventDefault();
              handleCommit();
            }
          }}
          className={cn(
            "absolute inset-0 z-10 resize-none rounded-sm border border-blue-500/60 bg-white/90 p-1 font-ui text-sm text-ink outline-none",
            element.type === "headline" && "font-headline text-xl",
            element.type === "subheading" && "font-subheading text-lg italic",
            element.type === "caption" && "font-body text-sm"
          )}
        />
      ) : null}
    </div>
  );
}
