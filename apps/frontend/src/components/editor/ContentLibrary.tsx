import { GripVertical, Image, LayoutGrid, Minus, Square, Type } from "lucide-react";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { Card } from "@/components/ui/card";
import { cn } from "@/lib/utils";

type ContentLibraryProps = {
  className?: string;
};

const draggableItemClasses =
  "flex items-center justify-between rounded-sm border border-sepia/20 bg-cream/80 px-2 py-1 font-ui text-xs text-ink transition-colors hover:bg-cream cursor-grab";

export function ContentLibrary({ className }: ContentLibraryProps) {
  return (
    <Card className={cn("border-sepia/20 bg-cream/90 p-3 shadow-none paper-texture", className)}>
      <div className="space-y-3">
        <div className="font-headline text-base text-ink-effect">Content Library</div>
        <Accordion type="multiple" defaultValue={["elements"]} className="w-full">
          <AccordionItem value="elements">
            <AccordionTrigger className="font-ui text-sm">Elements</AccordionTrigger>
            <AccordionContent>
              <div className="space-y-2">
                <div draggable className={draggableItemClasses}>
                  <span className="flex items-center gap-2">
                    <Type className="h-3.5 w-3.5 text-sepia" />
                    Text
                  </span>
                  <GripVertical className="h-3.5 w-3.5 text-muted" />
                </div>
                <div draggable className={draggableItemClasses}>
                  <span className="flex items-center gap-2">
                    <Square className="h-3.5 w-3.5 text-sepia" />
                    Shape
                  </span>
                  <GripVertical className="h-3.5 w-3.5 text-muted" />
                </div>
                <div draggable className={draggableItemClasses}>
                  <span className="flex items-center gap-2">
                    <Minus className="h-3.5 w-3.5 text-sepia" />
                    Divider
                  </span>
                  <GripVertical className="h-3.5 w-3.5 text-muted" />
                </div>
              </div>
            </AccordionContent>
          </AccordionItem>
          <AccordionItem value="media">
            <AccordionTrigger className="font-ui text-sm">Media</AccordionTrigger>
            <AccordionContent>
              <div className="space-y-2">
                <div className={draggableItemClasses}>
                  <span className="flex items-center gap-2">
                    <Image className="h-3.5 w-3.5 text-sepia" />
                    Uploaded images
                  </span>
                </div>
                <p className="font-ui text-xs text-muted">
                  This frame awaits a photograph. Upload to populate your library.
                </p>
              </div>
            </AccordionContent>
          </AccordionItem>
          <AccordionItem value="templates">
            <AccordionTrigger className="font-ui text-sm">Templates</AccordionTrigger>
            <AccordionContent>
              <div className="space-y-2">
                <div className={draggableItemClasses}>
                  <span className="flex items-center gap-2">
                    <LayoutGrid className="h-3.5 w-3.5 text-sepia" />
                    Classic layout
                  </span>
                </div>
                <div className={draggableItemClasses}>
                  <span className="flex items-center gap-2">
                    <LayoutGrid className="h-3.5 w-3.5 text-sepia" />
                    Photo feature
                  </span>
                </div>
              </div>
            </AccordionContent>
          </AccordionItem>
        </Accordion>
        <div className="flex items-center justify-center gap-2 text-xs text-muted">
          <GripVertical className="h-3.5 w-3.5" />
          Drag and drop
        </div>
      </div>
    </Card>
  );
}
