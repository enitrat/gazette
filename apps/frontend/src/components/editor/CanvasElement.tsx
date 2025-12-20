import { useElementsStore, type ElementWithStyle } from "@/stores/elements-store";
import { useElementDrag } from "@/hooks/use-element-drag";
import { SelectionOverlay } from "./SelectionOverlay";
import { TextEditor } from "./TextEditor";
import api, { videos } from "@/lib/api";
import { Loader2, Clock, AlertCircle, Play } from "lucide-react";
import {
  getMergedTextStyle,
  textStyleToInlineStyle,
  type TextElementTypeKey,
} from "@gazette/shared";

interface CanvasElementProps {
  element: ElementWithStyle;
}

export function CanvasElement({ element }: CanvasElementProps) {
  const selectedId = useElementsStore((state) => state.selectedId);
  const editingId = useElementsStore((state) => state.editingId);
  const selectElement = useElementsStore((state) => state.selectElement);
  const startEditing = useElementsStore((state) => state.startEditing);

  const isSelected = selectedId === element.id;
  const isEditing = editingId === element.id;

  const { isDragging, handleMouseDown, handleTouchStart } = useElementDrag({
    element,
    disabled: isEditing,
  });

  const handleClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (!isSelected) {
      selectElement(element.id);
    }
  };

  const handleDoubleClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (element.type !== "image") {
      startEditing(element.id);
    }
  };

  const renderContent = () => {
    if (element.type === "image") {
      const hasVideo = element.videoStatus === "complete" && element.videoUrl;
      const isPending = element.videoStatus === "pending";
      const isProcessing = element.videoStatus === "processing";
      const isFailed = element.videoStatus === "failed";
      const showStatusOverlay = isPending || isProcessing || isFailed;

      return (
        <div className="h-full w-full overflow-hidden rounded-sm relative">
          {/* Video or Image */}
          {hasVideo ? (
            <video
              src={videos.getUrl(element.videoUrl!)}
              className="h-full w-full object-cover"
              autoPlay
              loop
              muted
              playsInline
            />
          ) : element.imageId ? (
            <img
              src={api.images.getUrl(element.imageId)}
              alt="Image"
              className="h-full w-full object-cover"
              style={{
                objectPosition: element.cropData
                  ? `${-element.cropData.x}px ${-element.cropData.y}px`
                  : "center",
                transform: element.cropData ? `scale(${element.cropData.zoom})` : undefined,
              }}
              draggable={false}
            />
          ) : (
            <div className="flex h-full w-full items-center justify-center bg-gradient-to-br from-[#e8dcc0] to-[#d4c4a0] text-[#8b7355]">
              <svg
                className="h-12 w-12 opacity-40"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={1.5}
                  d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"
                />
              </svg>
            </div>
          )}

          {/* Video indicator badge (when video is ready) */}
          {hasVideo && (
            <div className="absolute top-2 right-2 flex items-center gap-1 px-2 py-1 bg-[#2e7d32]/90 text-white text-xs font-serif rounded-sm shadow-md">
              <Play className="w-3 h-3" />
              <span>Video</span>
            </div>
          )}

          {/* Status overlay */}
          {showStatusOverlay && (
            <div className="absolute inset-0 bg-black/40 flex flex-col items-center justify-center gap-2">
              {isPending && (
                <>
                  <Clock className="w-8 h-8 text-[#d4af37]" />
                  <span className="text-xs font-serif text-white bg-black/50 px-2 py-1 rounded">
                    Queued
                  </span>
                </>
              )}
              {isProcessing && (
                <>
                  <Loader2 className="w-8 h-8 text-[#d4af37] animate-spin" />
                  <span className="text-xs font-serif text-white bg-black/50 px-2 py-1 rounded">
                    Generating...
                  </span>
                </>
              )}
              {isFailed && (
                <>
                  <AlertCircle className="w-8 h-8 text-[#ef4444]" />
                  <span className="text-xs font-serif text-white bg-black/50 px-2 py-1 rounded">
                    Failed
                  </span>
                </>
              )}
            </div>
          )}
        </div>
      );
    }

    // Text elements - use shared helper for consistent styling with export
    const mergedStyle = getMergedTextStyle(element.type as TextElementTypeKey, element.style);
    const inlineStyle = textStyleToInlineStyle(mergedStyle);

    if (isEditing) {
      return (
        <TextEditor
          element={
            element as Extract<ElementWithStyle, { type: "headline" | "subheading" | "caption" }>
          }
        />
      );
    }

    return (
      <div
        className="h-full w-full p-2"
        style={{
          ...inlineStyle,
          wordWrap: "break-word",
          overflowWrap: "break-word",
          overflow: "hidden",
        }}
      >
        {element.content || getPlaceholder(element.type)}
      </div>
    );
  };

  return (
    <div
      style={{
        position: "absolute",
        left: element.position.x,
        top: element.position.y,
        width: element.position.width,
        height: element.position.height,
        cursor: isDragging ? "grabbing" : isEditing ? "text" : "grab",
        userSelect: isEditing ? "text" : "none",
        transition: isDragging ? "none" : "box-shadow 0.2s ease",
        boxShadow:
          isSelected && !isEditing
            ? "0 4px 12px rgba(59, 130, 246, 0.15)"
            : "0 1px 3px rgba(0, 0, 0, 0.08)",
      }}
      onClick={handleClick}
      onDoubleClick={handleDoubleClick}
      onMouseDown={!isEditing ? handleMouseDown : undefined}
      onTouchStart={!isEditing ? handleTouchStart : undefined}
    >
      {renderContent()}
      {isSelected && !isEditing && <SelectionOverlay element={element} />}
    </div>
  );
}

function getPlaceholder(type: "headline" | "subheading" | "caption") {
  switch (type) {
    case "headline":
      return "Double-click to edit headline";
    case "subheading":
      return "Double-click to edit subheading";
    case "caption":
      return "Double-click to edit caption";
  }
}
