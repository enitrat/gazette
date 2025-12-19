import { Minus, ZoomIn } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

type ZoomControlsProps = {
  zoom: number;
  onZoomIn: () => void;
  onZoomOut: () => void;
  className?: string;
};

export function ZoomControls({ zoom, onZoomIn, onZoomOut, className }: ZoomControlsProps) {
  const percent = Math.round(zoom * 100);

  return (
    <div
      className={cn(
        "flex flex-col items-center gap-1 rounded-lg border border-sepia/20 bg-white/95 p-2 shadow-md",
        className
      )}
    >
      <Button
        type="button"
        variant="ghost"
        size="icon"
        className="h-8 w-8"
        onClick={onZoomIn}
        aria-label="Zoom in"
        title="Zoom in"
      >
        <ZoomIn className="h-4 w-4" />
      </Button>
      <div className="min-w-[52px] text-center font-ui text-xs text-ink">{percent}%</div>
      <Button
        type="button"
        variant="ghost"
        size="icon"
        className="h-8 w-8"
        onClick={onZoomOut}
        aria-label="Zoom out"
        title="Zoom out"
      >
        <Minus className="h-4 w-4" />
      </Button>
    </div>
  );
}
