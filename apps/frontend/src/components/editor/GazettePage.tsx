import { useMemo, useEffect } from 'react';
import { useShallow } from 'zustand/shallow';
import { useDroppable } from '@dnd-kit/core';
import { Loader2 } from 'lucide-react';
import { useElementsStore } from '@/stores/elements-store';
import { CanvasElement } from './CanvasElement';
import { CANVAS, GAZETTE_COLORS } from '@gazette/shared';

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
        position: 'relative',
        width: `${CANVAS.WIDTH}px`,
        height: `${CANVAS.HEIGHT}px`,
        backgroundColor: GAZETTE_COLORS.parchment,
        boxShadow:
          '0 10px 40px rgba(0, 0, 0, 0.15), 0 2px 8px rgba(0, 0, 0, 0.08), inset 0 1px 0 rgba(255, 255, 255, 0.4)',
        overflow: 'hidden',
        isolation: 'isolate',
        transition: 'box-shadow 0.2s ease, transform 0.2s ease',
        ...(isOver && {
          boxShadow: '0 10px 40px rgba(201, 162, 39, 0.3), 0 2px 8px rgba(201, 162, 39, 0.2), inset 0 0 0 2px rgba(201, 162, 39, 0.4)',
          transform: 'scale(1.01)',
        }),
      }}
    >
      {/* Paper texture overlay */}
      <div
        style={{
          position: 'absolute',
          inset: 0,
          backgroundImage: `
            repeating-linear-gradient(
              0deg,
              rgba(139, 115, 85, 0.01) 0px,
              transparent 1px,
              transparent 2px,
              rgba(139, 115, 85, 0.01) 3px
            ),
            repeating-linear-gradient(
              90deg,
              rgba(139, 115, 85, 0.01) 0px,
              transparent 1px,
              transparent 2px,
              rgba(139, 115, 85, 0.01) 3px
            )
          `,
          pointerEvents: 'none',
          opacity: 0.4,
        }}
      />

      {/* Vignette effect */}
      <div
        style={{
          position: 'absolute',
          inset: 0,
          background: `radial-gradient(ellipse at center, transparent 0%, transparent 50%, ${GAZETTE_COLORS.muted}1f 100%)`,
          pointerEvents: 'none',
        }}
      />

      {/* Subtle aging effect around edges */}
      <div
        style={{
          position: 'absolute',
          inset: 0,
          boxShadow: `inset 0 0 80px ${GAZETTE_COLORS.muted}14`,
          pointerEvents: 'none',
        }}
      />

      {/* Border decoration */}
      <div
        style={{
          position: 'absolute',
          inset: '20px',
          border: `1px solid ${GAZETTE_COLORS.muted}26`,
          borderRadius: '2px',
          pointerEvents: 'none',
        }}
      />

      {/* Loading State */}
      {isLoading && (
        <div
          style={{
            position: 'absolute',
            inset: 0,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            backgroundColor: 'rgba(244, 228, 188, 0.8)',
            backdropFilter: 'blur(4px)',
            zIndex: 10,
          }}
        >
          <div
            style={{
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              gap: '12px',
            }}
          >
            <Loader2
              className="animate-spin"
              style={{
                width: '32px',
                height: '32px',
                color: '#8b7355',
                opacity: 0.6,
              }}
            />
            <div
              style={{
                fontFamily: "'Crimson Text', serif",
                fontSize: '14px',
                color: '#8b7355',
                opacity: 0.7,
              }}
            >
              Loading elements...
            </div>
          </div>
        </div>
      )}

      {/* Elements */}
      <div
        style={{
          position: 'absolute',
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
            position: 'absolute',
            inset: 0,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            pointerEvents: 'none',
          }}
        >
          <div
            style={{
              textAlign: 'center',
              color: '#8b7355',
              opacity: 0.4,
            }}
          >
            <div
              style={{
                fontFamily: "'Playfair Display', serif",
                fontSize: '24px',
                fontWeight: 600,
                marginBottom: '8px',
                letterSpacing: '0.02em',
              }}
            >
              La Gazette de la Vie
            </div>
            <div
              style={{
                fontFamily: "'Crimson Text', serif",
                fontSize: '16px',
                fontStyle: 'italic',
              }}
            >
              Click to add elements from the toolbar
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
