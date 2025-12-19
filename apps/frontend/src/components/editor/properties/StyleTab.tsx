import { useMemo } from "react";
import { ArrowDown, ArrowDownToLine, ArrowUp, ArrowUpToLine } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { useElementsStore } from "@/stores/elements-store";
import type { CanvasElement, TextStyle } from "@/types/editor";
import { cn } from "@/lib/utils";
import { FONT_OPTIONS, getDefaultTextStyle, resolveTextStyle } from "@/lib/editor-style";
import { ColorPicker } from "@/components/editor/properties/ColorPicker";
import { SliderWithInput } from "@/components/editor/properties/SliderWithInput";
import {
  TextAlignmentControl,
  type TextAlignment,
} from "@/components/editor/properties/TextAlignmentControl";
import {
  TextStyleToggles,
  type TextStyleState,
} from "@/components/editor/properties/TextStyleToggles";

const safeNumber = (value: string, fallback: number) => {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : fallback;
};

type StyleTabProps = {
  pageId?: string | null;
  element?: CanvasElement | null;
  elements: CanvasElement[];
};

export function StyleTab({ pageId, element, elements }: StyleTabProps) {
  const updateElementStyle = useElementsStore((state) => state.updateElementStyle);
  const reorderElement = useElementsStore((state) => state.reorderElement);

  const isText = element?.type !== "image" && element !== null && element !== undefined;
  const styleOverrides = element?.style ?? {};
  const displayStyle = useMemo(() => {
    if (!element) return getDefaultTextStyle("headline");
    return resolveTextStyle(element);
  }, [element]);

  const handleStyleChange = (next: Partial<TextStyle>) => {
    if (!pageId || !element || !isText) return;
    updateElementStyle(pageId, element.id, next);
  };

  const elementIndex = useMemo(() => {
    if (!element) return -1;
    return elements.findIndex((item) => item.id === element.id);
  }, [element, elements]);

  const canSendBackward = elementIndex > 0;
  const canBringForward = elementIndex >= 0 && elementIndex < elements.length - 1;

  if (!element) {
    return (
      <div className="rounded-sm border border-dashed border-sepia/30 bg-cream/60 p-4">
        <p className="font-ui text-xs text-muted">Select an element to edit its styles.</p>
      </div>
    );
  }

  return (
    <div className="space-y-6 px-1 py-2">
      <section className="space-y-3">
        <div className="flex items-center justify-between">
          <Label className="font-ui text-xs font-semibold uppercase tracking-[0.2em] text-muted">
            Typography
          </Label>
        </div>
        <div className={cn("space-y-3", !isText && "pointer-events-none opacity-50")}>
          <div className="space-y-2">
            <Label className="font-ui text-xs text-muted">Font Family</Label>
            <Select
              value={styleOverrides.fontFamily ?? ""}
              onValueChange={(value) => handleStyleChange({ fontFamily: value })}
              disabled={!isText}
            >
              <SelectTrigger className="input-vintage h-9">
                <SelectValue placeholder="Inter, Serif, Interm, Iamb, s..." />
              </SelectTrigger>
              <SelectContent>
                {FONT_OPTIONS.map((option) => (
                  <SelectItem key={option.value} value={option.value}>
                    {option.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <SliderWithInput
            label="Font Size"
            value={styleOverrides.fontSize ?? 18}
            onChange={(value) => handleStyleChange({ fontSize: value })}
            min={8}
            max={72}
            step={1}
          />
          <SliderWithInput
            label="Line Height"
            value={styleOverrides.lineHeight ?? 2}
            onChange={(value) => handleStyleChange({ lineHeight: value })}
            min={1}
            max={3}
            step={0.1}
            displayScale={10}
          />
          <SliderWithInput
            label="Letter Spacing"
            value={styleOverrides.letterSpacing ?? 1}
            onChange={(value) => handleStyleChange({ letterSpacing: value })}
            min={-2}
            max={10}
            step={1}
          />
        </div>
      </section>

      <section className="space-y-3">
        <Label className="font-ui text-xs font-semibold uppercase tracking-[0.2em] text-muted">
          Color & Alignment
        </Label>
        <div className={cn("space-y-3", !isText && "pointer-events-none opacity-50")}>
          <ColorPicker
            value={styleOverrides.color ?? displayStyle.color ?? "#2C2416"}
            onChange={(value) => handleStyleChange({ color: value })}
          />
          <TextAlignmentControl
            value={(styleOverrides.textAlign ?? displayStyle.textAlign ?? "left") as TextAlignment}
            onChange={(value) => handleStyleChange({ textAlign: value })}
          />
        </div>
      </section>

      <section className="space-y-3">
        <Label className="font-ui text-xs font-semibold uppercase tracking-[0.2em] text-muted">
          Text Styling
        </Label>
        <div className={cn("space-y-2", !isText && "pointer-events-none opacity-50")}>
          <TextStyleToggles
            value={{
              bold: Boolean(styleOverrides.bold ?? displayStyle.bold),
              italic: Boolean(styleOverrides.italic ?? displayStyle.italic),
              underline: Boolean(styleOverrides.underline ?? displayStyle.underline),
              strikethrough: Boolean(styleOverrides.strikethrough ?? displayStyle.strikethrough),
            }}
            onChange={(value: TextStyleState) =>
              handleStyleChange({
                bold: value.bold,
                italic: value.italic,
                underline: value.underline,
                strikethrough: value.strikethrough,
              })
            }
          />
        </div>
      </section>

      <section className="space-y-3">
        <Label className="font-ui text-xs font-semibold uppercase tracking-[0.2em] text-muted">
          Spacing
        </Label>
        <div className={cn("space-y-3", !isText && "pointer-events-none opacity-50")}>
          <div className="space-y-2">
            <Label className="font-ui text-xs text-muted">Margin</Label>
            <div className="grid grid-cols-2 gap-2">
              <div className="space-y-1">
                <Label className="text-[10px] uppercase tracking-[0.2em] text-muted">
                  Horizontal
                </Label>
                <Input
                  type="number"
                  min={0}
                  value={styleOverrides.marginHorizontal ?? 0}
                  onChange={(event) =>
                    handleStyleChange({
                      marginHorizontal: safeNumber(event.target.value, 0),
                    })
                  }
                  className="input-vintage h-8 font-ui text-xs"
                />
              </div>
              <div className="space-y-1">
                <Label className="text-[10px] uppercase tracking-[0.2em] text-muted">
                  Vertical
                </Label>
                <Input
                  type="number"
                  min={0}
                  value={styleOverrides.marginVertical ?? 0}
                  onChange={(event) =>
                    handleStyleChange({
                      marginVertical: safeNumber(event.target.value, 0),
                    })
                  }
                  className="input-vintage h-8 font-ui text-xs"
                />
              </div>
            </div>
          </div>

          <div className="space-y-2">
            <Label className="font-ui text-xs text-muted">Padding</Label>
            <div className="grid grid-cols-2 gap-2">
              <div className="space-y-1">
                <Label className="text-[10px] uppercase tracking-[0.2em] text-muted">
                  Horizontal
                </Label>
                <Input
                  type="number"
                  min={0}
                  value={styleOverrides.paddingHorizontal ?? 0}
                  onChange={(event) =>
                    handleStyleChange({
                      paddingHorizontal: safeNumber(event.target.value, 0),
                    })
                  }
                  className="input-vintage h-8 font-ui text-xs"
                />
              </div>
              <div className="space-y-1">
                <Label className="text-[10px] uppercase tracking-[0.2em] text-muted">
                  Vertical
                </Label>
                <Input
                  type="number"
                  min={0}
                  value={styleOverrides.paddingVertical ?? 0}
                  onChange={(event) =>
                    handleStyleChange({
                      paddingVertical: safeNumber(event.target.value, 0),
                    })
                  }
                  className="input-vintage h-8 font-ui text-xs"
                />
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="space-y-3">
        <Label className="font-ui text-xs font-semibold uppercase tracking-[0.2em] text-muted">
          Layering
        </Label>
        <TooltipProvider>
          <div className="grid grid-cols-4 gap-1 rounded-sm border border-sepia/20 bg-cream/70 p-1">
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  variant="outline"
                  size="icon"
                  className="h-8"
                  onClick={() =>
                    pageId && element ? reorderElement(pageId, element.id, "back") : null
                  }
                >
                  <ArrowDownToLine className="h-4 w-4" />
                </Button>
              </TooltipTrigger>
              <TooltipContent>Send to back</TooltipContent>
            </Tooltip>
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  variant="outline"
                  size="icon"
                  className="h-8"
                  disabled={!canSendBackward}
                  onClick={() =>
                    pageId && element ? reorderElement(pageId, element.id, "backward") : null
                  }
                >
                  <ArrowDown className="h-4 w-4" />
                </Button>
              </TooltipTrigger>
              <TooltipContent>Send backward</TooltipContent>
            </Tooltip>
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  variant="outline"
                  size="icon"
                  className="h-8"
                  disabled={!canBringForward}
                  onClick={() =>
                    pageId && element ? reorderElement(pageId, element.id, "forward") : null
                  }
                >
                  <ArrowUp className="h-4 w-4" />
                </Button>
              </TooltipTrigger>
              <TooltipContent>Bring forward</TooltipContent>
            </Tooltip>
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  variant="outline"
                  size="icon"
                  className="h-8"
                  onClick={() =>
                    pageId && element ? reorderElement(pageId, element.id, "front") : null
                  }
                >
                  <ArrowUpToLine className="h-4 w-4" />
                </Button>
              </TooltipTrigger>
              <TooltipContent>Bring to front</TooltipContent>
            </Tooltip>
          </div>
        </TooltipProvider>
      </section>
    </div>
  );
}
