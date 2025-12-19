import { useMemo, type SyntheticEvent } from "react";
import { cn } from "@/lib/utils";

export type CanvasPosition = {
  x: number;
  y: number;
  width: number;
  height: number;
};

export type CanvasElement = {
  id: string;
  type: "image" | "headline" | "subheading" | "caption";
  position: CanvasPosition;
  content?: string;
  imageUrl?: string | null;
  videoUrl?: string | null;
  videoStatus?: "none" | "pending" | "processing" | "complete" | "failed";
};

export type CanvasPage = {
  id: string;
  title?: string | null;
  subtitle?: string | null;
  elements?: CanvasElement[];
};

type CanvasProps = {
  page?: CanvasPage | null;
  projectName?: string;
  showChrome?: boolean;
  readOnly?: boolean;
  className?: string;
  emptyState?: string;
};

const VIDEO_LOOP_SECONDS = 5;

function LoopingVideo({ src, className }: { src: string; className?: string }) {
  const handleTimeUpdate = (event: SyntheticEvent<HTMLVideoElement>) => {
    const video = event.currentTarget;
    const duration = Number.isFinite(video.duration) ? video.duration : VIDEO_LOOP_SECONDS;
    const limit = Math.min(VIDEO_LOOP_SECONDS, duration || VIDEO_LOOP_SECONDS);
    if (video.currentTime >= limit) {
      video.currentTime = 0;
      void video.play();
    }
  };

  return (
    <video
      className={className}
      src={src}
      muted
      playsInline
      autoPlay
      preload="metadata"
      onTimeUpdate={handleTimeUpdate}
    />
  );
}

function CanvasElementView({ element }: { element: CanvasElement }) {
  const baseStyle: React.CSSProperties = {
    left: element.position.x,
    top: element.position.y,
    width: element.position.width,
    height: element.position.height,
  };

  if (element.type === "image") {
    const hasVideo = element.videoUrl && element.videoStatus === "complete";
    const hasImage = element.imageUrl;

    return (
      <div
        className="absolute overflow-hidden rounded-sm border border-sepia/30 bg-parchment/70"
        style={baseStyle}
      >
        {hasVideo ? (
          <LoopingVideo src={element.videoUrl as string} className="h-full w-full object-cover" />
        ) : hasImage ? (
          <img
            src={element.imageUrl as string}
            alt=""
            className="h-full w-full object-cover"
            loading="lazy"
          />
        ) : (
          <div className="flex h-full w-full items-center justify-center text-xs font-ui text-muted">
            Image pending
          </div>
        )}
        {element.videoStatus &&
        element.videoStatus !== "complete" &&
        element.videoStatus !== "none" ? (
          <div className="absolute inset-0 flex items-center justify-center bg-parchment/60 text-xs font-ui text-muted">
            Video {element.videoStatus}
          </div>
        ) : null}
      </div>
    );
  }

  const textClass =
    element.type === "headline"
      ? "font-headline text-ink-effect text-lg"
      : element.type === "subheading"
        ? "font-subheading text-sm text-sepia"
        : "font-body text-xs text-muted";

  return (
    <div className={cn("absolute leading-snug", textClass)} style={baseStyle}>
      {element.content}
    </div>
  );
}

export function Canvas({
  page,
  projectName,
  showChrome = false,
  readOnly = false,
  className,
  emptyState = "Nothing to display yet.",
}: CanvasProps) {
  const elements = useMemo(() => page?.elements ?? [], [page]);
  const hasElements = elements.length > 0;

  return (
    <div className={cn("gazette-page h-full w-full rounded-md p-6", className)}>
      <div className="flex h-full flex-col gap-4">
        {showChrome ? (
          <header className="text-center">
            <div className="font-masthead text-2xl text-ink-effect sm:text-3xl">
              La Gazette de la Vie
            </div>
            <div className="mt-1 h-px w-full bg-sepia/40" />
            <div className="mt-2 flex flex-col items-center gap-1 text-xs uppercase tracking-[0.2em] text-muted">
              <span>{projectName ?? "Family Gazette"}</span>
              {page?.title ? (
                <span className="font-headline text-sm normal-case tracking-normal text-ink">
                  {page.title}
                </span>
              ) : null}
              {page?.subtitle ? <span className="tracking-normal">{page.subtitle}</span> : null}
            </div>
          </header>
        ) : null}

        <div className="relative flex-1 overflow-hidden">
          {hasElements ? (
            elements.map((element) => <CanvasElementView key={element.id} element={element} />)
          ) : (
            <div className="flex h-full items-center justify-center text-center text-sm text-muted">
              {emptyState}
              {readOnly ? null : (
                <span className="ml-2 text-xs text-sepia">Use the toolbar to add elements.</span>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
