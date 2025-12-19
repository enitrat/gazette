import { useMemo, useState } from "react";
import { SlidersHorizontal } from "lucide-react";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { cn } from "@/lib/utils";
import { useElementsStore } from "@/stores/elements-store";
import type { CanvasElement } from "@/types/editor";
import { FloatingToolbar } from "@/components/editor/FloatingToolbar";
import { StyleTab } from "@/components/editor/properties/StyleTab";
import { LayoutTab } from "@/components/editor/properties/LayoutTab";
import { AdvancedTab } from "@/components/editor/properties/AdvancedTab";

const PanelBody = ({
  pageId,
  elements,
  selectedElement,
}: {
  pageId?: string | null;
  elements: CanvasElement[];
  selectedElement?: CanvasElement | null;
}) => (
  <div className="flex h-full flex-col">
    <div className="mb-4">
      <h3 className="font-headline text-ink-effect">Properties</h3>
      <p className="font-ui text-xs text-muted">
        {selectedElement ? "Edit the selected element" : "Select an element to begin"}
      </p>
    </div>
    <Tabs defaultValue="style" className="flex flex-1 flex-col">
      <TabsList className="grid w-full grid-cols-3">
        <TabsTrigger value="style" className="text-xs">
          Style
        </TabsTrigger>
        <TabsTrigger value="layout" className="text-xs">
          Layout
        </TabsTrigger>
        <TabsTrigger value="advanced" className="text-xs">
          Advanced
        </TabsTrigger>
      </TabsList>
      <ScrollArea className="mt-4 flex-1 pr-2">
        <TabsContent value="style" className="mt-0">
          <StyleTab pageId={pageId} element={selectedElement} elements={elements} />
        </TabsContent>
        <TabsContent value="layout" className="mt-0">
          <LayoutTab />
        </TabsContent>
        <TabsContent value="advanced" className="mt-0">
          <AdvancedTab />
        </TabsContent>
      </ScrollArea>
    </Tabs>
  </div>
);

type PropertiesPanelProps = {
  pageId?: string | null;
  elements: CanvasElement[];
  className?: string;
};

export function PropertiesPanel({ pageId, elements, className }: PropertiesPanelProps) {
  const selectedElementId = useElementsStore((state) => state.selectedElementId);
  const selectedElement = useMemo(
    () => elements.find((element) => element.id === selectedElementId) ?? null,
    [elements, selectedElementId]
  );
  const [isOpen, setIsOpen] = useState(false);

  return (
    <>
      <div className="relative hidden w-[280px] shrink-0 lg:block">
        <aside
          className={cn(
            "editor-properties flex h-full flex-col border-l border-sepia/20 bg-cream/80 p-4",
            className
          )}
        >
          <PanelBody pageId={pageId} elements={elements} selectedElement={selectedElement} />
        </aside>
        <div className="absolute -left-12 top-24">
          <FloatingToolbar pageId={pageId} selectedElement={selectedElement} />
        </div>
      </div>

      <Sheet open={isOpen} onOpenChange={setIsOpen}>
        <SheetTrigger asChild>
          <Button
            type="button"
            variant="outline"
            size="icon"
            className="fixed right-4 top-1/2 z-30 hidden -translate-y-1/2 shadow-sm md:inline-flex lg:hidden"
            aria-label="Open properties panel"
          >
            <SlidersHorizontal className="h-4 w-4" />
          </Button>
        </SheetTrigger>
        <SheetContent side="right" className="w-[320px] border-l border-sepia/20 bg-cream/95 p-4">
          <PanelBody pageId={pageId} elements={elements} selectedElement={selectedElement} />
        </SheetContent>
      </Sheet>
    </>
  );
}
