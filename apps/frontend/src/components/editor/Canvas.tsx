import { CanvasViewport } from "./CanvasViewport";
import { ZoomControls } from "./ZoomControls";
import { GAZETTE_COLORS } from "@gazette/shared";

export function Canvas() {
  return (
    <div
      style={{
        position: "relative",
        width: "100%",
        height: "100%",
        overflow: "hidden",
        backgroundColor: GAZETTE_COLORS.canvas,
      }}
    >
      <CanvasViewport />
      <ZoomControls />
    </div>
  );
}
