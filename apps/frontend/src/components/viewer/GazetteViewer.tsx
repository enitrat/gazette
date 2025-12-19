import { useEffect, useMemo, useRef, useState, type TouchEvent } from "react";
import { ChevronLeft, ChevronRight, Lock, Maximize2, Minimize2, Share2 } from "lucide-react";
import { Canvas } from "@/components/Canvas";
import type { CanvasPage } from "@/types/editor";
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
  const touchStartRef = useRef<{ x: number; y: number; time: number } | null>(null);
  const viewerRef = useRef<HTMLDivElement | null>(null);
  const canvasRef = useRef<HTMLDivElement | null>(null);
  const previousIndexRef = useRef(activeIndex);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [transitionDirection, setTransitionDirection] = useState<"forward" | "backward">("forward");

  const dots = useMemo(() => Array.from({ length: pageCount }, (_, index) => index), [pageCount]);

  const handleTouchStart = (event: TouchEvent<HTMLDivElement>) => {
    if (event.touches.length > 1) {
      touchStartRef.current = null;
      return;
    }
    const touch = event.touches[0];
    if (!touch) return;
    touchStartRef.current = { x: touch.clientX, y: touch.clientY, time: Date.now() };
  };

  const handleTouchMove = (event: TouchEvent<HTMLDivElement>) => {
    if (!touchStartRef.current) return;
    if (event.touches.length > 1) {
      touchStartRef.current = null;
      return;
    }
    const touch = event.touches[0];
    if (!touch) return;
    const deltaX = touch.clientX - touchStartRef.current.x;
    const deltaY = touch.clientY - touchStartRef.current.y;
    if (Math.abs(deltaX) > Math.abs(deltaY) && Math.abs(deltaX) > 12) {
      event.preventDefault();
    }
  };

  const handleTouchEnd = (event: TouchEvent<HTMLDivElement>) => {
    if (!touchStartRef.current) return;
    const touch = event.changedTouches[0];
    if (!touch) return;
    const deltaX = touch.clientX - touchStartRef.current.x;
    const deltaY = touch.clientY - touchStartRef.current.y;
    const elapsed = Date.now() - touchStartRef.current.time;
    touchStartRef.current = null;
    if (elapsed > 600) return;
    if (Math.abs(deltaX) < 50 || Math.abs(deltaX) < Math.abs(deltaY) * 1.4) return;
    if (deltaX < 0 && canGoForward) {
      onNavigate(activeIndex + 1);
    }
    if (deltaX > 0 && canGoBack) {
      onNavigate(activeIndex - 1);
    }
  };

  useEffect(() => {
    if (activeIndex === previousIndexRef.current) return;
    setTransitionDirection(activeIndex > previousIndexRef.current ? "forward" : "backward");
    previousIndexRef.current = activeIndex;
  }, [activeIndex]);

  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      const target = event.target as HTMLElement | null;
      if (target?.closest("input, textarea, [contenteditable='true']")) {
        return;
      }
      if (event.key === "ArrowRight" && canGoForward) {
        event.preventDefault();
        onNavigate(activeIndex + 1);
      }
      if (event.key === "ArrowLeft" && canGoBack) {
        event.preventDefault();
        onNavigate(activeIndex - 1);
      }
      if (event.key === "Escape" && isFullscreen) {
        void document.exitFullscreen?.();
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [activeIndex, canGoBack, canGoForward, isFullscreen, onNavigate]);

  useEffect(() => {
    const handleFullscreenChange = () => {
      setIsFullscreen(Boolean(document.fullscreenElement));
    };
    document.addEventListener("fullscreenchange", handleFullscreenChange);
    handleFullscreenChange();
    return () => document.removeEventListener("fullscreenchange", handleFullscreenChange);
  }, []);

  useEffect(() => {
    if (!isFullscreen) {
      document.body.style.overflow = "";
      return;
    }
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = "";
    };
  }, [isFullscreen]);

  useEffect(() => {
    const playVideos = () => {
      const container = canvasRef.current;
      if (!container) return;
      container.querySelectorAll("video").forEach((video) => {
        video.loop = true;
        video.muted = true;
        video.playsInline = true;
        const playPromise = video.play();
        if (playPromise?.catch) {
          playPromise.catch(() => undefined);
        }
      });
    };

    const handleVisibility = () => {
      if (document.visibilityState === "visible") {
        playVideos();
      }
    };

    const timeout = window.setTimeout(playVideos, 60);
    document.addEventListener("visibilitychange", handleVisibility);

    return () => {
      window.clearTimeout(timeout);
      document.removeEventListener("visibilitychange", handleVisibility);
    };
  }, [activeIndex]);

  const handleFullscreenToggle = async () => {
    if (!viewerRef.current) return;
    if (document.fullscreenElement) {
      await document.exitFullscreen();
      return;
    }
    if (viewerRef.current.requestFullscreen) {
      await viewerRef.current.requestFullscreen();
    }
  };

  return (
    <div
      ref={viewerRef}
      className={cn(
        "bg-cream/70 px-4 pb-16 pt-4 sm:px-8 sm:pb-10 sm:pt-6",
        isFullscreen ? "min-h-screen" : "min-h-[calc(100vh-57px)]"
      )}
      onTouchStart={handleTouchStart}
      onTouchMove={handleTouchMove}
      onTouchEnd={handleTouchEnd}
    >
      <div
        className={cn(
          "mx-auto flex w-full flex-col gap-6",
          isFullscreen ? "max-w-6xl" : "max-w-5xl"
        )}
      >
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
              onClick={handleFullscreenToggle}
              className={cn(
                "inline-flex items-center gap-2 rounded-sm border border-sepia/40 bg-parchment px-3 py-2 text-xs font-ui text-sepia transition-colors",
                "hover:bg-sepia hover:text-parchment"
              )}
            >
              {isFullscreen ? (
                <>
                  <Minimize2 className="h-4 w-4" aria-hidden="true" />
                  Exit fullscreen
                </>
              ) : (
                <>
                  <Maximize2 className="h-4 w-4" aria-hidden="true" />
                  Fullscreen
                </>
              )}
            </button>
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

        <div className={cn("relative mx-auto w-full", isFullscreen ? "max-w-5xl" : "max-w-4xl")}>
          <div className="aspect-[3/4] w-full" ref={canvasRef}>
            {currentPage ? (
              <div
                key={activeIndex}
                className={cn(
                  "h-full w-full rounded-md",
                  "animate-in fade-in-0 duration-300",
                  transitionDirection === "forward"
                    ? "slide-in-from-right-3"
                    : "slide-in-from-left-3"
                )}
              >
                <Canvas
                  page={currentPage}
                  projectName={projectName}
                  showChrome
                  readOnly
                  className="h-full w-full"
                  emptyState="This page has no elements yet."
                  enableGestures
                />
              </div>
            ) : (
              <div className="flex h-full w-full items-center justify-center rounded-md border border-sepia/30 bg-parchment text-sm text-muted">
                No pages available.
              </div>
            )}
          </div>
        </div>

        <div className="flex flex-col items-center gap-4">
          <div className="flex w-full flex-col items-center justify-between gap-4 sm:flex-row">
            <button
              type="button"
              onClick={() => onNavigate(activeIndex - 1)}
              disabled={!canGoBack}
              className={cn(
                "inline-flex items-center gap-3 rounded-sm border border-sepia/40 bg-parchment px-6 py-3 text-sm font-ui text-sepia shadow-sm transition-colors",
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
                "inline-flex items-center gap-3 rounded-sm border border-sepia/40 bg-parchment px-6 py-3 text-sm font-ui text-sepia shadow-sm transition-colors",
                canGoForward
                  ? "hover:bg-sepia hover:text-parchment"
                  : "cursor-not-allowed opacity-50"
              )}
            >
              Next
              <ChevronRight className="h-4 w-4" aria-hidden="true" />
            </button>
          </div>
          <div className="flex w-full max-w-md items-center justify-center gap-2 overflow-x-auto px-4">
            {dots.map((index) => (
              <button
                key={index}
                type="button"
                onClick={() => onNavigate(index)}
                aria-label={`Go to page ${index + 1}`}
                aria-current={index === activeIndex ? "page" : undefined}
                className={cn(
                  "h-2.5 w-2.5 rounded-full border transition-all",
                  index === activeIndex
                    ? "border-sepia bg-sepia shadow-sm"
                    : "border-sepia/40 bg-parchment hover:bg-sepia/30"
                )}
              />
            ))}
          </div>
        </div>

        <div className="text-center text-[11px] font-ui uppercase tracking-[0.3em] text-muted sm:hidden">
          Swipe to navigate pages
        </div>

        <div className="rounded-md border border-sepia/30 bg-parchment/80 px-4 py-3 text-xs font-ui text-muted">
          Share link: <span className="break-all text-sepia">{shareUrl}</span>
        </div>
      </div>
    </div>
  );
}
