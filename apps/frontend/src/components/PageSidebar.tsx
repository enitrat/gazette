import { useEffect, useMemo, useState } from "react";
import type { Template } from "@gazette/shared";
import { TEMPLATE_NAMES, TEMPLATES } from "@gazette/shared/constants";
import {
  DndContext,
  KeyboardSensor,
  PointerSensor,
  type DragEndEvent,
  useSensor,
  useSensors,
} from "@dnd-kit/core";
import {
  SortableContext,
  arrayMove,
  sortableKeyboardCoordinates,
  useSortable,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { GripVertical, Loader2, Plus, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import { usePagesStore, type PageSummary } from "@/stores/pages-store";
import { toast } from "@/components/ui/use-toast";

type PageSidebarProps = {
  projectId?: string;
  activePageId?: string | null;
  onSelectPage: (pageId: string) => void;
  onRequestNewPage?: () => void;
  onClose?: () => void;
  className?: string;
};

const TEMPLATE_PREVIEW_STYLES: Record<Template, string> = {
  [TEMPLATES.MASTHEAD]: "grid-rows-[auto_auto_1fr_auto]",
  [TEMPLATES.FULL_PAGE]: "grid-rows-[auto_1fr_auto]",
  [TEMPLATES.TWO_COLUMNS]: "grid-cols-2",
  [TEMPLATES.THREE_GRID]: "grid-cols-3",
};

function PagePreview({ templateId }: { templateId: Template }) {
  const layout = TEMPLATE_PREVIEW_STYLES[templateId];

  return (
    <div className="h-14 w-10 rounded-sm border border-sepia/30 bg-cream p-1 shadow-[inset_0_0_0_1px_rgba(92,64,51,0.08)]">
      <div className={cn("grid h-full w-full gap-1", layout)}>
        <div className="h-1.5 rounded-[1px] bg-sepia/40" />
        {templateId === TEMPLATES.MASTHEAD && (
          <>
            <div className="h-1 rounded-[1px] bg-sepia/30" />
            <div className="rounded-[1px] bg-sepia/15" />
            <div className="h-1 rounded-[1px] bg-sepia/20" />
          </>
        )}
        {templateId === TEMPLATES.FULL_PAGE && (
          <>
            <div className="rounded-[1px] bg-sepia/15" />
            <div className="h-1 rounded-[1px] bg-sepia/30" />
          </>
        )}
        {templateId === TEMPLATES.TWO_COLUMNS && (
          <>
            <div className="rounded-[1px] bg-sepia/15" />
            <div className="rounded-[1px] bg-sepia/20" />
          </>
        )}
        {templateId === TEMPLATES.THREE_GRID && (
          <>
            <div className="rounded-[1px] bg-sepia/15" />
            <div className="rounded-[1px] bg-sepia/25" />
            <div className="rounded-[1px] bg-sepia/25" />
          </>
        )}
      </div>
    </div>
  );
}

type SortablePageRowProps = {
  page: PageSummary;
  isActive: boolean;
  onSelectPage: (pageId: string) => void;
};

function SortablePageRow({ page, isActive, onSelectPage }: SortablePageRowProps) {
  const {
    attributes,
    listeners,
    setNodeRef,
    setActivatorNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: page.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={cn(
        "flex items-center gap-2 rounded-md border px-3 py-2 transition-all",
        isActive
          ? "border-gold bg-cream shadow-[0_0_0_1px_rgba(193,154,107,0.35)]"
          : "border-sepia/30 bg-cream/80 hover:border-gold/60 hover:bg-cream",
        isDragging && "opacity-60"
      )}
    >
      <Button
        onClick={() => onSelectPage(page.id)}
        variant="ghost"
        type="button"
        className="h-auto flex-1 justify-start gap-3 px-0 py-0 text-left"
      >
        <PagePreview templateId={page.templateId} />
        <div className="flex flex-1 flex-col justify-center">
          <p className="font-ui text-sm font-medium text-ink">
            {page.title.trim() || `Page ${page.order + 1}`}
          </p>
          <p className="font-ui text-xs text-muted">
            {page.subtitle.trim() || TEMPLATE_NAMES[page.templateId]}
          </p>
        </div>
        <span className="flex items-start font-ui text-[11px] text-muted">
          {page.elementCount ?? 0}
        </span>
      </Button>
      <button
        type="button"
        ref={setActivatorNodeRef}
        {...attributes}
        {...listeners}
        onClick={(event) => event.stopPropagation()}
        className="inline-flex h-7 w-7 items-center justify-center rounded-sm border border-transparent text-muted transition-colors hover:border-sepia/40 hover:bg-parchment hover:text-sepia"
        aria-label={`Reorder ${page.title.trim() || `Page ${page.order + 1}`}`}
      >
        <GripVertical className="h-4 w-4" aria-hidden="true" />
      </button>
    </div>
  );
}

export function PageSidebar({
  projectId,
  activePageId,
  onSelectPage,
  onRequestNewPage,
  onClose,
  className,
}: PageSidebarProps) {
  const { pages, isLoading, error, fetchPages, createPage, reorderPages } = usePagesStore();
  const [isCreating, setIsCreating] = useState(false);

  const sortedPages = useMemo(() => [...pages].sort((a, b) => a.order - b.order), [pages]);
  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 6 } }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  useEffect(() => {
    if (!projectId) {
      return;
    }
    void fetchPages(projectId);
  }, [projectId, fetchPages]);

  useEffect(() => {
    if (!error) return;
    toast({
      title: "Unable to load pages",
      description: error,
      variant: "destructive",
    });
  }, [error, toast]);

  const handleCreatePage = async () => {
    if (!projectId || isCreating) {
      return;
    }

    if (onRequestNewPage) {
      onRequestNewPage();
      return;
    }

    setIsCreating(true);
    const lastPage = sortedPages[sortedPages.length - 1];
    const created = await createPage(projectId, TEMPLATES.MASTHEAD, lastPage?.id);
    if (created) {
      onSelectPage(created.id);
      toast({
        title: "Page created",
        description: "Your new page is ready to edit.",
        variant: "success",
      });
    } else {
      toast({
        title: "Unable to create page",
        description: "Please try again.",
        variant: "destructive",
      });
    }
    setIsCreating(false);
  };

  const handleDragEnd = async ({ active, over }: DragEndEvent) => {
    if (!projectId || !over || active.id === over.id) {
      return;
    }

    const oldIndex = sortedPages.findIndex((page) => page.id === active.id);
    const newIndex = sortedPages.findIndex((page) => page.id === over.id);

    if (oldIndex === -1 || newIndex === -1) {
      return;
    }

    const nextOrder = arrayMove(sortedPages, oldIndex, newIndex);
    await reorderPages(
      projectId,
      nextOrder.map((page) => page.id)
    );
  };

  return (
    <aside
      className={cn("w-72 border-r border-sepia/20 bg-parchment/95 p-4", "max-w-[85vw]", className)}
    >
      <div className="mb-4 flex items-center justify-between gap-3">
        <h3 className="font-headline text-ink-effect">Pages</h3>
        <div className="flex items-center gap-2">
          <span className="font-ui text-xs text-muted">{sortedPages.length} total</span>
          {onClose ? (
            <button
              type="button"
              onClick={onClose}
              aria-label="Close pages panel"
              className="inline-flex h-7 w-7 items-center justify-center rounded-sm border border-sepia/30 text-sepia transition-colors hover:bg-sepia hover:text-parchment"
            >
              <X className="h-4 w-4" aria-hidden="true" />
            </button>
          ) : null}
        </div>
      </div>

      {!projectId && (
        <Card className="border-dashed border-muted/60 bg-cream/60 shadow-none">
          <CardContent className="p-3 font-ui text-xs text-muted">
            Connect to a project to load pages.
          </CardContent>
        </Card>
      )}

      {projectId && (
        <div className="space-y-3">
          {isLoading && (
            <div className="space-y-2">
              {Array.from({ length: 3 }).map((_, index) => (
                <Card
                  key={`page-skeleton-${index}`}
                  className="h-16 animate-pulse border-sepia/20 bg-cream/70 shadow-none"
                />
              ))}
            </div>
          )}

          {!isLoading && error && (
            <Card className="border-aged-red/30 bg-aged-red/10 shadow-none">
              <CardContent className="p-3 font-ui text-xs text-aged-red">{error}</CardContent>
            </Card>
          )}

          {!isLoading && sortedPages.length === 0 && (
            <Card className="border-dashed border-muted/60 bg-cream/60 shadow-none">
              <CardContent className="p-3 font-ui text-xs text-muted">
                Every story begins with a blank page. Add your first.
              </CardContent>
            </Card>
          )}

          {!isLoading && sortedPages.length > 0 && (
            <DndContext sensors={sensors} onDragEnd={handleDragEnd}>
              <SortableContext
                items={sortedPages.map((page) => page.id)}
                strategy={verticalListSortingStrategy}
              >
                <div className="space-y-3">
                  {sortedPages.map((page) => (
                    <SortablePageRow
                      key={page.id}
                      page={page}
                      isActive={page.id === activePageId}
                      onSelectPage={onSelectPage}
                    />
                  ))}
                </div>
              </SortableContext>
            </DndContext>
          )}
        </div>
      )}

      <Button
        type="button"
        onClick={handleCreatePage}
        disabled={!projectId || isCreating}
        variant="ghost"
        className="mt-4 w-full gap-2 border border-dashed border-muted/60 bg-transparent px-3 py-2 text-muted hover:border-gold hover:text-sepia"
      >
        {isCreating ? <Loader2 className="h-4 w-4 animate-spin" /> : <Plus className="h-4 w-4" />}
        {isCreating ? "Creating..." : "New Page"}
      </Button>
    </aside>
  );
}
