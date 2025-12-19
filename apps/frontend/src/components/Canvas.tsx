import {
  useEffect,
  useMemo,
  useRef,
  useState,
  type PointerEvent as ReactPointerEvent,
  type SyntheticEvent,
} from "react";
import { cn } from "@/lib/utils";
import type { CanvasElement, CanvasPage } from "@/types/editor";

type CanvasProps = {
  page?: CanvasPage | null;
  projectName?: string;
  showChrome?: boolean;
  readOnly?: boolean;
  className?: string;
  emptyState?: string;
  selectedElementId?: string | null;
  onSelectElement?: (elementId: string) => void;
  onClearSelection?: () => void;
  onImageDoubleClick?: (element: CanvasElement) => void;
  onResizeElement?: (elementId: string, position: CanvasElement["position"]) => void;
  enableGestures?: boolean;
};

const VIDEO_LOOP_SECONDS = 5;
const MIN_SCALE = 0.7;
const MAX_SCALE = 2.5;
const GRID_SIZE = 10;
const MIN_TEXT_SIZE = 40;
const MIN_IMAGE_SIZE = 80;

type ResizeHandle = "n" | "s" | "e" | "w" | "ne" | "nw" | "se" | "sw";
type ResizeState = {
  elementId: string;
  handle: ResizeHandle;
  startPointer: { x: number; y: number };
  startPosition: CanvasElement["position"];
  aspectRatio: number | null;
  startScale: number;
  elementType: CanvasElement["type"];
};

const clamp = (value: number, min: number, max: number) => Math.min(Math.max(value, min), max);

function LoopingVideo({ src, className }: { src: string; className?: string }) {
  const handleTimeUpdate = (event: SyntheticEvent<HTMLVideoElement>) => {
    const video = event.currentTarget;
    const duration = Number.isFinite(video.duration) ? video.duration : VIDEO_LOOP_SECONDS;
    const limit = Math.min(VIDEO_LOOP_SECONDS, duration || VIDEO_LOOP_SECONDS);
    if (video.currentTime >= limit) {
      video.currentTime = 0;
      void video.play();
    }
  };

  return (
    <video
      className={className}
      src={src}
      muted
      playsInline
      autoPlay
      preload="metadata"
      onTimeUpdate={handleTimeUpdate}
    />
  );
}

function getCoverScale(
  imageWidth: number,
  imageHeight: number,
  frameWidth: number,
  frameHeight: number
) {
  if (imageWidth <= 0 || imageHeight <= 0 || frameWidth <= 0 || frameHeight <= 0) {
    return 1;
  }
  return Math.max(frameWidth / imageWidth, frameHeight / imageHeight);
}

const snapValue = (value: number) => Math.round(value / GRID_SIZE) * GRID_SIZE;

const clampSize = (value: number, min: number) => Math.max(value, min);

const getMinSize = (elementType: CanvasElement["type"]) =>
  elementType === "image" ? MIN_IMAGE_SIZE : MIN_TEXT_SIZE;

const applyRatioWithAnchor = (
  width: number,
  height: number,
  ratio: number,
  handle: ResizeHandle,
  start: CanvasElement["position"]
) => {
  const widthDelta = Math.abs(width - start.width);
  const heightDelta = Math.abs(height - start.height);
  let nextWidth = width;
  let nextHeight = height;

  if (widthDelta >= heightDelta) {
    nextHeight = nextWidth / ratio;
  } else {
    nextWidth = nextHeight * ratio;
  }

  const anchorX = handle.includes("w") ? start.x + start.width : start.x;
  const anchorY = handle.includes("n") ? start.y + start.height : start.y;

  const nextX = handle.includes("w") ? anchorX - nextWidth : anchorX;
  const nextY = handle.includes("n") ? anchorY - nextHeight : anchorY;

  return { x: nextX, y: nextY, width: nextWidth, height: nextHeight };
};

