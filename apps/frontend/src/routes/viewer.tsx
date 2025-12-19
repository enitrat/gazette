import { createFileRoute, redirect } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import { Loader2 } from "lucide-react";
import { Canvas } from "@/components/Canvas";
import { getAuthSession } from "@/lib/auth";
import { useElementsStore } from "@/stores/elements-store";
import { usePagesStore } from "@/stores/pages-store";

export const Route = createFileRoute("/viewer")({
  beforeLoad: () => {
    const session = getAuthSession();
    if (!session) {
      throw redirect({
        to: "/auth",
      });
    }
  },
  component: ViewerPage,
});

function ViewerPage() {
  const [session] = useState(() => getAuthSession());
  const projectId = session?.projectId;
  const pages = usePagesStore((state) => state.pages);
  const pagesLoading = usePagesStore((state) => state.isLoading);
  const pagesError = usePagesStore((state) => state.error);
  const fetchPages = usePagesStore((state) => state.fetchPages);
  const elementsByPage = useElementsStore((state) => state.elementsByPage);
  const elementsLoading = useElementsStore((state) => state.isLoading);
  const elementsError = useElementsStore((state) => state.error);
  const fetchElements = useElementsStore((state) => state.fetchElements);
  const [activeIndex, setActiveIndex] = useState(0);
  const pageCount = pages.length;
  const canGoBack = activeIndex > 0;
  const canGoForward = activeIndex < pageCount - 1;
  const activePageId = pages[activeIndex]?.id;

  useEffect(() => {
    if (!projectId) return;
    void fetchPages(projectId);
  }, [fetchPages, projectId]);

  useEffect(() => {
    if (activeIndex >= pageCount) {
      setActiveIndex(0);
    }
  }, [activeIndex, pageCount]);

  useEffect(() => {
    if (!activePageId) return;
    if (elementsByPage[activePageId]) return;
    void fetchElements(activePageId);
  }, [activePageId, elementsByPage, fetchElements]);

  const currentPage = useMemo(() => {
    const page = pages[activeIndex];
    if (!page) return null;
    return {
      id: page.id,
      title: page.title,
      subtitle: page.subtitle,
      elements: elementsByPage[page.id] ?? [],
    };
  }, [activeIndex, elementsByPage, pages]);

  const showElementLoading = !!activePageId && elementsLoading && !elementsByPage[activePageId];

  return (
    <div className="min-h-[calc(100vh-57px)] bg-ink/5 p-8">
      <div className="mx-auto max-w-4xl">
        {/* Viewer Controls */}
        <div className="mb-6 flex items-center justify-between">
          <h2 className="font-headline text-ink-effect">Gazette Viewer</h2>
          <div className="flex gap-2">
            <button
              type="button"
              onClick={() => setActiveIndex((prev) => Math.max(0, prev - 1))}
              disabled={!canGoBack}
              className="rounded-sm border border-sepia/30 bg-parchment px-4 py-2 font-ui text-sm text-sepia transition-colors hover:bg-sepia hover:text-parchment disabled:cursor-not-allowed disabled:opacity-50"
            >
              Previous
            </button>
            <span className="flex items-center px-4 font-ui text-sm text-muted">
              Page {pageCount === 0 ? 0 : activeIndex + 1} of {pageCount}
            </span>
            <button
              type="button"
              onClick={() => setActiveIndex((prev) => Math.min(pageCount - 1, prev + 1))}
              disabled={!canGoForward}
              className="rounded-sm border border-sepia/30 bg-parchment px-4 py-2 font-ui text-sm text-sepia transition-colors hover:bg-sepia hover:text-parchment disabled:cursor-not-allowed disabled:opacity-50"
            >
              Next
            </button>
          </div>
        </div>

        <hr className="divider-double" />

        {/* Gazette Display */}
        <div className="aspect-[3/4]">
          {pagesLoading ? (
            <div className="flex h-full items-center justify-center rounded-md border border-sepia/20 bg-cream/70">
              <span className="inline-flex items-center gap-2 text-sm text-muted">
                <Loader2 className="h-4 w-4 animate-spin" />
                Loading pages...
              </span>
            </div>
          ) : pages.length === 0 ? (
            <div className="flex h-full items-center justify-center rounded-md border border-sepia/20 bg-cream/70">
              <span className="text-sm text-muted">{pagesError ?? "No pages available."}</span>
            </div>
          ) : (
            <div className="relative h-full w-full">
              <Canvas
                page={currentPage}
                projectName={session?.projectName}
                showChrome
                readOnly
                className="h-full w-full"
                emptyState="This page has no elements yet."
                enableGestures
              />
              {showElementLoading ? (
                <div className="absolute inset-0 flex items-center justify-center rounded-md bg-cream/60">
                  <span className="inline-flex items-center gap-2 text-sm text-muted">
                    <Loader2 className="h-4 w-4 animate-spin" />
                    Loading page...
                  </span>
                </div>
              ) : null}
              {elementsError ? (
                <div className="absolute inset-x-0 bottom-2 mx-auto w-fit rounded-sm border border-aged-red/40 bg-aged-red/10 px-3 py-1 text-xs text-aged-red">
                  {elementsError}
                </div>
              ) : null}
            </div>
          )}
        </div>

        <hr className="divider-vintage" />

        {/* Action Buttons */}
        <div className="mt-6 flex justify-center gap-4">
          <button className="rounded-sm bg-gold px-6 py-2 font-ui text-sm font-medium text-ink transition-colors hover:bg-gold/90">
            Generate Animation
          </button>
          <button className="rounded-sm border border-sepia/30 bg-parchment px-6 py-2 font-ui text-sm text-sepia transition-colors hover:bg-sepia hover:text-parchment">
            Share Gazette
          </button>
        </div>
      </div>
    </div>
  );
}
