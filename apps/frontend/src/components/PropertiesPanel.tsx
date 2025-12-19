import { useEffect, useMemo, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { cn } from "@/lib/utils";
import { useElementsStore } from "@/stores/elements-store";
import type { CanvasElement } from "@/types/editor";

const GRID_SIZE = 10;
const MIN_TEXT_SIZE = 40;
const MIN_IMAGE_SIZE = 80;

const ELEMENT_LABELS: Record<CanvasElement["type"], string> = {
  image: "Image",
  headline: "Headline",
  subheading: "Subheading",
  caption: "Caption",
};

const clamp = (value: number, min: number) => Math.max(value, min);

const snapValue = (value: number) => Math.round(value / GRID_SIZE) * GRID_SIZE;

const toNumber = (value: string, fallback: number) => {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : fallback;
};

type PropertiesPanelProps = {
  pageId?: string | null;
  elements: CanvasElement[];
  onEditImage?: (element: CanvasElement) => void;
  className?: string;
};

export function PropertiesPanel({
  pageId,
  elements,
  onEditImage,
  className,
}: PropertiesPanelProps) {
  const selectedElementId = useElementsStore((state) => state.selectedElementId);
  const updateElement = useElementsStore((state) => state.updateElement);
  const reorderElement = useElementsStore((state) => state.reorderElement);
  const [snapToGrid, setSnapToGrid] = useState(true);
  const [lockAspectRatio, setLockAspectRatio] = useState(true);

  const selectedElement = useMemo(
    () => elements.find((element) => element.id === selectedElementId) ?? null,
    [elements, selectedElementId]
  );

  useEffect(() => {
    if (!selectedElement) return;
    if (selectedElement.type !== "image") {
      setLockAspectRatio(false);
    }
  }, [selectedElement]);

  const elementIndex = useMemo(() => {
    if (!selectedElement) return -1;
    return elements.findIndex((element) => element.id === selectedElement.id);
  }, [elements, selectedElement]);

  const handlePositionChange = (field: "x" | "y", value: number) => {
    if (!selectedElement || !pageId) return;
    const position = selectedElement.position;
    const nextValue = snapToGrid ? snapValue(value) : value;
    updateElement(pageId, selectedElement.id, {
      position: {
        ...position,
        [field]: nextValue,
      },
    });
  };

  const handleSizeChange = (field: "width" | "height", value: number) => {
    if (!selectedElement || !pageId) return;
    const position = selectedElement.position;
    const minSize = selectedElement.type === "image" ? MIN_IMAGE_SIZE : MIN_TEXT_SIZE;
    const ratio = position.height > 0 ? position.width / position.height : 1;
    let nextWidth = field === "width" ? value : position.width;
    let nextHeight = field === "height" ? value : position.height;

    if (lockAspectRatio && ratio > 0) {
      if (field === "width") {
        nextHeight = nextWidth / ratio;
      } else {
        nextWidth = nextHeight * ratio;
      }
    }

    if (snapToGrid) {
      nextWidth = snapValue(nextWidth);
      nextHeight = snapValue(nextHeight);
    }

    nextWidth = clamp(nextWidth, minSize);
    nextHeight = clamp(nextHeight, minSize);

    updateElement(pageId, selectedElement.id, {
      position: {
        ...position,
        width: nextWidth,
        height: nextHeight,
      },
    });
  };

  const handleContentChange = (value: string) => {
    if (!selectedElement || !pageId) return;
    updateElement(pageId, selectedElement.id, { content: value });
  };

  if (!selectedElement) {
    return (
      <aside
        className={cn(
          "editor-properties hidden w-72 border-l border-sepia/20 bg-parchment p-4 lg:block",
          className
        )}
      >
        <h3 className="mb-4 font-headline text-ink-effect">Properties</h3>
        <hr className="divider-vintage" />
        <p className="font-ui text-sm text-muted">Select an element to edit its properties</p>
      </aside>
    );
  }

  const label = ELEMENT_LABELS[selectedElement.type];
  const isImage = selectedElement.type === "image";
  const position = selectedElement.position;
  const canSendBackward = elementIndex > 0;
  const canBringForward = elementIndex >= 0 && elementIndex < elements.length - 1;

  return (
    <aside
      className={cn(
        "editor-properties hidden w-72 border-l border-sepia/20 bg-parchment p-4 lg:block",
        className
      )}
    >
      <div className="mb-4">
        <h3 className="font-headline text-ink-effect">{label} Properties</h3>
        <p className="font-ui text-xs text-muted">Selected: {label}</p>
      </div>
      <hr className="divider-vintage" />

      <div className="mt-4 space-y-4">
        <section className="space-y-2">
          <div className="flex items-center justify-between">
            <h4 className="font-ui text-xs font-semibold uppercase tracking-[0.2em] text-muted">
              Position
            </h4>
          </div>
          <div className="grid grid-cols-2 gap-2">
            <div className="space-y-1">
              <Label htmlFor="position-x">X</Label>
              <Input
                id="position-x"
                type="number"
                step={GRID_SIZE}
                value={Math.round(position.x)}
                onChange={(event) =>
                  handlePositionChange("x", toNumber(event.target.value, position.x))
                }
              />
            </div>
            <div className="space-y-1">
              <Label htmlFor="position-y">Y</Label>
              <Input
                id="position-y"
                type="number"
                step={GRID_SIZE}
                value={Math.round(position.y)}
                onChange={(event) =>
                  handlePositionChange("y", toNumber(event.target.value, position.y))
                }
              />
            </div>
          </div>
          <label className="flex items-center gap-2 text-xs font-ui text-muted">
            <input
              type="checkbox"
              className="h-3 w-3 accent-gold"
              checked={snapToGrid}
              onChange={(event) => setSnapToGrid(event.target.checked)}
            />
            Snap to grid ({GRID_SIZE}px)
          </label>
        </section>

        <section className="space-y-2">
          <h4 className="font-ui text-xs font-semibold uppercase tracking-[0.2em] text-muted">
            Size
          </h4>
          <div className="grid grid-cols-2 gap-2">
            <div className="space-y-1">
              <Label htmlFor="size-width">Width</Label>
              <Input
                id="size-width"
                type="number"
                value={Math.round(position.width)}
                onChange={(event) =>
                  handleSizeChange("width", toNumber(event.target.value, position.width))
                }
              />
            </div>
            <div className="space-y-1">
              <Label htmlFor="size-height">Height</Label>
              <Input
                id="size-height"
                type="number"
                value={Math.round(position.height)}
                onChange={(event) =>
                  handleSizeChange("height", toNumber(event.target.value, position.height))
                }
              />
            </div>
          </div>
          <label
            className={cn(
              "flex items-center gap-2 text-xs font-ui text-muted",
              !isImage && "opacity-60"
            )}
          >
            <input
              type="checkbox"
              className="h-3 w-3 accent-gold"
              checked={lockAspectRatio}
              onChange={(event) => setLockAspectRatio(event.target.checked)}
              disabled={!isImage}
            />
            Lock aspect ratio
          </label>
        </section>

        <section className="space-y-2">
          <h4 className="font-ui text-xs font-semibold uppercase tracking-[0.2em] text-muted">
            Layer
          </h4>
          <div className="flex flex-col gap-2">
            <Button
              type="button"
              variant="outline"
              size="sm"
              disabled={!canBringForward}
              onClick={() =>
                selectedElement && pageId
                  ? reorderElement(pageId, selectedElement.id, "forward")
                  : null
              }
            >
              Bring Forward
            </Button>
            <Button
              type="button"
              variant="outline"
              size="sm"
              disabled={!canSendBackward}
              onClick={() =>
                selectedElement && pageId
                  ? reorderElement(pageId, selectedElement.id, "backward")
                  : null
              }
            >
              Send Backward
            </Button>
          </div>
        </section>

        {isImage ? (
          <section className="space-y-2">
            <h4 className="font-ui text-xs font-semibold uppercase tracking-[0.2em] text-muted">
              Image
            </h4>
            <div className="flex flex-col gap-2">
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => (onEditImage ? onEditImage(selectedElement) : null)}
              >
                Edit Crop
              </Button>
            </div>
          </section>
        ) : (
          <section className="space-y-2">
            <h4 className="font-ui text-xs font-semibold uppercase tracking-[0.2em] text-muted">
              Text
            </h4>
            <div className="space-y-2">
              <Label htmlFor="text-content">Content</Label>
              <Textarea
                id="text-content"
                value={selectedElement.content ?? ""}
                onChange={(event) => handleContentChange(event.target.value)}
                rows={4}
              />
            </div>
          </section>
        )}
      </div>
    </aside>
  );
}
