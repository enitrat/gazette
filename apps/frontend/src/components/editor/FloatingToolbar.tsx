import { AlignLeft, MousePointer2, RotateCcw, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { useElementsStore } from "@/stores/elements-store";
import type { CanvasElement } from "@/types/editor";
import { resolveTextStyle } from "@/lib/editor-style";

const nextAlignment = (current: "left" | "center" | "right" | "justify") => {
  if (current === "left") return "center";
  if (current === "center") return "right";
  if (current === "right") return "justify";
  return "left";
};

type FloatingToolbarProps = {
  pageId?: string | null;
  selectedElement?: CanvasElement | null;
};

export function FloatingToolbar({ pageId, selectedElement }: FloatingToolbarProps) {
  const setSelectedElementId = useElementsStore((state) => state.setSelectedElementId);
  const updateElementStyle = useElementsStore((state) => state.updateElementStyle);
  const deleteElement = useElementsStore((state) => state.deleteElement);
  const undoLastChange = useElementsStore((state) => state.undoLastChange);
  const canUndo = useElementsStore((state) =>
    pageId ? (state.historyByPage[pageId]?.length ?? 0) > 0 : false
  );

  const hasSelection = Boolean(selectedElement && pageId);
  const isText = selectedElement?.type !== "image" && selectedElement != null;

  const handleAlignCycle = () => {
    if (!pageId || !selectedElement || !isText) return;
    const resolved = resolveTextStyle(selectedElement);
    const next = nextAlignment(resolved.textAlign ?? "left");
    updateElementStyle(pageId, selectedElement.id, { textAlign: next });
  };

  const handleDelete = async () => {
    if (!pageId || !selectedElement) return;
    await deleteElement(pageId, selectedElement.id);
  };

  return (
    <TooltipProvider>
      <div className="flex flex-col gap-1 rounded-sm border border-sepia/20 bg-cream/80 p-2 shadow-sm">
        <Tooltip>
          <TooltipTrigger asChild>
            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8"
              onClick={handleAlignCycle}
              disabled={!isText}
              aria-label="Cycle text alignment"
            >
              <AlignLeft className="h-4 w-4" />
            </Button>
          </TooltipTrigger>
          <TooltipContent>Text alignment</TooltipContent>
        </Tooltip>
        <Tooltip>
          <TooltipTrigger asChild>
            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8"
              onClick={() => setSelectedElementId(null)}
              disabled={!hasSelection}
              aria-label="Select tool"
            >
              <MousePointer2 className="h-4 w-4" />
            </Button>
          </TooltipTrigger>
          <TooltipContent>Select tool</TooltipContent>
        </Tooltip>
        <Tooltip>
          <TooltipTrigger asChild>
            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8"
              onClick={() => (pageId ? undoLastChange(pageId) : null)}
              disabled={!canUndo}
              aria-label="Undo"
            >
              <RotateCcw className="h-4 w-4" />
            </Button>
          </TooltipTrigger>
          <TooltipContent>Undo</TooltipContent>
        </Tooltip>
        <Tooltip>
          <TooltipTrigger asChild>
            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8"
              onClick={handleDelete}
              disabled={!hasSelection}
              aria-label="Delete element"
            >
              <Trash2 className="h-4 w-4" />
            </Button>
          </TooltipTrigger>
          <TooltipContent>Delete element</TooltipContent>
        </Tooltip>
      </div>
    </TooltipProvider>
  );
}
