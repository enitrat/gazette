import { useEffect, useMemo, useState } from "react";
import type { Template } from "@gazette/shared";
import { TEMPLATE_NAMES, TEMPLATES } from "@gazette/shared/constants";
import { Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import { usePagesStore } from "@/stores/pages-store";

type PageSidebarProps = {
  projectId?: string;
  activePageId?: string | null;
  onSelectPage: (pageId: string) => void;
  onRequestNewPage?: () => void;
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

export function PageSidebar({
  projectId,
  activePageId,
  onSelectPage,
  onRequestNewPage,
}: PageSidebarProps) {
  const { pages, isLoading, error, fetchPages, createPage } = usePagesStore();
  const [isCreating, setIsCreating] = useState(false);

  const sortedPages = useMemo(() => [...pages].sort((a, b) => a.order - b.order), [pages]);

  useEffect(() => {
    if (!projectId) {
      return;
    }
    void fetchPages(projectId);
  }, [projectId, fetchPages]);

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
    }
    setIsCreating(false);
  };

  return (
    <aside className="w-72 border-r border-sepia/20 bg-parchment/95 p-4">
      <div className="mb-4 flex items-center justify-between">
        <h3 className="text-ink-effect">Pages</h3>
        <span className="font-ui text-xs text-muted">{sortedPages.length} total</span>
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

          {!isLoading && !error && sortedPages.length === 0 && (
            <Card className="border-dashed border-muted/60 bg-cream/60 shadow-none">
              <CardContent className="p-3 font-ui text-xs text-muted">
                No pages yet. Start with your first spread.
              </CardContent>
            </Card>
          )}

          {!isLoading &&
            !error &&
            sortedPages.map((page) => {
              const isActive = page.id === activePageId;
              return (
                <Button
                  key={page.id}
                  onClick={() => onSelectPage(page.id)}
                  variant="ghost"
                  type="button"
                  className={cn(
                    "h-auto w-full justify-start gap-3 border px-3 py-2 text-left transition-all",
                    isActive
                      ? "border-gold bg-cream shadow-[0_0_0_1px_rgba(193,154,107,0.35)]"
                      : "border-sepia/30 bg-cream/80 hover:border-gold/60 hover:bg-cream"
                  )}
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
              );
            })}
        </div>
      )}

      <Button
        type="button"
        onClick={handleCreatePage}
        disabled={!projectId || isCreating}
        variant="ghost"
        className="mt-4 w-full gap-2 border border-dashed border-muted/60 bg-transparent px-3 py-2 text-muted hover:border-gold hover:text-sepia"
      >
        <Plus className="h-4 w-4" />
        {isCreating ? "Creating..." : "New Page"}
      </Button>
    </aside>
  );
}