const computeResize = (
  state: ResizeState,
  pointer: { x: number; y: number }
): CanvasElement["position"] => {
  const scale = state.startScale || 1;
  const dx = (pointer.x - state.startPointer.x) / scale;
  const dy = (pointer.y - state.startPointer.y) / scale;
  const start = state.startPosition;
  const minSize = getMinSize(state.elementType);

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

  if (state.aspectRatio && state.aspectRatio > 0) {
    const ratio = state.aspectRatio;
    if (state.handle === "e" || state.handle === "w") {
      nextWidth = clampSize(nextWidth, minSize);
      nextHeight = nextWidth / ratio;
      nextY = start.y + (start.height - nextHeight) / 2;
      if (state.handle === "w") {
        nextX = start.x + (start.width - nextWidth);
      }
    } else if (state.handle === "n" || state.handle === "s") {
      nextHeight = clampSize(nextHeight, minSize);
      nextWidth = nextHeight * ratio;
      nextX = start.x + (start.width - nextWidth) / 2;
      if (state.handle === "n") {
        nextY = start.y + (start.height - nextHeight);
      }
    } else {
      const adjusted = applyRatioWithAnchor(nextWidth, nextHeight, ratio, state.handle, start);
      nextX = adjusted.x;
      nextY = adjusted.y;
      nextWidth = adjusted.width;
      nextHeight = adjusted.height;
    }
  }

  nextWidth = clampSize(nextWidth, minSize);
  nextHeight = clampSize(nextHeight, minSize);

  if (state.handle.includes("w")) {
    nextX = start.x + (start.width - nextWidth);
  }
  if (state.handle.includes("n")) {
    nextY = start.y + (start.height - nextHeight);
  }

  const snapped = {
    x: snapValue(nextX),
    y: snapValue(nextY),
    width: snapValue(nextWidth),
    height: snapValue(nextHeight),
  };
  const finalWidth = clampSize(snapped.width, minSize);
  const finalHeight = clampSize(snapped.height, minSize);

  let finalX = snapped.x;
  let finalY = snapped.y;

  if (state.aspectRatio && state.aspectRatio > 0) {
    if (state.handle === "e" || state.handle === "w") {
      finalX = state.handle === "w" ? start.x + (start.width - finalWidth) : start.x;
      finalY = start.y + (start.height - finalHeight) / 2;
    } else if (state.handle === "n" || state.handle === "s") {
      finalY = state.handle === "n" ? start.y + (start.height - finalHeight) : start.y;
      finalX = start.x + (start.width - finalWidth) / 2;
    } else {
      const anchorX = state.handle.includes("w") ? start.x + start.width : start.x;
      const anchorY = state.handle.includes("n") ? start.y + start.height : start.y;
      finalX = state.handle.includes("w") ? anchorX - finalWidth : anchorX;
      finalY = state.handle.includes("n") ? anchorY - finalHeight : anchorY;
    }
  } else {
    const anchorX = state.handle.includes("w") ? start.x + start.width : start.x;
    const anchorY = state.handle.includes("n") ? start.y + start.height : start.y;
    finalX = state.handle.includes("w") ? anchorX - finalWidth : anchorX;
    finalY = state.handle.includes("n") ? anchorY - finalHeight : anchorY;
  }

  return {
    x: snapValue(finalX),
    y: snapValue(finalY),
    width: finalWidth,
    height: finalHeight,
  };
};

