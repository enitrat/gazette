import { useEffect, useMemo, useRef, useState } from "react";
import { AlertTriangle, Loader2, Sparkles } from "lucide-react";
import type { GenerationJobStatusItem, GenerationStatus, JobStatusEnum } from "@gazette/shared";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { api, parseApiError } from "@/lib/api";
import { cn } from "@/lib/utils";
import { toast } from "@/components/ui/use-toast";
import { Progress } from "@/components/ui/progress";
import { useElementsStore } from "@/stores/elements-store";
import { usePagesStore } from "@/stores/pages-store";

// Polling intervals based on activity state
const POLL_INTERVAL_ACTIVE_MS = 5000; // 5 seconds when there are active jobs
const POLL_INTERVAL_IDLE_MS = 30000; // 30 seconds as fallback (rarely used)

type GenerationProgressDialogProps = {
  projectId?: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  autoOpen?: boolean;
  onComplete?: () => void;
};

type StatusMeta = {
  label: string;
  glyph: string;
  className: string;
  animate?: boolean;
};

const STATUS_META: Record<JobStatusEnum, StatusMeta> = {
  queued: {
    label: "Queued",
    glyph: "◷",
    className: "text-muted",
  },
  processing: {
    label: "Processing",
    glyph: "⟳",
    className: "text-gold",
    animate: true,
  },
  complete: {
    label: "Complete",
    glyph: "✓",
    className: "text-forest-green",
  },
  failed: {
    label: "Failed",
    glyph: "✗",
    className: "text-aged-red",
  },
};

function formatPercent(value: number) {
  if (!Number.isFinite(value)) return "0%";
  return `${Math.round(value)}%`;
}

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

function getCurrentJob(jobs: GenerationJobStatusItem[]) {
  const processingIndex = jobs.findIndex((job) => job.status === "processing");
  if (processingIndex >= 0) {
    return {
      label: `Image ${processingIndex + 1}`,
      detail: "Currently generating",
    };
  }

  const queuedIndex = jobs.findIndex((job) => job.status === "queued");
  if (queuedIndex >= 0) {
    return {
      label: `Image ${queuedIndex + 1}`,
      detail: "Waiting in queue",
    };
  }

  return null;
}

