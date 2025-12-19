import { useEffect, useMemo, useState } from "react";
import { Move, Ruler, Layers, Image as ImageIcon, Type } from "lucide-react";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
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
  const previewText =
    selectedElement.content?.trim() || (isImage ? "Selected image" : `${label} text`);
  const previewImage = selectedElement.imageUrl || selectedElement.videoUrl;

  return (
    <aside
      className={cn(
        "editor-properties hidden w-72 border-l border-sepia/20 bg-parchment p-4 lg:block",
        className
      )}
    >
      <div className="mb-4 space-y-3">
        <h3 className="font-headline text-ink-effect">{label} Properties</h3>
        <p className="font-ui text-xs text-muted">Selected: {label}</p>
        <div className="rounded-sm border border-sepia/30 bg-ivory/60 p-3 shadow-sm">
          <div className="text-[10px] font-ui font-semibold uppercase tracking-[0.2em] text-muted">
            Preview
          </div>
          <div className="mt-2 flex h-16 items-center justify-center overflow-hidden rounded-sm border border-sepia/20 bg-parchment/70 p-2">
            {previewImage ? (
              <img
                src={previewImage}
                alt={`${label} preview`}
                className="h-full w-full rounded-sm object-cover"
              />
            ) : (
              <p className="text-center text-xs font-ui text-ink-effect">{previewText}</p>
            )}
          </div>
        </div>
      </div>
      <hr className="divider-vintage" />

      <Accordion
        type="multiple"
        defaultValue={["position", "size", "content"]}
        className="mt-4 space-y-1"
      >
        <AccordionItem value="position">
          <AccordionTrigger>
            <span className="flex items-center gap-2">
              <Move className="h-4 w-4 text-muted" />
              Position
            </span>
          </AccordionTrigger>
          <AccordionContent className="space-y-3 pt-2">
            <div className="grid grid-cols-2 gap-2">
              <div className="space-y-1">
                <Label htmlFor="position-x">X</Label>
                <Input
                  id="position-x"
                  className="input-vintage"
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
                  className="input-vintage"
                  type="number"
                  step={GRID_SIZE}
                  value={Math.round(position.y)}
                  onChange={(event) =>
                    handlePositionChange("y", toNumber(event.target.value, position.y))
                  }
                />
              </div>
            </div>
            <div className="flex items-center gap-2 text-xs font-ui text-muted">
              <Checkbox
                id="snap-grid"
                checked={snapToGrid}
                onCheckedChange={(checked) => setSnapToGrid(checked === true)}
                className="border-sepia data-[state=checked]:bg-gold"
              />
              <Label htmlFor="snap-grid" className="cursor-pointer text-xs font-ui text-muted">
                Snap to grid ({GRID_SIZE}px)
              </Label>
            </div>
          </AccordionContent>
        </AccordionItem>

        <AccordionItem value="size">
          <AccordionTrigger>
            <span className="flex items-center gap-2">
              <Ruler className="h-4 w-4 text-muted" />
              Size
            </span>
          </AccordionTrigger>
          <AccordionContent className="space-y-3 pt-2">
            <div className="grid grid-cols-2 gap-2">
              <div className="space-y-1">
                <Label htmlFor="size-width">Width</Label>
                <Input
                  id="size-width"
                  className="input-vintage"
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
                  className="input-vintage"
                  type="number"
                  value={Math.round(position.height)}
                  onChange={(event) =>
                    handleSizeChange("height", toNumber(event.target.value, position.height))
                  }
                />
              </div>
            </div>
            <div
              className={cn(
                "flex items-center gap-2 text-xs font-ui text-muted",
                !isImage && "opacity-60"
              )}
            >
              <Checkbox
                id="lock-aspect"
                checked={lockAspectRatio}
                onCheckedChange={(checked) => setLockAspectRatio(checked === true)}
                disabled={!isImage}
                className="border-sepia data-[state=checked]:bg-gold"
              />
              <Label htmlFor="lock-aspect" className="cursor-pointer text-xs font-ui text-muted">
                Lock aspect ratio
              </Label>
            </div>
          </AccordionContent>
        </AccordionItem>

        <AccordionItem value="layer">
          <AccordionTrigger>
            <span className="flex items-center gap-2">
              <Layers className="h-4 w-4 text-muted" />
              Layer
            </span>
          </AccordionTrigger>
          <AccordionContent className="space-y-3 pt-2">
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
          </AccordionContent>
        </AccordionItem>

        <AccordionItem value="content" className="border-b-0">
          <AccordionTrigger>
            <span className="flex items-center gap-2">
              {isImage ? (
                <ImageIcon className="h-4 w-4 text-muted" />
              ) : (
                <Type className="h-4 w-4 text-muted" />
              )}
              {isImage ? "Image" : "Text"}
            </span>
          </AccordionTrigger>
          <AccordionContent className="space-y-3 pt-2">
            {isImage ? (
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
            ) : (
              <div className="space-y-2">
                <Label htmlFor="text-content">Content</Label>
                <Textarea
                  id="text-content"
                  value={selectedElement.content ?? ""}
                  onChange={(event) => handleContentChange(event.target.value)}
                  rows={4}
                />
              </div>
            )}
          </AccordionContent>
        </AccordionItem>
      </Accordion>
    </aside>
  );
}
