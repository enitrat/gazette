import { useMemo, useEffect } from "react";
import { useShallow } from "zustand/shallow";
import { useDroppable } from "@dnd-kit/core";
import { Loader2 } from "lucide-react";
import { useElementsStore } from "@/stores/elements-store";
import { CanvasElement } from "./CanvasElement";
import { CANVAS, GAZETTE_COLORS } from "@gazette/shared";

interface GazettePageProps {
  pageId: string;
}

export function GazettePage({ pageId }: GazettePageProps) {
  const allElements = useElementsStore(useShallow((state) => state.elements));
  const isLoading = useElementsStore((state) => state.isLoading);
  const fetchElements = useElementsStore((state) => state.fetchElements);
  const clearSelection = useElementsStore((state) => state.clearSelection);

  // Set up droppable zone for this page
  const { setNodeRef, isOver } = useDroppable({
    id: `page-${pageId}`,
    data: { pageId },
  });

  // Fetch elements when page changes
  useEffect(() => {
    fetchElements(pageId);
  }, [pageId, fetchElements]);

  // Filter elements for this page - memoized to prevent unnecessary re-renders
  const elements = useMemo(
    () => allElements.filter((el) => el.pageId === pageId),
    [allElements, pageId]
  );

  const handleClick = () => {
    clearSelection();
  };

  return (
    <div
      ref={setNodeRef}
      className="gazette-page"
      onClick={handleClick}
      style={{
        position: "relative",
        width: `${CANVAS.WIDTH}px`,
        height: `${CANVAS.HEIGHT}px`,
        backgroundColor: GAZETTE_COLORS.paper,
        boxShadow: "0 1px 3px rgba(0, 0, 0, 0.08), 0 8px 30px rgba(0, 0, 0, 0.12)",
        overflow: "hidden",
        isolation: "isolate",
        transition: "box-shadow 0.2s ease, transform 0.2s ease",
        ...(isOver && {
          boxShadow:
            "0 1px 3px rgba(0, 0, 0, 0.1), 0 12px 40px rgba(0, 0, 0, 0.18), inset 0 0 0 2px #121212",
          transform: "scale(1.005)",
        }),
      }}
    >
      {/* Elegant newspaper border - thin rule */}
      <div
        style={{
          position: "absolute",
          inset: "24px",
          border: `1px solid ${GAZETTE_COLORS.rule}`,
          pointerEvents: "none",
        }}
      />

      {/* Inner double-rule for classic newspaper feel */}
      <div
        style={{
          position: "absolute",
          inset: "28px",
          border: `0.5px solid ${GAZETTE_COLORS.border}`,
          pointerEvents: "none",
        }}
      />

      {/* Loading State */}
      {isLoading && (
        <div
          style={{
            position: "absolute",
            inset: 0,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            backgroundColor: "rgba(255, 255, 255, 0.9)",
            backdropFilter: "blur(4px)",
            zIndex: 10,
          }}
        >
          <div
            style={{
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              gap: "12px",
            }}
          >
            <Loader2
              className="animate-spin"
              style={{
                width: "24px",
                height: "24px",
                color: GAZETTE_COLORS.caption,
              }}
            />
            <div
              style={{
                fontFamily: "'EB Garamond', Georgia, serif",
                fontSize: "13px",
                color: GAZETTE_COLORS.caption,
                letterSpacing: "0.02em",
              }}
            >
              Chargement...
            </div>
          </div>
        </div>
      )}

      {/* Elements */}
      <div
        style={{
          position: "absolute",
          inset: 0,
        }}
      >
        {elements.map((element) => (
          <CanvasElement key={element.id} element={element} />
        ))}
      </div>

      {/* Empty state */}
      {elements.length === 0 && !isLoading && (
        <div
          style={{
            position: "absolute",
            inset: 0,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            pointerEvents: "none",
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
                marginBottom: "8px",
                letterSpacing: "-0.02em",
                textTransform: "uppercase",
              }}
            >
              La Gazette
            </div>
            <div
              style={{
                width: "60px",
                height: "1px",
                backgroundColor: GAZETTE_COLORS.rule,
                margin: "12px auto",
              }}
            />
            <div
              style={{
                fontFamily: "'EB Garamond', Georgia, serif",
                fontSize: "14px",
                fontStyle: "italic",
              }}
            >
              Glissez des éléments depuis la barre latérale
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
