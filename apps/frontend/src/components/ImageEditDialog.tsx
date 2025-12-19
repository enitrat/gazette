import {
  useEffect,
  useMemo,
  useRef,
  useState,
  type PointerEvent as ReactPointerEvent,
} from "react";
import { Crop, Move, ZoomIn } from "lucide-react";
import type { CanvasElement } from "@/components/Canvas";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { cn } from "@/lib/utils";

type CropData = {
  x: number;
  y: number;
  zoom: number;
};

type ImageEditDialogProps = {
  open: boolean;
  element: CanvasElement | null;
  onOpenChange: (open: boolean) => void;
  onSave: (elementId: string, cropData: CropData) => Promise<void> | void;
};

const DEFAULT_CROP: CropData = { x: 0, y: 0, zoom: 1 };
const MAX_ZOOM = 3;

const getCoverScale = (
  imageWidth: number,
  imageHeight: number,
  frameWidth: number,
  frameHeight: number
) => {
  if (imageWidth <= 0 || imageHeight <= 0 || frameWidth <= 0 || frameHeight <= 0) {
    return 1;
  }
  return Math.max(frameWidth / imageWidth, frameHeight / imageHeight);
};

const clamp = (value: number, min: number, max: number) => Math.min(max, Math.max(min, value));

const getFitZoom = (
  imageWidth: number,
  imageHeight: number,
  frameWidth: number,
  frameHeight: number
) => {
  if (imageWidth <= 0 || imageHeight <= 0 || frameWidth <= 0 || frameHeight <= 0) {
    return 1;
  }
  const coverScale = getCoverScale(imageWidth, imageHeight, frameWidth, frameHeight);
  const containScale = Math.min(frameWidth / imageWidth, frameHeight / imageHeight);
  return containScale / coverScale;
};

const clampCrop = (
  crop: CropData,
  frameSize: { width: number; height: number },
  imageSize: { width: number; height: number }
) => {
  const coverScale = getCoverScale(
    imageSize.width,
    imageSize.height,
    frameSize.width,
    frameSize.height
  );
  const fitZoom = getFitZoom(imageSize.width, imageSize.height, frameSize.width, frameSize.height);
  const minZoom = Math.max(0.1, fitZoom);
  const zoom = clamp(crop.zoom, minZoom, MAX_ZOOM);
  const scaledWidth = imageSize.width * coverScale * zoom;
  const scaledHeight = imageSize.height * coverScale * zoom;
  const maxX = Math.max(0, (scaledWidth - frameSize.width) / 2);
  const maxY = Math.max(0, (scaledHeight - frameSize.height) / 2);

  return {
    x: clamp(crop.x, -maxX, maxX),
    y: clamp(crop.y, -maxY, maxY),
    zoom,
  };
};

