import { useLayoutEffect, useMemo, useRef, useState } from "react";
import { cn } from "@/lib/utils";
import type { CanvasElement as CanvasElementType } from "@/types/editor";
import { CanvasElement } from "@/components/editor/CanvasElement";
import { ZoomControls } from "@/components/editor/ZoomControls";

type CanvasViewportProps = {
  elements: CanvasElementType[];
  selectedElementId: string | null;
  emptyState?: string;
  className?: string;
  onSelectElement: (elementId: string) => void;
  onClearSelection: () => void;
  onElementPositionChange: (elementId: string, position: CanvasElementType["position"]) => void;
  onResizeElement: (elementId: string, position: CanvasElementType["position"]) => void;
  onTextCommit: (elementId: string, content: string) => void;
  onImageDoubleClick?: (element: CanvasElementType) => void;
};

const PAGE_RATIO = 297 / 210;
const MAX_PAGE_WIDTH = 800;
const MIN_PAGE_WIDTH = 320;
const PAGE_PADDING = 40;
const MIN_ZOOM = 0.5;
const MAX_ZOOM = 2.25;
const ZOOM_STEP = 0.1;

const clampZoom = (value: number) => Math.min(MAX_ZOOM, Math.max(MIN_ZOOM, value));

export function CanvasViewport({
  elements,
  selectedElementId,
  emptyState = "This page awaits your memories.",
  className,
  onSelectElement,
  onClearSelection,
  onElementPositionChange,
  onResizeElement,
  onTextCommit,
  onImageDoubleClick,
}: CanvasViewportProps) {
  const scrollRef = useRef<HTMLDivElement | null>(null);
  const [pageWidth, setPageWidth] = useState(MAX_PAGE_WIDTH);
  const [zoom, setZoom] = useState(1);

  useLayoutEffect(() => {
    const container = scrollRef.current;
    if (!container) return;

    const updateSize = () => {
      const available = container.clientWidth - PAGE_PADDING * 2;
      const next = Math.min(MAX_PAGE_WIDTH, Math.max(MIN_PAGE_WIDTH, available));
      setPageWidth(next);
    };

    updateSize();
    const observer = new ResizeObserver(updateSize);
    observer.observe(container);

    return () => observer.disconnect();
  }, []);

  const pageHeight = useMemo(() => pageWidth * PAGE_RATIO, [pageWidth]);
  const frameWidth = pageWidth + PAGE_PADDING * 2;
  const frameHeight = pageHeight + PAGE_PADDING * 2;
  const scaledWidth = frameWidth * zoom;
  const scaledHeight = frameHeight * zoom;

  return (
    <div className={cn("relative flex-1 bg-cream/40", className)}>
      <div
        ref={scrollRef}
        className="h-full overflow-auto p-6"
        onPointerDown={() => onClearSelection()}
      >
        <div className="flex justify-center">
          <div className="relative" style={{ width: scaledWidth, height: scaledHeight }}>
            <div
              style={{
                width: frameWidth,
                height: frameHeight,
                transform: `scale(${zoom})`,
                transformOrigin: "top left",
              }}
            >
              <div
                className="paper-texture rounded-[4px] border border-sepia/30 shadow-[0_8px_32px_rgba(44,36,22,0.12)]"
                style={{
                  width: frameWidth,
                  height: frameHeight,
                  padding: PAGE_PADDING,
                  background:
                    "radial-gradient(ellipse at center, transparent 0%, rgba(92,64,51,0.15) 100%), #F4E4BC",
                }}
              >
                <div
                  className="relative mx-auto rounded-[4px] border border-sepia/30 bg-parchment"
                  style={{ width: pageWidth, height: pageHeight }}
                >
                  {elements.length === 0 ? (
                    <div className="flex h-full items-center justify-center px-6 text-center font-body text-sm text-muted">
                      {emptyState}
                    </div>
                  ) : (
                    elements.map((element) => (
                      <CanvasElement
                        key={element.id}
                        element={element}
                        isSelected={element.id === selectedElementId}
                        scale={zoom}
                        onSelect={onSelectElement}
                        onPositionCommit={onElementPositionChange}
                        onResizeCommit={onResizeElement}
                        onTextCommit={onTextCommit}
                        onImageDoubleClick={onImageDoubleClick}
                      />
                    ))
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
      <ZoomControls
        zoom={zoom}
        onZoomIn={() => setZoom((value) => clampZoom(value + ZOOM_STEP))}
        onZoomOut={() => setZoom((value) => clampZoom(value - ZOOM_STEP))}
        className="absolute bottom-6 right-6 z-10"
      />
    </div>
  );
}
