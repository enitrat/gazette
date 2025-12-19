import { useEffect, useMemo, useRef, useState } from "react";
import type { GenerationJobStatusItem, GenerationStatus, JobStatusEnum } from "@gazette/shared";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { ScrollArea } from "@/components/ui/scroll-area";
import { api, parseApiError } from "@/lib/api";
import { cn } from "@/lib/utils";
import { toast } from "@/components/ui/use-toast";
import { useElementsStore } from "@/stores/elements-store";
import { usePagesStore } from "@/stores/pages-store";

const POLL_INTERVAL_ACTIVE_MS = 5000;
const POLL_INTERVAL_IDLE_MS = 30000;

type GenerationProgressDialogProps = {
  projectId?: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  autoOpen?: boolean;
  onComplete?: () => void;
};

type StatusMeta = {
  label: string;
  icon: string;
  className: string;
  spin?: boolean;
};

const STATUS_META: Record<JobStatusEnum, StatusMeta> = {
  queued: {
    label: "Queued",
    icon: "◷",
    className: "text-muted",
  },
  processing: {
    label: "Processing",
    icon: "⟳",
    className: "text-gold",
    spin: true,
  },
  complete: {
    label: "Complete",
    icon: "✓",
    className: "text-forest-green",
  },
  failed: {
    label: "Failed",
    icon: "✗",
    className: "text-aged-red",
  },
};

function getProgress(status: GenerationStatus | null) {
  if (!status || status.totalJobs === 0) {
    return { processed: 0, total: 0, percent: 0 };
  }

  const processed = status.completed + status.failed;
  const percent = (processed / status.totalJobs) * 100;
  return { processed, total: status.totalJobs, percent };
}

function isGenerationComplete(status: GenerationStatus | null) {
  if (!status || status.totalJobs === 0) return false;
  return status.processing === 0 && status.queued === 0;
}

type ElementLookup = {
  pageIndex: number;
  imageIndex: number;
  prompt?: string | null;
};

