import { useState, useEffect } from 'react';
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
} from '@dnd-kit/core';
import type { DragEndEvent } from '@dnd-kit/core';
import {
  SortableContext,
  sortableKeyboardCoordinates,
  verticalListSortingStrategy,
} from '@dnd-kit/sortable';
import { useMemo } from 'react';
import { useShallow } from 'zustand/shallow';
import { Plus, Newspaper, Image as ImageIcon, FileText } from 'lucide-react';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Skeleton } from '@/components/ui/skeleton';
import { usePagesStore } from '@/stores/pages-store';
import { useElementsStore } from '@/stores/elements-store';
import { useAuthStore } from '@/stores/auth-store';
import { useUIStore } from '@/stores/ui-store';
import { PageCard } from './PageCard';
import { ContentLibrary } from './ContentLibrary';

export function LeftSidebar() {
  const project = useAuthStore((state) => state.project);
  const pages = usePagesStore((state) => state.pages);
  const isLoadingPages = usePagesStore((state) => state.isLoading);
  const currentPageId = usePagesStore((state) => state.currentPageId);
  const allElements = useElementsStore(useShallow((state) => state.elements));
  const setCurrentPage = usePagesStore((state) => state.setCurrentPage);
  const createPage = usePagesStore((state) => state.createPage);
  const deletePage = usePagesStore((state) => state.deletePage);
  const reorderPages = usePagesStore((state) => state.reorderPages);
  const fetchPages = usePagesStore((state) => state.fetchPages);
  const openDialog = useUIStore((state) => state.openDialog);

  const [localPages, setLocalPages] = useState(pages || []);

  useEffect(() => {
    setLocalPages(pages || []);
  }, [pages]);

  useEffect(() => {
    if (project?.id) {
      fetchPages(project.id);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [project?.id]);

  // Auto-select first page if none is selected and pages exist
  useEffect(() => {
    if (pages.length > 0 && !currentPageId) {
      setCurrentPage(pages[0].id);
    }
  }, [pages, currentPageId, setCurrentPage]);

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 8,
      },
    }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  const handleDragEnd = async (event: DragEndEvent) => {
    const { active, over } = event;

    if (!over || active.id === over.id) {
      return;
    }

    const oldIndex = localPages.findIndex((p) => p.id === active.id);
    const newIndex = localPages.findIndex((p) => p.id === over.id);

    if (oldIndex === -1 || newIndex === -1) {
      return;
    }

    // Optimistically update local state
    const reordered = [...localPages];
    const [movedPage] = reordered.splice(oldIndex, 1);
    reordered.splice(newIndex, 0, movedPage);
    setLocalPages(reordered);

    // Update backend
    if (project?.id) {
      const pageIds = reordered.map((p) => p.id);
      await reorderPages(project.id, pageIds);
    }
  };

  const handleAddPage = () => {
    // Open the template dialog to let user choose a template
    openDialog('template');
  };

  const handleDuplicatePage = async (pageId: string) => {
    if (!project?.id) return;
    const page = pages.find((p) => p.id === pageId);
    if (page) {
      await createPage(project.id, page.templateId, pageId);
    }
  };

  const handleDeletePage = async (pageId: string) => {
    if (pages.length <= 1) {
      // Prevent deleting the last page
      return;
    }
    await deletePage(pageId);
  };

  // Calculate stats - use useMemo to avoid infinite loops (see CLAUDE.md)
  const imageElements = useMemo(
    () => allElements.filter((el) => el.type === 'image'),
    [allElements]
  );
  const textElements = useMemo(
    () => allElements.filter((el) => el.type !== 'image'),
    [allElements]
  );

  return (
    <div className="flex h-full flex-col bg-gradient-to-b from-cream/60 to-parchment/40">
      {/* Project Header */}
      <div className="border-b border-sepia/20 bg-white/80 p-4 shadow-sm backdrop-blur-sm">
        <div className="flex items-start gap-3">
          <div className="flex h-12 w-12 flex-shrink-0 items-center justify-center rounded-sm bg-gradient-to-br from-gold/20 to-sepia/10 shadow-sm">
            <Newspaper className="h-6 w-6 text-sepia" strokeWidth={2} />
          </div>
          <div className="flex-1 min-w-0">
            <h2 className="truncate font-masthead text-base font-bold text-ink">
              La Gazette
            </h2>
            <div className="mt-1 flex flex-wrap items-center gap-2">
              <div className="flex items-center gap-1">
                <FileText className="h-3 w-3 text-muted" />
                <span className="font-ui text-[10px] text-muted">
                  {textElements.length} text
                </span>
              </div>
              <span className="text-sepia/30">·</span>
              <div className="flex items-center gap-1">
                <ImageIcon className="h-3 w-3 text-muted" />
                <span className="font-ui text-[10px] text-muted">
                  {imageElements.length} images
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>

      <ScrollArea className="flex-1 scrollbar-vintage">
        <div className="p-4">
          {/* Pages Section */}
          <div className="mb-6">
            <div className="mb-3 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <h3 className="font-headline text-sm font-bold text-ink">Pages</h3>
                <Badge
                  variant="outline"
                  className="border-sepia/30 bg-cream/50 text-[10px] font-ui text-sepia"
                >
                  {pages.length}
                </Badge>
              </div>
              <Button
                onClick={handleAddPage}
                size="sm"
                variant="ghost"
                className="h-7 gap-1 border border-sepia/20 bg-white/60 px-2 text-xs font-ui font-medium text-sepia hover:border-gold/40 hover:bg-gold/10 hover:text-ink"
              >
                <Plus className="h-3.5 w-3.5" />
                Add
              </Button>
            </div>

            {/* Loading State */}
            {isLoadingPages ? (
              <div className="space-y-2">
                <Skeleton className="h-24 w-full" />
                <Skeleton className="h-24 w-full" />
                <Skeleton className="h-24 w-full" />
              </div>
            ) : (
              <>
                {/* Pages List with DnD */}
                <DndContext
                  sensors={sensors}
                  collisionDetection={closestCenter}
                  onDragEnd={handleDragEnd}
                >
                  <SortableContext
                    items={localPages.map((p) => p.id)}
                    strategy={verticalListSortingStrategy}
                  >
                    <div className="space-y-2">
                      {localPages.map((page) => (
                        <PageCard
                          key={page.id}
                          page={page}
                          isSelected={page.id === currentPageId}
                          onSelect={() => setCurrentPage(page.id)}
                          onDuplicate={() => handleDuplicatePage(page.id)}
                          onDelete={() => handleDeletePage(page.id)}
                        />
                      ))}
                    </div>
                  </SortableContext>
                </DndContext>

                {pages.length === 0 && !isLoadingPages && (
                  <div className="rounded-sm border border-dashed border-sepia/30 bg-cream/20 py-8 text-center">
                    <FileText className="mx-auto h-8 w-8 text-sepia/30" strokeWidth={1.5} />
                    <p className="mt-2 font-ui text-xs font-medium text-ink">No pages yet</p>
                    <p className="mt-1 font-ui text-[10px] text-muted">
                      Click Add to create your first page
                    </p>
                  </div>
                )}
              </>
            )}
          </div>

          <Separator className="my-6 bg-sepia/10" />

          {/* Content Library */}
          <div className="mb-4">
            <h3 className="mb-3 font-headline text-sm font-bold text-ink">Library</h3>
            {project?.id && <ContentLibrary projectId={project.id} />}
          </div>
        </div>
      </ScrollArea>

      {/* Bottom Helper */}
      <div className="border-t border-sepia/20 bg-white/60 px-4 py-3 shadow-[0_-2px_8px_rgba(92,64,51,0.05)] backdrop-blur-sm">
        <div className="flex items-center gap-2">
          <div className="flex h-7 w-7 flex-shrink-0 items-center justify-center rounded-full bg-gold/10">
            <svg
              className="h-4 w-4 text-gold"
              fill="none"
              strokeWidth="2"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path d="M7 16V4m0 0L3 8m4-4l4 4m6 0v12m0 0l4-4m-4 4l-4-4" />
            </svg>
          </div>
          <p className="font-ui text-[10px] leading-tight text-muted">
            <span className="font-semibold text-ink">Drag & drop</span> elements
            <br />
            onto the canvas to add
          </p>
        </div>
      </div>
    </div>
  );
}
