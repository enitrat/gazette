import { useEffect, useState, useMemo } from "react";
import { useShallow } from "zustand/shallow";
import { Loader2 } from "lucide-react";
import api, { type SerializedElement, videos } from "@/lib/api";
import { useElementsStore } from "@/stores/elements-store";
import {
  CANVAS,
  GAZETTE_COLORS,
  getPageFrameInlineStyle,
  getPageRuleInlineStyle,
  getMergedTextStyle,
  getImageCropInlineStyle,
  textStyleToInlineStyle,
  type TextElementTypeKey,
} from "@gazette/shared";

interface PagePreviewProps {
  pageId: string;
  containerWidth: number;
}

export function PagePreview({ pageId, containerWidth }: PagePreviewProps) {
  const [elements, setElements] = useState<SerializedElement[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Also subscribe to the main store to get live updates when this page is being edited
  const storeElements = useElementsStore(useShallow((state) => state.elements));

  // Check if the main store has elements for this page (meaning it's the active page)
  const storeElementsForPage = useMemo(
    () => storeElements.filter((el) => el.pageId === pageId),
    [storeElements, pageId]
  );

  // Use store elements if available (live updates), otherwise use fetched elements
  const displayElements = storeElementsForPage.length > 0 ? storeElementsForPage : elements;

  // Fetch elements for this page on mount
  useEffect(() => {
    let cancelled = false;

    const fetchElements = async () => {
      try {
        const fetchedElements = await api.elements.list(pageId);
        if (!cancelled) {
          setElements(fetchedElements);
          setIsLoading(false);
        }
      } catch (error) {
        console.error("Failed to fetch preview elements:", error);
        if (!cancelled) {
          setIsLoading(false);
        }
      }
    };

    fetchElements();

    return () => {
      cancelled = true;
    };
  }, [pageId]);

  // Calculate scale factor to fit the page in the container
  const scale = containerWidth / CANVAS.WIDTH;
  const scaledHeight = CANVAS.HEIGHT * scale;

  if (isLoading && displayElements.length === 0) {
    return (
      <div className="flex h-full w-full items-center justify-center">
        <Loader2 className="h-4 w-4 animate-spin text-sepia/30" />
      </div>
    );
  }

  return (
    <div
      style={{
        width: containerWidth,
        height: scaledHeight,
        overflow: "hidden",
        pointerEvents: "none",
      }}
    >
      <div
        className="origin-top-left"
        style={{
          width: CANVAS.WIDTH,
          height: CANVAS.HEIGHT,
          transform: `scale(${scale})`,
        }}
      >
        {/* Page frame */}
        <div style={getPageFrameInlineStyle()}>
          {/* Newspaper borders */}
          <div style={getPageRuleInlineStyle("outer")} />
          <div style={getPageRuleInlineStyle("inner")} />

          {/* Elements */}
          {displayElements.map((element) => (
            <PreviewElement key={element.id} element={element} />
          ))}

          {/* Empty state */}
          {displayElements.length === 0 && (
            <div
              style={{
                position: "absolute",
                inset: 0,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              <div
                style={{
                  textAlign: "center",
                  color: GAZETTE_COLORS.muted,
                }}
              >
                <div
                  style={{
                    fontFamily: "'Playfair Display', serif",
                    fontSize: "28px",
                    fontWeight: 700,
                    letterSpacing: "-0.02em",
                    textTransform: "uppercase",
                  }}
                >
                  La Gazette
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

// Simplified element renderer for preview (no interactivity)
function PreviewElement({ element }: { element: SerializedElement }) {
  const renderContent = () => {
    if (element.type === "image") {
      const hasVideo = element.videoStatus === "complete" && element.videoUrl;

      return (
        <div className="h-full w-full overflow-hidden rounded-sm">
          {hasVideo ? (
            // Show first frame of video as static image
            <video
              src={videos.getUrl(element.videoUrl ?? null)}
              className="h-full w-full object-cover"
              muted
              playsInline
            />
          ) : element.imageId ? (
            <img
              src={api.images.getUrl(element.imageUrl ?? null)}
              alt=""
              className="h-full w-full object-cover"
              style={getImageCropInlineStyle(element.cropData)}
              draggable={false}
            />
          ) : (
            <div className="flex h-full w-full items-center justify-center bg-gradient-to-br from-[#e8dcc0] to-[#d4c4a0]" />
          )}
        </div>
      );
    }

    // Text elements
    const mergedStyle = getMergedTextStyle(element.type as TextElementTypeKey, element.style);
    const inlineStyle = textStyleToInlineStyle(mergedStyle);

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
        {element.content || ""}
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
      }}
    >
      {renderContent()}
    </div>
  );
}
