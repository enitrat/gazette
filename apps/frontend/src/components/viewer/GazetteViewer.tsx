import { ChevronLeft, ChevronRight, Lock, Share2 } from "lucide-react";
import { Canvas, type CanvasPage } from "@/components/Canvas";
import { cn } from "@/lib/utils";

type GazetteViewerProps = {
  projectName: string;
  slug: string;
  shareUrl: string;
  pages: CanvasPage[];
  activeIndex: number;
  onNavigate: (nextIndex: number) => void;
  onShare: () => void;
  shareStatus?: string | null;
};

export function GazetteViewer({
  projectName,
  slug,
  shareUrl,
  pages,
  activeIndex,
  onNavigate,
  onShare,
  shareStatus,
}: GazetteViewerProps) {
  const pageCount = pages.length;
  const currentPage = pages[activeIndex];
  const canGoBack = activeIndex > 0;
  const canGoForward = activeIndex < pageCount - 1;

  return (
    <div className="min-h-[calc(100vh-57px)] bg-cream/70 px-4 pb-10 pt-6 sm:px-8">
      <div className="mx-auto flex w-full max-w-5xl flex-col gap-6">
        <header className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex flex-wrap items-center gap-3">
            <div className="flex items-center gap-2 rounded-full border border-sepia/40 bg-parchment px-3 py-1 text-xs font-ui text-sepia">
              <Lock className="h-3.5 w-3.5" aria-hidden="true" />
              View only
            </div>
            <div className="text-xs font-ui uppercase tracking-[0.2em] text-muted">{slug}</div>
          </div>
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={onShare}
              className={cn(
                "inline-flex items-center gap-2 rounded-sm border border-sepia/40 bg-parchment px-3 py-2 text-xs font-ui text-sepia transition-colors",
                "hover:bg-sepia hover:text-parchment"
              )}
            >
              <Share2 className="h-4 w-4" aria-hidden="true" />
              Share
            </button>
            {shareStatus ? <span className="text-xs font-ui text-muted">{shareStatus}</span> : null}
          </div>
        </header>

        <div className="relative mx-auto w-full max-w-4xl">
          <div className="aspect-[3/4] w-full">
            {currentPage ? (
              <Canvas
                page={currentPage}
                projectName={projectName}
                showChrome
                readOnly
                className="h-full w-full"
                emptyState="This page has no elements yet."
              />
            ) : (
              <div className="flex h-full w-full items-center justify-center rounded-md border border-sepia/30 bg-parchment text-sm text-muted">
                No pages available.
              </div>
            )}
          </div>
        </div>

        <div className="flex flex-col items-center justify-between gap-4 sm:flex-row">
          <button
            type="button"
            onClick={() => onNavigate(activeIndex - 1)}
            disabled={!canGoBack}
            className={cn(
              "inline-flex items-center gap-2 rounded-sm border border-sepia/40 bg-parchment px-4 py-2 text-xs font-ui text-sepia transition-colors",
              canGoBack ? "hover:bg-sepia hover:text-parchment" : "cursor-not-allowed opacity-50"
            )}
          >
            <ChevronLeft className="h-4 w-4" aria-hidden="true" />
            Previous
          </button>
          <div className="text-xs font-ui uppercase tracking-[0.3em] text-muted">
            Page {pageCount === 0 ? 0 : activeIndex + 1} of {pageCount}
          </div>
          <button
            type="button"
            onClick={() => onNavigate(activeIndex + 1)}
            disabled={!canGoForward}
            className={cn(
              "inline-flex items-center gap-2 rounded-sm border border-sepia/40 bg-parchment px-4 py-2 text-xs font-ui text-sepia transition-colors",
              canGoForward ? "hover:bg-sepia hover:text-parchment" : "cursor-not-allowed opacity-50"
            )}
          >
            Next
            <ChevronRight className="h-4 w-4" aria-hidden="true" />
          </button>
        </div>

        <div className="rounded-md border border-sepia/30 bg-parchment/80 px-4 py-3 text-xs font-ui text-muted">
          Share link: <span className="break-all text-sepia">{shareUrl}</span>
        </div>
      </div>
    </div>
  );
}
