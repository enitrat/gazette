import { useUIStore } from '@/stores/ui-store';

const ZOOM_LEVELS = [0.25, 0.33, 0.5, 0.67, 0.75, 1, 1.25, 1.5, 2, 3, 4];

export function ZoomControls() {
  const zoom = useUIStore((state) => state.zoom);
  const setZoom = useUIStore((state) => state.setZoom);
  const resetView = useUIStore((state) => state.resetView);

  const handleZoomIn = () => {
    const currentIndex = ZOOM_LEVELS.findIndex((level) => level >= zoom);
    const nextIndex = Math.min(ZOOM_LEVELS.length - 1, currentIndex + 1);
    setZoom(ZOOM_LEVELS[nextIndex]);
  };

  const handleZoomOut = () => {
    const currentIndex = ZOOM_LEVELS.findIndex((level) => level >= zoom);
    const prevIndex = Math.max(0, currentIndex - 1);
    setZoom(ZOOM_LEVELS[prevIndex]);
  };

  const handleResetZoom = () => {
    resetView();
  };

  const canZoomIn = zoom < ZOOM_LEVELS[ZOOM_LEVELS.length - 1];
  const canZoomOut = zoom > ZOOM_LEVELS[0];

  return (
    <div
      style={{
        position: 'fixed',
        bottom: '24px',
        right: '24px',
        display: 'flex',
        alignItems: 'center',
        gap: '4px',
        backgroundColor: 'white',
        border: '1px solid rgba(139, 115, 85, 0.2)',
        borderRadius: '8px',
        padding: '6px',
        boxShadow: '0 4px 12px rgba(0, 0, 0, 0.1), 0 2px 4px rgba(0, 0, 0, 0.06)',
        zIndex: 100,
        fontFamily: "'Crimson Text', serif",
      }}
    >
      {/* Zoom Out Button */}
      <button
        onClick={handleZoomOut}
        disabled={!canZoomOut}
        style={{
          width: '36px',
          height: '36px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          border: 'none',
          backgroundColor: canZoomOut ? 'transparent' : 'rgba(139, 115, 85, 0.05)',
          color: canZoomOut ? '#8b7355' : 'rgba(139, 115, 85, 0.3)',
          borderRadius: '6px',
          cursor: canZoomOut ? 'pointer' : 'not-allowed',
          fontSize: '20px',
          fontWeight: 600,
          transition: 'all 0.15s ease',
          touchAction: 'manipulation',
        }}
        onMouseEnter={(e) => {
          if (canZoomOut) {
            e.currentTarget.style.backgroundColor = 'rgba(139, 115, 85, 0.1)';
          }
        }}
        onMouseLeave={(e) => {
          if (canZoomOut) {
            e.currentTarget.style.backgroundColor = 'transparent';
          }
        }}
        aria-label="Zoom out"
      >
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor">
          <line x1="5" y1="12" x2="19" y2="12" strokeWidth="2" strokeLinecap="round" />
        </svg>
      </button>

      {/* Zoom Display */}
      <button
        onClick={handleResetZoom}
        style={{
          minWidth: '60px',
          height: '36px',
          padding: '0 12px',
          border: 'none',
          backgroundColor: 'transparent',
          color: '#8b7355',
          fontSize: '14px',
          fontWeight: 600,
          borderRadius: '6px',
          cursor: 'pointer',
          transition: 'background-color 0.15s ease',
          touchAction: 'manipulation',
        }}
        onMouseEnter={(e) => {
          e.currentTarget.style.backgroundColor = 'rgba(139, 115, 85, 0.1)';
        }}
        onMouseLeave={(e) => {
          e.currentTarget.style.backgroundColor = 'transparent';
        }}
        title="Click to reset zoom to 100%"
      >
        {Math.round(zoom * 100)}%
      </button>

      {/* Zoom In Button */}
      <button
        onClick={handleZoomIn}
        disabled={!canZoomIn}
        style={{
          width: '36px',
          height: '36px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          border: 'none',
          backgroundColor: canZoomIn ? 'transparent' : 'rgba(139, 115, 85, 0.05)',
          color: canZoomIn ? '#8b7355' : 'rgba(139, 115, 85, 0.3)',
          borderRadius: '6px',
          cursor: canZoomIn ? 'pointer' : 'not-allowed',
          fontSize: '20px',
          fontWeight: 600,
          transition: 'all 0.15s ease',
          touchAction: 'manipulation',
        }}
        onMouseEnter={(e) => {
          if (canZoomIn) {
            e.currentTarget.style.backgroundColor = 'rgba(139, 115, 85, 0.1)';
          }
        }}
        onMouseLeave={(e) => {
          if (canZoomIn) {
            e.currentTarget.style.backgroundColor = 'transparent';
          }
        }}
        aria-label="Zoom in"
      >
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor">
          <line x1="12" y1="5" x2="12" y2="19" strokeWidth="2" strokeLinecap="round" />
          <line x1="5" y1="12" x2="19" y2="12" strokeWidth="2" strokeLinecap="round" />
        </svg>
      </button>
    </div>
  );
}