function CanvasElementView({
  element,
  isSelected,
  onSelect,
  onImageDoubleClick,
  onResizeStart,
  showHandles,
  positionOverride,
  isResizing,
}: {
  element: CanvasElement;
  isSelected: boolean;
  onSelect?: (elementId: string) => void;
  onImageDoubleClick?: (element: CanvasElement) => void;
  onResizeStart?: (
    event: ReactPointerEvent<HTMLDivElement>,
    element: CanvasElement,
    handle: ResizeHandle
  ) => void;
  showHandles?: boolean;
  positionOverride?: CanvasElement["position"];
  isResizing?: boolean;
}) {
  const [naturalSize, setNaturalSize] = useState<{ width: number; height: number } | null>(null);
  const position = positionOverride ?? element.position;
  const baseStyle: React.CSSProperties = {
    left: position.x,
    top: position.y,
    width: position.width,
    height: position.height,
  };

  if (element.type === "image") {
    const hasVideo = element.videoUrl && element.videoStatus === "complete";
    const hasImage = element.imageUrl;
    const resolvedWidth =
      typeof element.imageWidth === "number" && element.imageWidth > 0
        ? element.imageWidth
        : (naturalSize?.width ?? 0);
    const resolvedHeight =
      typeof element.imageHeight === "number" && element.imageHeight > 0
        ? element.imageHeight
        : (naturalSize?.height ?? 0);
    const hasDimensions = resolvedWidth > 0 && resolvedHeight > 0;
    const cropData = element.cropData ?? { x: 0, y: 0, zoom: 1 };
    const coverScale = hasDimensions
      ? getCoverScale(resolvedWidth, resolvedHeight, position.width, position.height)
      : 1;
    const scaledWidth = hasDimensions ? resolvedWidth * coverScale * cropData.zoom : position.width;
    const scaledHeight = hasDimensions
      ? resolvedHeight * coverScale * cropData.zoom
      : position.height;
    const imageStyle: React.CSSProperties = hasDimensions
      ? {
          width: scaledWidth,
          height: scaledHeight,
          left: "50%",
          top: "50%",
          transform: `translate(-50%, -50%) translate(${cropData.x}px, ${cropData.y}px)`,
        }
      : {};

    return (
      <div
        className={cn(
          "absolute cursor-pointer overflow-hidden rounded-sm border border-sepia/30 bg-parchment/70 sepia-vintage vintage-shadow",
          isSelected && "ring-2 ring-gold/70 ring-offset-2 ring-offset-parchment/80",
          "relative",
          isResizing && "ring-2 ring-amber-500/60"
        )}
        style={baseStyle}
        onClick={(event) => {
          event.stopPropagation();
          onSelect?.(element.id);
        }}
        onDoubleClick={(event) => {
          event.stopPropagation();
          if (onImageDoubleClick && hasImage) {
            onImageDoubleClick(element);
          }
        }}
      >
        {hasVideo ? (
          <LoopingVideo
            src={element.videoUrl as string}
            className="h-full w-full object-cover sepia-vintage"
          />
        ) : hasImage ? (
          <img
            src={element.imageUrl as string}
            alt=""
            className={
              hasDimensions
                ? "absolute max-w-none sepia-vintage"
                : "h-full w-full object-cover sepia-vintage"
            }
            style={hasDimensions ? imageStyle : undefined}
            loading="lazy"
            decoding="async"
            sizes="(max-width: 640px) 90vw, (max-width: 1024px) 70vw, 50vw"
            draggable={false}
            onLoad={(event) => {
              if (hasDimensions) return;
              const target = event.currentTarget;
              if (target.naturalWidth && target.naturalHeight) {
                setNaturalSize({ width: target.naturalWidth, height: target.naturalHeight });
              }
            }}
          />
        ) : (
          <div className="flex h-full w-full items-center justify-center text-xs font-ui text-muted">
            Image pending
          </div>
        )}
        {element.videoStatus &&
        element.videoStatus !== "complete" &&
        element.videoStatus !== "none" ? (
          <div className="absolute inset-0 flex items-center justify-center bg-parchment/60 text-xs font-ui text-muted">
            Video {element.videoStatus}
          </div>
        ) : null}
        {showHandles && onResizeStart ? (
          <div className="pointer-events-none absolute inset-0">
            {(["nw", "n", "ne", "e", "se", "s", "sw", "w"] as const).map((handle) => (
              <div
                key={handle}
                className={cn(
                  "pointer-events-auto absolute h-2 w-2 rounded-full border border-parchment bg-gold shadow-sm",
                  handle === "nw" && "-left-1 -top-1 cursor-nwse-resize",
                  handle === "n" && "left-1/2 -top-1 -translate-x-1/2 cursor-ns-resize",
                  handle === "ne" && "-right-1 -top-1 cursor-nesw-resize",
                  handle === "e" && "top-1/2 -right-1 -translate-y-1/2 cursor-ew-resize",
                  handle === "se" && "-right-1 -bottom-1 cursor-nwse-resize",
                  handle === "s" && "left-1/2 -bottom-1 -translate-x-1/2 cursor-ns-resize",
                  handle === "sw" && "-left-1 -bottom-1 cursor-nesw-resize",
                  handle === "w" && "top-1/2 -left-1 -translate-y-1/2 cursor-ew-resize"
                )}
                onPointerDown={(event) => onResizeStart(event, element, handle)}
              />
            ))}
          </div>
        ) : null}
      </div>
    );
  }

  const textClass =
    element.type === "headline"
      ? "font-headline text-ink-effect text-lg"
      : element.type === "subheading"
        ? "font-subheading text-sm text-sepia"
        : "font-body text-xs text-muted";

  return (
    <div
      className={cn(
        "absolute cursor-pointer leading-snug relative",
        textClass,
        isSelected && "rounded-sm border border-gold/60 bg-cream/60 px-1 py-0.5",
        "ink-bleed",
        isResizing && "ring-2 ring-amber-500/60"
      )}
      style={baseStyle}
      onClick={(event) => {
        event.stopPropagation();
        onSelect?.(element.id);
      }}
    >
      {element.content}
      {showHandles && onResizeStart ? (
        <div className="pointer-events-none absolute inset-0">
          {(["nw", "n", "ne", "e", "se", "s", "sw", "w"] as const).map((handle) => (
            <div
              key={handle}
              className={cn(
                "pointer-events-auto absolute h-2 w-2 rounded-full border border-parchment bg-gold shadow-sm",
                handle === "nw" && "-left-1 -top-1 cursor-nwse-resize",
                handle === "n" && "left-1/2 -top-1 -translate-x-1/2 cursor-ns-resize",
                handle === "ne" && "-right-1 -top-1 cursor-nesw-resize",
                handle === "e" && "top-1/2 -right-1 -translate-y-1/2 cursor-ew-resize",
                handle === "se" && "-right-1 -bottom-1 cursor-nwse-resize",
                handle === "s" && "left-1/2 -bottom-1 -translate-x-1/2 cursor-ns-resize",
                handle === "sw" && "-left-1 -bottom-1 cursor-nesw-resize",
                handle === "w" && "top-1/2 -left-1 -translate-y-1/2 cursor-ew-resize"
              )}
              onPointerDown={(event) => onResizeStart(event, element, handle)}
            />
          ))}
        </div>
      ) : null}
    </div>
  );
}

