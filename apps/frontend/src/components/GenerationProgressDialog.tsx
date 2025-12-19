import { useEffect, useMemo, useRef, useState } from "react";
import { AlertTriangle, CheckCircle2, Clock, Loader2, Sparkles, XCircle } from "lucide-react";
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
  icon: typeof Clock;
  className: string;
  animate?: boolean;
};

const STATUS_META: Record<JobStatusEnum, StatusMeta> = {
  queued: {
    label: "Queued",
    icon: Clock,
    className: "text-muted",
  },
  processing: {
    label: "Processing",
    icon: Loader2,
    className: "text-gold",
    animate: true,
  },
  complete: {
    label: "Complete",
    icon: CheckCircle2,
    className: "text-forest-green",
  },
  failed: {
    label: "Failed",
    icon: XCircle,
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

function ProgressBar({ value }: { value: number }) {
  return (
    <div className="h-2 w-full rounded-full bg-ink/10">
      <div
        className="h-full rounded-full bg-gold transition-all duration-500"
        style={{ width: `${Math.min(Math.max(value, 0), 100)}%` }}
      />
    </div>
  );
}

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
    onComplete?.();
  }, [isComplete, onComplete]);

  const { processed, total, percent } = useMemo(() => getProgress(status), [status]);
  const currentJob = useMemo(() => (status ? getCurrentJob(status.jobs) : null), [status]);
  const queuedJobs = status?.jobs.filter((job) => job.status === "queued") ?? [];
  const failedJobs = status?.jobs.filter((job) => job.status === "failed") ?? [];

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

        <section className="space-y-3">
          <div className="flex items-center justify-between">
            <p className="font-ui text-sm text-muted">Overall progress</p>
            <p className="font-ui text-sm text-ink">
              {processed} of {total} images processed
            </p>
          </div>
          <ProgressBar value={percent} />
          <div className="flex items-center justify-between text-xs text-muted">
            <span>{formatPercent(percent)}</span>
            <span>
              {status
                ? `${status.completed} complete · ${status.failed} failed`
                : "Waiting for jobs"}
            </span>
          </div>
        </section>

        <section className="rounded-sm border border-sepia/20 bg-cream/60 p-4">
          <div className="mb-3 flex items-center justify-between">
            <div>
              <p className="font-ui text-sm text-ink">Live queue</p>
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
            <div className="space-y-3">
              {status.jobs.map((job, index) => {
                const meta = STATUS_META[job.status];
                const Icon = meta.icon;
                const progressValue = job.progress ?? (job.status === "complete" ? 100 : 0);

                return (
                  <div key={job.id} className="rounded-sm border border-sepia/15 bg-parchment p-3">
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex items-center gap-3">
                        <span
                          className={cn(
                            "flex h-8 w-8 items-center justify-center rounded-full border border-sepia/20 bg-cream",
                            meta.className
                          )}
                        >
                          <Icon className={cn("h-4 w-4", meta.animate && "animate-spin")} />
                        </span>
                        <div>
                          <p className="font-ui text-sm text-ink">Image {index + 1}</p>
                          <p className={cn("text-xs", meta.className)}>{meta.label}</p>
                        </div>
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
                    <div className="mt-3 space-y-1">
                      <div className="flex items-center justify-between text-xs text-muted">
                        <span>{formatPercent(progressValue)}</span>
                        {job.status === "failed" && job.error ? (
                          <span className="flex items-center gap-1 text-aged-red">
                            <AlertTriangle className="h-3 w-3" />
                            {job.error}
                          </span>
                        ) : null}
                      </div>
                      <ProgressBar value={progressValue} />
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
              Minimize to background
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