const ESTIMATED_MINUTES_PER_JOB = 2;

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
  const [cancelingJobId, setCancelingJobId] = useState<string | null>(null);
  const [isCancelingAll, setIsCancelingAll] = useState(false);
  const [confirmCancelJobId, setConfirmCancelJobId] = useState<string | null>(null);
  const [confirmCancelAllOpen, setConfirmCancelAllOpen] = useState(false);
  const completionNotified = useRef(false);
  const generationStartRef = useRef<number | null>(null);
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

  // Only poll when:
  // 1. We have a projectId
  // 2. Dialog is open or autoOpen is enabled
  // 3. There are active jobs (queued or processing)
  const shouldPoll = Boolean(projectId) && (open || autoOpen) && hasActiveJobs;

  useEffect(() => {
    // Always fetch status once when projectId or dialog visibility changes
    if (!projectId || !(open || autoOpen)) return;
    void fetchStatus();

    // Only set up polling interval if there are active jobs
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
    toast({
      title: "Generation complete",
      description: "Your videos are ready. You can return to the editor at any time.",
    });
    onComplete?.();
  }, [isComplete, onComplete]);

  const { total, percent } = useMemo(() => getProgress(status), [status]);
  const currentJob = useMemo(() => (status ? getCurrentJob(status.jobs) : null), [status]);
  const queuedJobs = status?.jobs.filter((job) => job.status === "queued") ?? [];
  const failedJobs = status?.jobs.filter((job) => job.status === "failed") ?? [];

  useEffect(() => {
    if (!status || status.totalJobs === 0) return;
    if (generationStartRef.current === null) {
      generationStartRef.current = Date.now();
    }
  }, [status]);

  const elementMetaById = useMemo(() => {
    const meta = new Map<
      string,
      { pageNumber: number | null; imageNumber: number | null; prompt: string | null }
    >();
    pages.forEach((page, pageIndex) => {
      const pageElements = elementsByPage[page.id] ?? [];
      const imageElements = pageElements.filter((element) => element.type === "image");
      imageElements.forEach((element, imageIndex) => {
        meta.set(element.id, {
          pageNumber: pageIndex + 1,
          imageNumber: imageIndex + 1,
          prompt: element.animationPrompt ?? null,
        });
      });
    });
    return meta;
  }, [elementsByPage, pages]);

  const estimatedMinutesRemaining = useMemo(() => {
    if (!status || status.totalJobs === 0) return null;
    const startTime = generationStartRef.current;
    const remainingJobs = Math.max(status.totalJobs - status.completed - status.failed, 0);
    const baselineMinutes = remainingJobs * ESTIMATED_MINUTES_PER_JOB;
    if (!startTime) return baselineMinutes;
    const elapsedMs = Date.now() - startTime;
    const processingProgress =
      status.jobs
        .filter((job) => job.status === "processing")
        .reduce((totalProgress, job) => totalProgress + (job.progress ?? 0), 0) / 100;
    const fractionComplete =
      status.totalJobs > 0
        ? (status.completed + status.failed + processingProgress) / status.totalJobs
        : 0;
    if (elapsedMs < 30000 || fractionComplete <= 0.05) return baselineMinutes;
    const totalMs = elapsedMs / fractionComplete;
    const remainingMs = Math.max(totalMs - elapsedMs, 0);
    return Math.max(1, Math.round(remainingMs / 60000));
  }, [status]);

  const handleCancelJob = async (jobId: string) => {
    setCancelingJobId(jobId);
    try {
      await api.delete(`generation/${jobId}`);
      await fetchStatus();
    } catch (err) {
      const parsed = await parseApiError(err);
      setError(parsed.message);
      toast({
        title: "Cancellation failed",
        description: parsed.message,
        variant: "destructive",
      });
    } finally {
      setCancelingJobId(null);
    }
  };

  const handleCancelAll = async () => {
    if (queuedJobs.length === 0) return;
    setIsCancelingAll(true);
    const results = await Promise.allSettled(
      queuedJobs.map((job) => api.delete(`generation/${job.id}`))
    );
    const hasFailure = results.some((result) => result.status === "rejected");
    if (hasFailure) {
      setError("Some queued jobs could not be cancelled.");
      toast({
        title: "Partial cancellation",
        description: "Some queued jobs could not be cancelled.",
        variant: "destructive",
      });
    }
    setIsCancelingAll(false);
    await fetchStatus();
  };

  const confirmCancelJob = async () => {
    if (!confirmCancelJobId) return;
    await handleCancelJob(confirmCancelJobId);
    setConfirmCancelJobId(null);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl border-sepia/20 bg-parchment">
        <DialogHeader className="space-y-2">
          <DialogTitle className="flex items-center gap-2">
            <Sparkles className="h-5 w-5 text-gold" />
            Generating your gazette
          </DialogTitle>
          <DialogDescription>
            Your images are being transformed into animated memories. You can keep editing while we
            work in the background.
          </DialogDescription>
        </DialogHeader>

        {error ? (
          <div className="rounded-sm border border-aged-red/30 bg-aged-red/10 px-3 py-2 text-sm text-aged-red">
            {error}
          </div>
        ) : null}

        <section className="space-y-4 rounded-sm border border-sepia/20 bg-cream/70 p-4">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <p className="text-xs font-semibold uppercase tracking-wide text-muted">
                Overall progress
              </p>
              <p className="font-ui text-sm text-ink">
                {status ? `${status.completed} of ${total} videos complete` : "Waiting for jobs"}
              </p>
            </div>
            <p className="font-ui text-2xl text-ink">{formatPercent(percent)}</p>
          </div>
          <Progress value={percent} className="h-3 bg-ink/10" />
          <div className="flex flex-wrap items-center justify-between gap-2 text-xs text-muted">
            <span>
              {status
                ? `${status.completed} complete · ${status.failed} failed`
                : "Waiting for jobs"}
            </span>
            <span>
              Estimated time remaining:{" "}
              {estimatedMinutesRemaining === null
                ? "Estimating..."
                : `~${estimatedMinutesRemaining} minutes`}
            </span>
          </div>
        </section>

        <section className="rounded-sm border border-sepia/20 bg-parchment/80 p-4">
          <div className="mb-3 flex items-center justify-between">
            <div>
              <p className="font-ui text-sm text-ink">Generation timeline</p>
              <p className="text-xs text-muted">
                {currentJob
                  ? `${currentJob.detail}: ${currentJob.label}`
                  : isComplete
                    ? "All videos are ready"
                    : "Waiting for generation jobs"}
              </p>
            </div>
            <Button variant="outline" size="sm" onClick={fetchStatus} disabled={isLoading}>
              {isLoading ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Refreshing...
                </>
              ) : (
                "Refresh"
              )}
            </Button>
          </div>

          {status?.jobs?.length ? (
            <div className="space-y-4">
              {status.jobs.map((job, index) => {
                const meta = STATUS_META[job.status];
                const progressValue = job.progress ?? 0;
                const elementMeta = elementMetaById.get(job.elementId);
                const imageLabel = elementMeta?.imageNumber
                  ? `Image ${elementMeta.imageNumber}`
                  : `Image ${index + 1}`;
                const pageLabel = elementMeta?.pageNumber
                  ? `Page ${elementMeta.pageNumber} · ${imageLabel}`
                  : imageLabel;
                const promptPreview = elementMeta
                  ? (elementMeta.prompt ?? "Prompt not set yet. Edit it to personalize the motion.")
                  : "Prompt unavailable for this item.";
                const isLast = index === status.jobs.length - 1;

                return (
                  <div key={job.id} className="relative">
                    <div className="relative pl-10">
                      {!isLast ? (
                        <span className="absolute left-3 top-8 h-full w-px bg-sepia/20" />
                      ) : null}
                      <span
                        className={cn(
                          "absolute left-0 top-1 flex h-7 w-7 items-center justify-center rounded-full border border-sepia/20 bg-cream text-sm font-semibold",
                          meta.className
                        )}
                      >
                        <span
                          className={cn(
                            "inline-block leading-none",
                            meta.animate && "animate-spin"
                          )}
                        >
                          {meta.glyph}
                        </span>
                      </span>
                      <div className="flex items-start justify-between gap-3">
                        <div className="space-y-2">
                          <div className="flex flex-wrap items-center gap-2">
                            <p className="font-ui text-sm text-ink">{pageLabel}</p>
                            <span className={cn("text-xs font-ui", meta.className)}>
                              {meta.label}
                            </span>
                          </div>
                          <p className="line-clamp-2 text-xs text-muted">{promptPreview}</p>
                          {job.status === "processing" ? (
                            <div className="space-y-1">
                              <div className="flex items-center justify-between text-xs text-muted">
                                <span>{formatPercent(progressValue)}</span>
                                <span className="text-gold">Rendering clip</span>
                              </div>
                              <Progress value={progressValue} className="h-2 bg-ink/10" />
                            </div>
                          ) : null}
                          {job.status === "failed" && job.error ? (
                            <span className="flex items-center gap-1 text-xs text-aged-red">
                              <AlertTriangle className="h-3 w-3" />
                              {job.error}
                            </span>
                          ) : null}
                        </div>
                        {job.status === "queued" ? (
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => setConfirmCancelJobId(job.id)}
                            disabled={cancelingJobId === job.id}
                          >
                            {cancelingJobId === job.id ? (
                              <>
                                <Loader2 className="h-4 w-4 animate-spin" />
                                Canceling...
                              </>
                            ) : (
                              "Cancel"
                            )}
                          </Button>
                        ) : null}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="rounded-sm border border-dashed border-sepia/30 bg-cream/70 p-4 text-center text-sm text-muted">
              No generation jobs yet. Start a generation to see live progress here.
            </div>
          )}
        </section>

        {failedJobs.length ? (
          <div className="rounded-sm border border-aged-red/30 bg-aged-red/10 px-3 py-2 text-sm text-aged-red">
            {failedJobs.length} job{failedJobs.length > 1 ? "s" : ""} failed. You can retry those
            images or adjust their prompts.
          </div>
        ) : null}

        {isComplete ? (
          <div className="rounded-sm border border-forest-green/30 bg-forest-green/10 px-3 py-2 text-sm text-forest-green">
            All queued videos have finished generating. Your canvas will refresh automatically.
          </div>
        ) : null}

        <div className="flex flex-wrap items-center justify-between gap-3">
          <p className="text-xs text-muted">We will notify you once every clip is ready.</p>
          <div className="flex gap-2">
            <Button variant="outline" onClick={() => onOpenChange(false)}>
              Minimize to Background
            </Button>
            <Button
              variant="destructive"
              disabled={queuedJobs.length === 0 || isCancelingAll}
              onClick={() => setConfirmCancelAllOpen(true)}
            >
              {isCancelingAll ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Canceling...
                </>
              ) : (
                "Cancel generation"
              )}
            </Button>
          </div>
        </div>

        <AlertDialog
          open={Boolean(confirmCancelJobId)}
          onOpenChange={(open) => !open && setConfirmCancelJobId(null)}
        >
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Cancel this job?</AlertDialogTitle>
              <AlertDialogDescription>
                This will remove the queued generation job. You can restart it later if needed.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Keep job</AlertDialogCancel>
              <AlertDialogAction onClick={confirmCancelJob}>Cancel job</AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>

        <AlertDialog open={confirmCancelAllOpen} onOpenChange={setConfirmCancelAllOpen}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Cancel all queued jobs?</AlertDialogTitle>
              <AlertDialogDescription>
                Queued jobs will be removed immediately. Processing jobs will continue until they
                finish.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Keep jobs</AlertDialogCancel>
              <AlertDialogAction
                onClick={async () => {
                  setConfirmCancelAllOpen(false);
                  await handleCancelAll();
                }}
              >
                Cancel queued jobs
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </DialogContent>
    </Dialog>
  );
}