export function Canvas({
  page,
  projectName,
  showChrome = false,
  readOnly = false,
  className,
  emptyState = "This page awaits your memories. Click to add a photograph and bring the past to life.",
  selectedElementId,
  onSelectElement,
  onClearSelection,
  onImageDoubleClick,
  enableGestures = false,
}: CanvasProps) {
  const elements = useMemo(() => page?.elements ?? [], [page]);
  const hasElements = elements.length > 0;
  const [transform, setTransform] = useState({ scale: 1, x: 0, y: 0 });
  const pointersRef = useRef(new Map<number, { x: number; y: number }>());
  const gestureRef = useRef({
    startScale: 1,
    startTranslate: { x: 0, y: 0 },
    startMid: { x: 0, y: 0 },
    startDistance: 0,
    startPointer: { x: 0, y: 0 },
  });
  const didPanRef = useRef(false);
  const gesturesActive = enableGestures || readOnly;
  const resizeStateRef = useRef<ResizeState | null>(null);
  const [resizePreview, setResizePreview] = useState<{
    elementId: string;
    position: CanvasElement["position"];
  } | null>(null);
  const resizePreviewRef = useRef<{
    elementId: string;
    position: CanvasElement["position"];
  } | null>(null);
  const [isResizing, setIsResizing] = useState(false);

  useEffect(() => {
    setTransform({ scale: 1, x: 0, y: 0 });
    pointersRef.current.clear();
    didPanRef.current = false;
    resizeStateRef.current = null;
    setResizePreview(null);
    resizePreviewRef.current = null;
    setIsResizing(false);
  }, [page?.id]);

  useEffect(() => {
    if (!isResizing) return;

    const handleMove = (event: globalThis.PointerEvent) => {
      const state = resizeStateRef.current;
      if (!state) return;
      const nextPosition = computeResize(state, { x: event.clientX, y: event.clientY });
      const nextPreview = { elementId: state.elementId, position: nextPosition };
      resizePreviewRef.current = nextPreview;
      setResizePreview(nextPreview);
    };

    const handleEnd = () => {
      const state = resizeStateRef.current;
      const preview = resizePreviewRef.current;
      resizeStateRef.current = null;
      setResizePreview(null);
      resizePreviewRef.current = null;
      setIsResizing(false);
      if (state && preview) {
        onResizeElement?.(state.elementId, preview.position);
      }
    };

    window.addEventListener("pointermove", handleMove);
    window.addEventListener("pointerup", handleEnd);
    window.addEventListener("pointercancel", handleEnd);

    return () => {
      window.removeEventListener("pointermove", handleMove);
      window.removeEventListener("pointerup", handleEnd);
      window.removeEventListener("pointercancel", handleEnd);
    };
  }, [isResizing, onResizeElement]);

  const handlePointerDown = (event: ReactPointerEvent<HTMLDivElement>) => {
    if (!gesturesActive || event.pointerType === "mouse") return;
    event.currentTarget.setPointerCapture(event.pointerId);
    pointersRef.current.set(event.pointerId, { x: event.clientX, y: event.clientY });
    didPanRef.current = false;

    if (pointersRef.current.size === 1) {
      gestureRef.current.startTranslate = { x: transform.x, y: transform.y };
      gestureRef.current.startScale = transform.scale;
      gestureRef.current.startPointer = { x: event.clientX, y: event.clientY };
    }

    if (pointersRef.current.size === 2) {
      const [first, second] = Array.from(pointersRef.current.values());
      const mid = { x: (first.x + second.x) / 2, y: (first.y + second.y) / 2 };
      const dx = second.x - first.x;
      const dy = second.y - first.y;
      gestureRef.current.startMid = mid;
      gestureRef.current.startDistance = Math.hypot(dx, dy);
      gestureRef.current.startScale = transform.scale;
      gestureRef.current.startTranslate = { x: transform.x, y: transform.y };
    }
  };

  const handlePointerMove = (event: ReactPointerEvent<HTMLDivElement>) => {
    if (!gesturesActive || event.pointerType === "mouse") return;
    if (!pointersRef.current.has(event.pointerId)) return;

    pointersRef.current.set(event.pointerId, { x: event.clientX, y: event.clientY });

    if (pointersRef.current.size === 1) {
      const start = gestureRef.current.startTranslate;
      const deltaX = event.clientX - gestureRef.current.startPointer.x;
      const deltaY = event.clientY - gestureRef.current.startPointer.y;
      if (Math.abs(deltaX) > 2 || Math.abs(deltaY) > 2) {
        didPanRef.current = true;
      }
      setTransform((prev) => ({
        scale: prev.scale,
        x: start.x + deltaX,
        y: start.y + deltaY,
      }));
    }

    if (pointersRef.current.size === 2) {
      const [first, second] = Array.from(pointersRef.current.values());
      const mid = { x: (first.x + second.x) / 2, y: (first.y + second.y) / 2 };
      const dx = second.x - first.x;
      const dy = second.y - first.y;
      const distance = Math.hypot(dx, dy);
      const start = gestureRef.current;
      if (start.startDistance <= 0) return;
      const nextScale = clamp(
        start.startScale * (distance / start.startDistance),
        MIN_SCALE,
        MAX_SCALE
      );
      const anchor = {
        x: (start.startMid.x - start.startTranslate.x) / start.startScale,
        y: (start.startMid.y - start.startTranslate.y) / start.startScale,
      };
      const nextX = mid.x - anchor.x * nextScale;
      const nextY = mid.y - anchor.y * nextScale;
      didPanRef.current = true;
      setTransform({
        scale: nextScale,
        x: nextX,
        y: nextY,
      });
    }
  };

  const handlePointerUp = (event: ReactPointerEvent<HTMLDivElement>) => {
    if (!gesturesActive || event.pointerType === "mouse") return;
    pointersRef.current.delete(event.pointerId);
    if (pointersRef.current.size < 2) {
      gestureRef.current.startTranslate = { x: transform.x, y: transform.y };
      gestureRef.current.startScale = transform.scale;
      const remaining = Array.from(pointersRef.current.values())[0];
      if (remaining) {
        gestureRef.current.startPointer = { x: remaining.x, y: remaining.y };
      }
    }
  };

  const handleSelectElement = (elementId: string) => {
    if (didPanRef.current) {
      didPanRef.current = false;
      return;
    }
    onSelectElement?.(elementId);
  };

  const handleClearSelection = () => {
    if (didPanRef.current) {
      didPanRef.current = false;
      return;
    }
    onClearSelection?.();
  };

  const handleResizeStart = (
    event: ReactPointerEvent<HTMLDivElement>,
    element: CanvasElement,
    handle: ResizeHandle
  ) => {
    if (readOnly) return;
    event.stopPropagation();
    event.preventDefault();
    didPanRef.current = false;
    event.currentTarget.setPointerCapture(event.pointerId);
    resizeStateRef.current = {
      elementId: element.id,
      handle,
      startPointer: { x: event.clientX, y: event.clientY },
      startPosition: { ...element.position },
      aspectRatio:
        element.type === "image" ? element.position.width / element.position.height : null,
      startScale: transform.scale,
      elementType: element.type,
    };
    const preview = { elementId: element.id, position: { ...element.position } };
    resizePreviewRef.current = preview;
    setResizePreview(preview);
    setIsResizing(true);
  };

  return (
    <div
      className={cn(
        "gazette-page paper-texture h-full w-full rounded-md p-4 sm:p-6",
        gesturesActive && "touch-none select-none",
        className
      )}
    >
      <div className="flex h-full flex-col gap-4">
        {showChrome ? (
          <header className="text-center">
            <div className="font-masthead text-2xl text-ink-effect sm:text-3xl">
              La Gazette de la Vie
            </div>
            <div className="mt-1 h-px w-full bg-sepia/40" />
            <div className="mt-2 flex flex-col items-center gap-1 text-xs uppercase tracking-[0.2em] text-muted">
              <span>{projectName ?? "Family Gazette"}</span>
              {page?.title ? (
                <span className="font-headline text-sm normal-case tracking-normal text-ink">
                  {page.title}
                </span>
              ) : null}
              {page?.subtitle ? <span className="tracking-normal">{page.subtitle}</span> : null}
            </div>
          </header>
        ) : null}

        <div
          className="relative flex-1 overflow-hidden"
          onClick={handleClearSelection}
          onPointerDown={handlePointerDown}
          onPointerMove={handlePointerMove}
          onPointerUp={handlePointerUp}
          onPointerCancel={handlePointerUp}
        >
          <div
            className="h-full w-full"
            style={{
              transform: `translate3d(${transform.x}px, ${transform.y}px, 0) scale(${transform.scale})`,
              transformOrigin: "top left",
            }}
          >
            {hasElements ? (
              elements.map((element) => (
                <CanvasElementView
                  key={element.id}
                  element={element}
                  isSelected={element.id === selectedElementId}
                  onSelect={handleSelectElement}
                  onImageDoubleClick={onImageDoubleClick}
                  onResizeStart={handleResizeStart}
                  showHandles={!readOnly && element.id === selectedElementId}
                  positionOverride={
                    resizePreview?.elementId === element.id ? resizePreview.position : undefined
                  }
                  isResizing={resizePreview?.elementId === element.id}
                />
              ))
            ) : (
              <div className="flex h-full items-center justify-center text-center text-sm text-muted">
                {emptyState}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
