import { useEffect, useRef, useState, useCallback } from 'react';
import { useUIStore } from '@/stores/ui-store';
import { usePagesStore } from '@/stores/pages-store';
import { useElementsStore } from '@/stores/elements-store';
import { GazettePage } from './GazettePage';
import { MIN_ZOOM, MAX_ZOOM } from '@/lib/constants';

export function CanvasViewport() {
  const zoom = useUIStore((state) => state.zoom);
  const setZoom = useUIStore((state) => state.setZoom);
  const currentPageId = usePagesStore((state) => state.currentPageId);
  const fetchElements = useElementsStore((state) => state.fetchElements);

  const [isPanning, setIsPanning] = useState(false);
  const [panOffset, setPanOffset] = useState({ x: 0, y: 0 });
  const [dragStart, setDragStart] = useState({ x: 0, y: 0, panX: 0, panY: 0 });
  const [spacePressed, setSpacePressed] = useState(false);
  const viewportRef = useRef<HTMLDivElement>(null);

  // Fetch elements when currentPageId changes
  useEffect(() => {
    if (currentPageId) {
      fetchElements(currentPageId);
    }
  }, [currentPageId, fetchElements]);

  // Reset pan offset when page changes
  useEffect(() => {
    setPanOffset({ x: 0, y: 0 });
  }, [currentPageId]);

  // Handle wheel zoom
  const handleWheel = useCallback((e: WheelEvent) => {
    // Only zoom with Ctrl/Cmd key
    if (e.ctrlKey || e.metaKey) {
      e.preventDefault();
      const delta = -e.deltaY;
      const zoomSpeed = 0.002;
      const newZoom = Math.max(MIN_ZOOM, Math.min(MAX_ZOOM, zoom + delta * zoomSpeed));
      setZoom(newZoom);
    }
  }, [zoom, setZoom]);

  useEffect(() => {
    const viewport = viewportRef.current;
    if (viewport) {
      viewport.addEventListener('wheel', handleWheel, { passive: false });
      return () => viewport.removeEventListener('wheel', handleWheel);
    }
  }, [handleWheel]);

  // Handle panning with spacebar + drag or middle mouse button
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Don't intercept space when editing text
      const editingId = useElementsStore.getState().editingId;
      if (editingId) return;

      if (e.code === 'Space' && !e.repeat) {
        e.preventDefault();
        setSpacePressed(true);
      }
    };

    const handleKeyUp = (e: KeyboardEvent) => {
      if (e.code === 'Space') {
        setSpacePressed(false);
        setIsPanning(false);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('keyup', handleKeyUp);

    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('keyup', handleKeyUp);
    };
  }, []);

  const handleMouseDown = useCallback((e: React.MouseEvent) => {
    // Start panning with space+click or middle mouse button
    if (spacePressed || e.button === 1) {
      e.preventDefault();
      setIsPanning(true);
      setDragStart({
        x: e.clientX,
        y: e.clientY,
        panX: panOffset.x,
        panY: panOffset.y,
      });
    }
  }, [spacePressed, panOffset]);

  const handleMouseMove = useCallback((e: React.MouseEvent) => {
    if (isPanning) {
      const deltaX = e.clientX - dragStart.x;
      const deltaY = e.clientY - dragStart.y;
      setPanOffset({
        x: dragStart.panX + deltaX,
        y: dragStart.panY + deltaY,
      });
    }
  }, [isPanning, dragStart]);

  const handleMouseUp = useCallback(() => {
    setIsPanning(false);
  }, []);

  if (!currentPageId) {
    return (
      <div className="flex h-full w-full items-center justify-center bg-[#f5f1e8]">
        <div className="text-center text-[#8b7355] font-serif">
          <div className="text-lg italic">Aucune page sélectionnée</div>
          <div className="text-sm mt-2 opacity-60">
            Sélectionnez une page dans la barre latérale pour commencer
          </div>
        </div>
      </div>
    );
  }

  return (
    <div
      ref={viewportRef}
      className="relative w-full h-full overflow-auto bg-[#f5f1e8]"
      style={{
        cursor: isPanning ? 'grabbing' : spacePressed ? 'grab' : 'default',
        userSelect: isPanning ? 'none' : 'auto',
      }}
      onMouseDown={handleMouseDown}
      onMouseMove={handleMouseMove}
      onMouseUp={handleMouseUp}
      onMouseLeave={handleMouseUp}
    >
      {/* Dot grid background */}
      <div
        className="absolute inset-0 pointer-events-none opacity-30"
        style={{
          backgroundImage: 'radial-gradient(circle, rgba(139, 115, 85, 0.15) 1px, transparent 1px)',
          backgroundSize: '20px 20px',
          backgroundPosition: `${panOffset.x % 20}px ${panOffset.y % 20}px`,
        }}
      />

      {/* Scrollable canvas area with padding */}
      <div
        className="flex items-center justify-center"
        style={{
          minHeight: '100%',
          minWidth: '100%',
          padding: '60px',
        }}
      >
        {/* Gazette page container with transform */}
        <div
          style={{
            transform: `translate(${panOffset.x}px, ${panOffset.y}px) scale(${zoom})`,
            transformOrigin: 'center center',
            transition: isPanning ? 'none' : 'transform 0.15s ease-out',
            willChange: 'transform',
          }}
        >
          <GazettePage pageId={currentPageId} />
        </div>
      </div>

      {/* Instructions overlay - bottom center */}
      <div className="absolute bottom-20 left-1/2 -translate-x-1/2 pointer-events-none">
        <div className="px-4 py-2 bg-white/90 border border-[#8b7355]/20 rounded-md shadow-sm text-xs text-[#8b7355] font-serif opacity-70">
          <kbd className="px-1.5 py-0.5 bg-[#f4e4bc] rounded text-[10px] font-mono">Espace</kbd>
          {' '}+ glisser pour déplacer •
          <kbd className="px-1.5 py-0.5 bg-[#f4e4bc] rounded text-[10px] font-mono ml-1">Ctrl</kbd>
          {' '}+ molette pour zoomer
        </div>
      </div>
    </div>
  );
}