export function GenerationProgressDialog({
  projectId,
  open,
  onOpenChange,
  autoOpen = true,
  onComplete,
}: GenerationProgressDialogProps) {
  const [status, setStatus] = useState<GenerationStatus | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const completionNotified = useRef(false);
  const pages = usePagesStore((state) => state.pages);
  const elementsByPage = useElementsStore((state) => state.elementsByPage);

  const fetchStatus = async () => {
    if (!projectId) return;
    setIsLoading(true);
    try {
      const data = await api
        .get(`projects/${projectId}/generation/status`)
        .json<GenerationStatus>();
      setStatus(data);
      setError(null);
    } catch (err) {
      const parsed = await parseApiError(err);
      setError(parsed.message);
      toast({
        title: "Unable to load progress",
        description: parsed.message,
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const hasActiveJobs = Boolean(status && (status.processing > 0 || status.queued > 0));
  const shouldPoll = Boolean(projectId) && (open || autoOpen) && hasActiveJobs;

  useEffect(() => {
    if (!projectId || !(open || autoOpen)) return;
    void fetchStatus();

    if (!shouldPoll) return;

    const pollInterval = hasActiveJobs ? POLL_INTERVAL_ACTIVE_MS : POLL_INTERVAL_IDLE_MS;
    const id = window.setInterval(() => {
      void fetchStatus();
    }, pollInterval);
    return () => window.clearInterval(id);
  }, [projectId, shouldPoll, hasActiveJobs]);

  const isComplete = isGenerationComplete(status);

  useEffect(() => {
    if (!autoOpen || !hasActiveJobs || open) return;
    onOpenChange(true);
  }, [autoOpen, hasActiveJobs, open, onOpenChange]);

  useEffect(() => {
    if (!isComplete) {
      completionNotified.current = false;
      return;
    }
    if (completionNotified.current) return;
    completionNotified.current = true;
    onComplete?.();
  }, [isComplete, onComplete]);

  const { processed, total, percent } = useMemo(() => getProgress(status), [status]);

  const elementLookup = useMemo(() => {
    const lookup = new Map<string, ElementLookup>();
    pages.forEach((page, pageIndex) => {
      const elements = elementsByPage[page.id] ?? [];
      const imageElements = elements.filter((element) => element.type === "image");
      imageElements.forEach((element, imageIndex) => {
        lookup.set(element.id, {
          pageIndex: pageIndex + 1,
          imageIndex: imageIndex + 1,
          prompt: element.animationPrompt,
        });
      });
    });
    return lookup;
  }, [pages, elementsByPage]);

  const jobs = status?.jobs ?? [];

  const getJobLabel = (job: GenerationJobStatusItem, index: number) => {
    const info = elementLookup.get(job.elementId);
    if (info) {
      return `Page ${info.pageIndex}, Image ${info.imageIndex}`;
    }
    return `Image ${index + 1}`;
  };

  const getJobPrompt = (job: GenerationJobStatusItem) => {
    const info = elementLookup.get(job.elementId);
    const prompt = info?.prompt?.trim();
    if (prompt) {
      return `“${prompt}”`;
    }
    return "“Animation prompt pending”";
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-[700px] rounded-[8px] border-sepia/30 bg-parchment shadow-2xl">
        <DialogHeader className="flex flex-row items-start justify-between gap-4 pr-10">
          <DialogTitle>Generating Your Gazette ✨</DialogTitle>
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={() => onOpenChange(false)}
            className="text-muted"
          >
            Minimize
          </Button>
        </DialogHeader>

        {error ? (
          <div className="rounded-[8px] border border-aged-red/30 bg-aged-red/10 px-3 py-2 text-sm text-aged-red">
            {error}
          </div>
        ) : null}

        <section className="space-y-3">
          <div className="flex items-center justify-between">
            <p className="font-ui text-sm text-muted">Overall Progress</p>
            <p className="font-ui text-sm text-ink">
              {processed} of {total} videos complete
            </p>
          </div>
          <Progress value={percent} />
          <div className="flex items-center justify-between text-xs text-muted">
            <span>{Math.round(percent)}%</span>
            <span>
              {status
                ? `${status.completed} complete · ${status.failed} failed`
                : "Waiting for jobs"}
            </span>
          </div>
        </section>

        <section className="space-y-3">
          <div className="flex items-center justify-between">
            <p className="font-ui text-sm text-ink">Task List</p>
            <Button variant="outline" size="sm" onClick={fetchStatus} disabled={isLoading}>
              {isLoading ? "Refreshing..." : "Refresh"}
            </Button>
          </div>
          <ScrollArea className="h-[260px] rounded-[8px] border border-sepia/20 bg-cream/60">
            <div className="space-y-3 p-3">
              {jobs.length ? (
                jobs.map((job, index) => {
                  const meta = STATUS_META[job.status];
                  const progressValue = job.progress ?? (job.status === "complete" ? 100 : 0);

                  return (
                    <div
                      key={job.id}
                      className="rounded-[8px] border border-sepia/15 bg-parchment p-3"
                    >
                      <div className="flex items-start justify-between gap-3">
                        <div className="flex items-start gap-3">
                          <span
                            className={cn(
                              "flex h-8 w-8 items-center justify-center rounded-full border border-sepia/20 bg-cream text-base",
                              meta.className,
                              meta.spin && "animate-spin"
                            )}
                          >
                            {meta.icon}
                          </span>
                          <div className="space-y-1">
                            <p className="font-ui text-sm text-ink">{getJobLabel(job, index)}</p>
                            <p className="text-xs text-muted">{getJobPrompt(job)}</p>
                          </div>
                        </div>
                        <div className={cn("text-xs font-semibold", meta.className)}>
                          {meta.label}
                        </div>
                      </div>
                      {job.status === "processing" ? (
                        <div className="mt-3 space-y-2">
                          <div className="flex items-center justify-between text-xs text-muted">
                            <span>{Math.round(progressValue)}%</span>
                            <span>Processing...</span>
                          </div>
                          <Progress value={progressValue} />
                        </div>
                      ) : null}
                      {job.status === "failed" && job.error ? (
                        <div className="mt-3 rounded-[6px] border border-aged-red/30 bg-aged-red/10 px-2 py-1 text-xs text-aged-red">
                          {job.error}
                        </div>
                      ) : null}
                    </div>
                  );
                })
              ) : (
                <div className="rounded-[8px] border border-dashed border-sepia/30 bg-cream/70 p-4 text-center text-sm text-muted">
                  No generation jobs yet. Start a generation to see live progress here.
                </div>
              )}
            </div>
          </ScrollArea>
        </section>

        <div className="flex flex-wrap items-center justify-between gap-3 rounded-[8px] border border-sepia/20 bg-cream/70 px-4 py-3 text-xs text-muted">
          <div className="flex items-center gap-2">
            <span aria-hidden="true">⏱</span>
            <span>Time estimate: ~2 minutes</span>
          </div>
          <div className="flex items-center gap-2">
            <span aria-hidden="true">💡</span>
            <span>You can continue editing while videos generate.</span>
          </div>
        </div>

        <div className="flex justify-end">
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Minimize to Background
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