export function ImageEditDialog({ open, element, onOpenChange, onSave }: ImageEditDialogProps) {
  const frameRef = useRef<HTMLDivElement | null>(null);
  const dragRef = useRef<{
    pointerId: number;
    startX: number;
    startY: number;
    startCrop: CropData;
  } | null>(null);
  const initializedRef = useRef<string | null>(null);

  const [frameSize, setFrameSize] = useState({ width: 0, height: 0 });
  const [imageSize, setImageSize] = useState({ width: 0, height: 0 });
  const [crop, setCrop] = useState<CropData>(DEFAULT_CROP);
  const [isDragging, setIsDragging] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const imageUrl = element?.imageUrl ?? null;
  const resolvedImageWidth = element?.imageWidth ?? imageSize.width;
  const resolvedImageHeight = element?.imageHeight ?? imageSize.height;

  const hasImage = Boolean(imageUrl);
  const hasDimensions = resolvedImageWidth > 0 && resolvedImageHeight > 0;

  const fitZoom = useMemo(
    () => getFitZoom(resolvedImageWidth, resolvedImageHeight, frameSize.width, frameSize.height),
    [resolvedImageWidth, resolvedImageHeight, frameSize.width, frameSize.height]
  );
  const minZoom = Math.max(0.1, fitZoom);

  const coverScale = useMemo(
    () => getCoverScale(resolvedImageWidth, resolvedImageHeight, frameSize.width, frameSize.height),
    [resolvedImageWidth, resolvedImageHeight, frameSize.width, frameSize.height]
  );

  const scaledSize = useMemo(
    () => ({
      width: resolvedImageWidth * coverScale * crop.zoom,
      height: resolvedImageHeight * coverScale * crop.zoom,
    }),
    [resolvedImageWidth, resolvedImageHeight, coverScale, crop.zoom]
  );

  useEffect(() => {
    if (!open) {
      setCrop(DEFAULT_CROP);
      setImageSize({ width: 0, height: 0 });
      setFrameSize({ width: 0, height: 0 });
      setIsDragging(false);
      setIsSaving(false);
      setErrorMessage(null);
      initializedRef.current = null;
      return;
    }
    setErrorMessage(null);
  }, [open]);

  useEffect(() => {
    if (!open) return;
    initializedRef.current = null;
    setCrop(DEFAULT_CROP);
    setImageSize({ width: 0, height: 0 });
  }, [open, element?.id]);

  useEffect(() => {
    if (!open || !imageUrl || (element?.imageWidth && element?.imageHeight)) {
      return;
    }

    let cancelled = false;
    const img = new Image();
    img.onload = () => {
      if (cancelled) return;
      setImageSize({ width: img.naturalWidth, height: img.naturalHeight });
    };
    img.src = imageUrl;

    return () => {
      cancelled = true;
    };
  }, [open, imageUrl, element?.imageWidth, element?.imageHeight]);

  useEffect(() => {
    if (!open || !frameRef.current) return;
    const node = frameRef.current;
    const update = () => {
      setFrameSize({ width: node.clientWidth, height: node.clientHeight });
    };
    update();
    const observer = new ResizeObserver(update);
    observer.observe(node);
    return () => observer.disconnect();
  }, [open, element?.id]);

  useEffect(() => {
    if (!open || !hasDimensions || frameSize.width <= 0 || frameSize.height <= 0) return;
    const elementId = element?.id ?? "unknown";
    if (initializedRef.current !== elementId) {
      const scale = element?.position.width ? frameSize.width / element.position.width : 1;
      const baseCrop = element?.cropData ?? DEFAULT_CROP;
      setCrop(
        clampCrop(
          {
            x: baseCrop.x * scale,
            y: baseCrop.y * scale,
            zoom: baseCrop.zoom,
          },
          frameSize,
          { width: resolvedImageWidth, height: resolvedImageHeight }
        )
      );
      initializedRef.current = elementId;
      return;
    }
    setCrop((prev) =>
      clampCrop(prev, frameSize, { width: resolvedImageWidth, height: resolvedImageHeight })
    );
  }, [
    open,
    hasDimensions,
    frameSize.width,
    frameSize.height,
    resolvedImageWidth,
    resolvedImageHeight,
    element?.id,
    element?.position.width,
    element?.cropData,
  ]);

  const handlePointerDown = (event: ReactPointerEvent<HTMLDivElement>) => {
    if (!hasImage || !hasDimensions) return;
    event.preventDefault();
    const target = event.currentTarget;
    target.setPointerCapture(event.pointerId);
    dragRef.current = {
      pointerId: event.pointerId,
      startX: event.clientX,
      startY: event.clientY,
      startCrop: crop,
    };
    setIsDragging(true);
  };

  const handlePointerMove = (event: ReactPointerEvent<HTMLDivElement>) => {
    const dragState = dragRef.current;
    if (!dragState || dragState.pointerId !== event.pointerId) return;
    event.preventDefault();
    const nextCrop = {
      ...dragState.startCrop,
      x: dragState.startCrop.x + (event.clientX - dragState.startX),
      y: dragState.startCrop.y + (event.clientY - dragState.startY),
    };
    setCrop(
      clampCrop(nextCrop, frameSize, { width: resolvedImageWidth, height: resolvedImageHeight })
    );
  };

  const handlePointerUp = (event: ReactPointerEvent<HTMLDivElement>) => {
    const dragState = dragRef.current;
    if (!dragState || dragState.pointerId !== event.pointerId) return;
    event.preventDefault();
    dragRef.current = null;
    setIsDragging(false);
  };

  const handleZoomChange = (value: number) => {
    const nextCrop = { ...crop, zoom: value };
    setCrop(
      clampCrop(nextCrop, frameSize, { width: resolvedImageWidth, height: resolvedImageHeight })
    );
  };

  const applyFit = () => {
    const nextCrop = { x: 0, y: 0, zoom: fitZoom || 1 };
    setCrop(
      clampCrop(nextCrop, frameSize, { width: resolvedImageWidth, height: resolvedImageHeight })
    );
  };

  const applyFill = () => {
    const nextCrop = { x: 0, y: 0, zoom: 1 };
    setCrop(
      clampCrop(nextCrop, frameSize, { width: resolvedImageWidth, height: resolvedImageHeight })
    );
  };

  const handleSave = async () => {
    if (!element?.id) return;
    setIsSaving(true);
    setErrorMessage(null);
    try {
      const normalized = clampCrop(crop, frameSize, {
        width: resolvedImageWidth,
        height: resolvedImageHeight,
      });
      const scaleToElement = frameSize.width
        ? (element.position.width ?? frameSize.width) / frameSize.width
        : 1;
      await onSave(element.id, {
        x: normalized.x * scaleToElement,
        y: normalized.y * scaleToElement,
        zoom: normalized.zoom,
      });
      onOpenChange(false);
    } catch (error) {
      setErrorMessage(error instanceof Error ? error.message : "Unable to save changes.");
    } finally {
      setIsSaving(false);
    }
  };

  const zoomPercent = Math.round((crop.zoom || 1) * 100);
  const canEdit = hasImage && hasDimensions && frameSize.width > 0 && frameSize.height > 0;
  const previewStyle: React.CSSProperties = hasDimensions
    ? {
        width: scaledSize.width,
        height: scaledSize.height,
        left: "50%",
        top: "50%",
        transform: `translate(-50%, -50%) translate(${crop.x}px, ${crop.y}px)`,
      }
    : {};

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl border-sepia/30 bg-parchment">
        <DialogHeader>
          <DialogTitle className="text-ink-effect">Adjust Image</DialogTitle>
          <DialogDescription>
            Drag to reposition and zoom to keep the focus inside the frame.
          </DialogDescription>
        </DialogHeader>

        <div className="grid gap-6 lg:grid-cols-[minmax(0,1.35fr)_minmax(0,0.65fr)]">
          <div className="space-y-3">
            <div
              ref={frameRef}
              className={cn(
                "relative w-full overflow-hidden rounded-sm border border-sepia/40 bg-cream/70",
                isDragging ? "cursor-grabbing" : "cursor-grab",
                !canEdit && "cursor-default"
              )}
              style={{
                aspectRatio: `${element?.position.width ?? 4} / ${element?.position.height ?? 3}`,
              }}
              onPointerDown={handlePointerDown}
              onPointerMove={handlePointerMove}
              onPointerUp={handlePointerUp}
              onPointerLeave={handlePointerUp}
            >
              {hasImage ? (
                <img
                  src={imageUrl as string}
                  alt=""
                  className={cn(
                    "select-none",
                    canEdit ? "absolute max-w-none" : "h-full w-full object-cover",
                    !canEdit && "opacity-80"
                  )}
                  draggable={false}
                  style={canEdit ? previewStyle : undefined}
                />
              ) : (
                <div className="flex h-full w-full items-center justify-center text-sm text-muted">
                  No image selected.
                </div>
              )}

              {canEdit ? (
                <div className="pointer-events-none absolute inset-0 border border-white/40">
                  <div className="absolute left-1/2 top-0 h-full w-px -translate-x-1/2 bg-white/30" />
                  <div className="absolute top-1/2 h-px w-full -translate-y-1/2 bg-white/30" />
                </div>
              ) : null}
            </div>

            <div className="flex flex-wrap items-center gap-2 text-xs font-ui text-muted">
              <span className="inline-flex items-center gap-1 rounded-full border border-sepia/30 bg-cream/80 px-2 py-1">
                <Move className="h-3.5 w-3.5" />
                Drag to reposition
              </span>
              <span className="inline-flex items-center gap-1 rounded-full border border-sepia/30 bg-cream/80 px-2 py-1">
                <ZoomIn className="h-3.5 w-3.5" />
                Zoom to reframe
              </span>
              <span className="inline-flex items-center gap-1 rounded-full border border-sepia/30 bg-cream/80 px-2 py-1">
                <Crop className="h-3.5 w-3.5" />
                {zoomPercent}% zoom
              </span>
            </div>
          </div>

          <div className="space-y-4 rounded-md border border-sepia/20 bg-cream/70 p-4">
            <div>
              <h4 className="text-sm font-semibold text-ink">Frame options</h4>
              <p className="text-xs text-muted">
                Choose how the image should fill the frame before fine-tuning.
              </p>
            </div>

            <div className="flex flex-wrap gap-2">
              <Button type="button" variant="outline" onClick={applyFit} disabled={!canEdit}>
                Fit
              </Button>
              <Button type="button" variant="outline" onClick={applyFill} disabled={!canEdit}>
                Fill
              </Button>
            </div>

            <div className="space-y-2">
              <div className="flex items-center justify-between text-xs text-muted">
                <span>Zoom</span>
                <span>{zoomPercent}%</span>
              </div>
              <input
                type="range"
                min={minZoom}
                max={MAX_ZOOM}
                step={0.01}
                value={crop.zoom}
                onChange={(event) => handleZoomChange(Number(event.target.value))}
                className="w-full accent-gold"
                disabled={!canEdit}
              />
              <div className="flex items-center justify-between text-[11px] text-muted">
                <span>Fit</span>
                <span>Fill</span>
              </div>
            </div>

            {errorMessage ? (
              <div className="rounded-sm border border-aged-red/40 bg-aged-red/10 p-3 text-xs text-aged-red">
                {errorMessage}
              </div>
            ) : null}
          </div>
        </div>

        <DialogFooter className="sm:justify-between">
          <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button type="button" onClick={handleSave} disabled={!canEdit || isSaving}>
            {isSaving ? "Saving..." : "Apply changes"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
