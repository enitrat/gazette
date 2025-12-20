import { CanvasViewport } from './CanvasViewport';
import { ZoomControls } from './ZoomControls';

export function Canvas() {
  return (
    <div
      style={{
        position: 'relative',
        width: '100%',
        height: '100%',
        overflow: 'hidden',
        backgroundColor: '#f5f1e8',
      }}
    >
      <CanvasViewport />
      <ZoomControls />
    </div>
  );
}
