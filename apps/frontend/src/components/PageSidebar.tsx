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
import { GripVertical, Loader2, Newspaper, Plus, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Skeleton } from "@/components/ui/skeleton";
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
  [TEMPLATES.TWO_COLUMNS]: "grid-cols-2 grid-rows-[auto_1fr]",
  [TEMPLATES.THREE_GRID]: "grid-cols-3 grid-rows-[auto_1fr]",
};

const TEMPLATE_ACCENTS: Record<Template, string> = {
  [TEMPLATES.MASTHEAD]: "bg-gold/70",
  [TEMPLATES.FULL_PAGE]: "bg-sepia/40",
  [TEMPLATES.TWO_COLUMNS]: "bg-sepia/30",
  [TEMPLATES.THREE_GRID]: "bg-sepia/25",
};

function PagePreview({
  templateId,
  title,
  subtitle,
}: {
  templateId: Template;
  title?: string;
  subtitle?: string;
}) {
  const layout = TEMPLATE_PREVIEW_STYLES[templateId];
  const previewTitle = title?.trim() || "Untitled";
  const previewSubtitle = subtitle?.trim() || TEMPLATE_NAMES[templateId];
  const titleSnippet = previewTitle.slice(0, 18);
  const subtitleSnippet = previewSubtitle.slice(0, 20);

  return (
    <div className="relative h-20 w-14 overflow-hidden rounded-md border border-sepia/30 bg-cream/95 p-1 shadow-[inset_0_0_0_1px_rgba(92,64,51,0.08)]">
      <span
        className={cn(
          "absolute right-1 top-1 h-1.5 w-1.5 rounded-full shadow-[0_0_0_1px_rgba(92,64,51,0.18)]",
          TEMPLATE_ACCENTS[templateId]
        )}
        aria-hidden="true"
      />
      <div className={cn("grid h-full w-full gap-1", layout)}>
        <div className="col-span-full rounded-[2px] bg-sepia/30 px-0.5 py-0.5 text-[5px] leading-[1.1] text-ink/70">
          {titleSnippet}
        </div>
        {templateId === TEMPLATES.MASTHEAD && (
          <>
            <div className="rounded-[2px] bg-sepia/20 px-0.5 py-0.5 text-[5px] leading-[1.1] text-ink/60">
              {subtitleSnippet}
            </div>
            <div className="grid grid-cols-2 gap-1">
              <div className="rounded-[2px] bg-sepia/15" />
              <div className="rounded-[2px] bg-sepia/20" />
            </div>
            <div className="h-1.5 rounded-[2px] bg-sepia/25" />
          </>
        )}
        {templateId === TEMPLATES.FULL_PAGE && (
          <>
            <div className="rounded-[2px] bg-sepia/15" />
            <div className="rounded-[2px] bg-sepia/25 px-0.5 py-0.5 text-[5px] leading-[1.1] text-ink/60">
              {subtitleSnippet}
            </div>
          </>
        )}
        {templateId === TEMPLATES.TWO_COLUMNS && (
          <>
            <div className="grid grid-rows-[1fr_auto] gap-1 rounded-[2px] bg-sepia/15 p-0.5">
              <div className="rounded-[2px] bg-sepia/10" />
              <div className="text-[5px] leading-[1.1] text-ink/60">{subtitleSnippet}</div>
            </div>
            <div className="grid grid-rows-[auto_1fr] gap-1 rounded-[2px] bg-sepia/20 p-0.5">
              <div className="text-[5px] leading-[1.1] text-ink/60">{titleSnippet}</div>
              <div className="rounded-[2px] bg-sepia/10" />
            </div>
          </>
        )}
        {templateId === TEMPLATES.THREE_GRID && (
          <>
            <div className="rounded-[2px] bg-sepia/15" />
            <div className="rounded-[2px] bg-sepia/25" />
            <div className="rounded-[2px] bg-sepia/20" />
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
          ? "border-gold bg-cream shadow-[0_0_0_2px_rgba(201,162,39,0.35),0_10px_20px_-16px_rgba(60,40,28,0.8)] ring-2 ring-gold/30 motion-safe:animate-[pulse_0.6s_ease-out_1]"
          : "border-sepia/30 bg-cream/80 hover:border-gold/60 hover:bg-cream hover:shadow-[0_6px_14px_-12px_rgba(60,40,28,0.7)]",
        isDragging && "opacity-60"
      )}
    >
      <Button
        onClick={() => onSelectPage(page.id)}
        variant="ghost"
        type="button"
        className="h-auto flex-1 justify-start gap-3 px-0 py-0 text-left"
      >
        <PagePreview templateId={page.templateId} title={page.title} subtitle={page.subtitle} />
        <div className="flex flex-1 flex-col justify-center">
          <p className="font-ui text-sm font-medium text-ink">
            {page.title.trim() || `Page ${page.order + 1}`}
          </p>
          <p className="font-ui text-xs text-muted">
            {page.subtitle.trim() || TEMPLATE_NAMES[page.templateId]}
          </p>
          <span className="mt-2 inline-flex w-fit items-center gap-1 rounded-full border border-sepia/30 bg-parchment px-2 py-0.5 font-ui text-[10px] uppercase tracking-[0.12em] text-sepia/70">
            {TEMPLATE_NAMES[page.templateId]}
          </span>
        </div>
        <span className="flex items-start font-ui text-[11px] text-muted">
          {(page.elementCount ?? 0).toString()}
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
            <div className="space-y-3">
              {Array.from({ length: 3 }).map((_, index) => (
                <div
                  key={`page-skeleton-${index}`}
                  className="flex items-center gap-3 rounded-md border border-sepia/20 bg-cream/70 px-3 py-2"
                >
                  <Skeleton className="h-20 w-14 rounded-md bg-sepia/15" />
                  <div className="flex-1 space-y-2">
                    <Skeleton className="h-3 w-28 bg-sepia/20" />
                    <Skeleton className="h-2 w-20 bg-sepia/15" />
                    <Skeleton className="h-2 w-16 bg-sepia/15" />
                  </div>
                  <Skeleton className="h-4 w-8 bg-sepia/15" />
                </div>
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
              <CardContent className="flex flex-col items-center gap-3 p-4 text-center">
                <div className="flex h-12 w-12 items-center justify-center rounded-full border border-sepia/30 bg-parchment/70 text-sepia shadow-[inset_0_0_0_1px_rgba(92,64,51,0.08)]">
                  <Newspaper className="h-5 w-5" aria-hidden="true" />
                </div>
                <div className="space-y-1">
                  <p className="font-ui text-xs text-muted">
                    Every story begins with a blank page. Add your first.
                  </p>
                  <div className="mx-auto h-px w-12 bg-sepia/30" aria-hidden="true" />
                </div>
              </CardContent>
            </Card>
          )}

          {!isLoading && sortedPages.length > 0 && (
            <ScrollArea className="max-h-[60vh] pr-2">
              <DndContext sensors={sensors} onDragEnd={handleDragEnd}>
                <SortableContext
                  items={sortedPages.map((page) => page.id)}
                  strategy={verticalListSortingStrategy}
                >
                  <div className="space-y-3 pb-2">
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
            </ScrollArea>
          )}
        </div>
      )}

      <Button
        type="button"
        onClick={handleCreatePage}
        disabled={!projectId || isCreating}
        variant="outline"
        className="mt-4 w-full gap-2 border-2 border-dashed border-sepia/40 bg-cream/70 px-3 py-3 text-sepia transition-all hover:-translate-y-0.5 hover:border-gold hover:bg-cream hover:text-ink hover:shadow-[0_8px_16px_-12px_rgba(60,40,28,0.8)]"
      >
        {isCreating ? <Loader2 className="h-4 w-4 animate-spin" /> : <Plus className="h-4 w-4" />}
        {isCreating ? "Creating..." : "New Page"}
      </Button>
    </aside>
  );
}
