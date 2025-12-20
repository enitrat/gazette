import { useEffect, useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { ScrollArea } from '@/components/ui/scroll-area';
import { useUIStore } from '@/stores/ui-store';
import { useAuthStore } from '@/stores/auth-store';
import { generation } from '@/lib/api';
import {
  Video,
  CheckCircle2,
  Loader2,
  Clock,
  XCircle,
  Minimize2,
  RefreshCw,
  AlertCircle,
} from 'lucide-react';
import type { GenerationJobStatusItem } from '@gazette/shared';

const STATUS_ICONS = {
  complete: <CheckCircle2 className="w-5 h-5 text-[#2e7d32]" />,
  processing: <Loader2 className="w-5 h-5 text-[#d4af37] animate-spin" />,
  queued: <Clock className="w-5 h-5 text-[#2c2416]/50" />,
  failed: <XCircle className="w-5 h-5 text-[#8b4513]" />,
};

const STATUS_LABELS = {
  complete: 'Complete',
  processing: 'Processing',
  queued: 'Queued',
  failed: 'Failed',
};

const STATUS_COLORS = {
  complete: 'border-[#2e7d32] bg-[#2e7d32]/10',
  processing: 'border-[#d4af37] bg-[#d4af37]/10 animate-pulse',
  queued: 'border-[#2c2416]/20 bg-[#2c2416]/5',
  failed: 'border-[#8b4513] bg-[#8b4513]/10',
};

export function GenerationProgressDialog() {
  const { activeDialog, closeDialog } = useUIStore();
  const { currentProject } = useAuthStore();
  const [jobs, setJobs] = useState<GenerationJobStatusItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [lastUpdate, setLastUpdate] = useState<Date>(new Date());

  const fetchJobs = async () => {
    if (!currentProject) return;

    try {
      const projectJobs = await generation.getProjectStatus(currentProject.id);
      setJobs(projectJobs);
      setError(null);
      setLastUpdate(new Date());
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch generation status');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (activeDialog === 'progress' && currentProject) {
      fetchJobs();

      // Auto-refresh every 3 seconds
      const interval = setInterval(fetchJobs, 3000);
      return () => clearInterval(interval);
    }
  }, [activeDialog, currentProject]);

  const hasActiveJobs = jobs.some(
    (job) => job.status === 'processing' || job.status === 'queued'
  );

  const completedCount = jobs.filter((job) => job.status === 'complete').length;
  const totalCount = jobs.length;

  return (
    <Dialog open={activeDialog === 'progress'} onOpenChange={closeDialog}>
      <DialogContent className="sm:max-w-[600px] max-h-[80vh] bg-[#f4f1e8] border-4 border-[#2c2416] shadow-2xl">
        {/* Ornamental corners */}
        <div className="absolute top-0 left-0 w-10 h-10 border-t-2 border-l-2 border-[#d4af37]" />
        <div className="absolute top-0 right-0 w-10 h-10 border-t-2 border-r-2 border-[#d4af37]" />
        <div className="absolute bottom-0 left-0 w-10 h-10 border-b-2 border-l-2 border-[#d4af37]" />
        <div className="absolute bottom-0 right-0 w-10 h-10 border-b-2 border-r-2 border-[#d4af37]" />

        <DialogHeader className="space-y-4 pt-2">
          <DialogTitle className="text-3xl font-serif text-center text-[#2c2416] tracking-wide border-b-2 border-[#2c2416] pb-3">
            <span className="inline-block relative">
              <Video className="inline-block w-6 h-6 mr-2 mb-1" />
              GENERATION PROGRESS
              <div className="absolute -bottom-1 left-0 right-0 h-px bg-[#d4af37]" />
            </span>
          </DialogTitle>
          <DialogDescription className="text-center text-[#2c2416]/70 text-sm italic font-serif">
            Monitor your cinematographic production queue
          </DialogDescription>
        </DialogHeader>

        {/* Status summary */}
        <div className="flex items-center justify-between py-3 px-4 bg-[#2c2416]/5 border-y-2 border-[#2c2416]/20">
          <div className="flex items-center gap-3">
            <div
              className={`w-2 h-2 rounded-full ${hasActiveJobs ? 'bg-[#d4af37] animate-pulse' : 'bg-[#2e7d32]'}`}
            />
            <span className="text-sm font-serif font-semibold text-[#2c2416]">
              {completedCount} of {totalCount} completed
            </span>
          </div>
          <Button
            onClick={fetchJobs}
            variant="ghost"
            size="sm"
            className="text-xs font-serif text-[#8b4513] hover:text-[#d4af37] hover:bg-[#d4af37]/10"
          >
            <RefreshCw className="w-3 h-3 mr-1" />
            Refresh
          </Button>
        </div>

        {/* Jobs list */}
        <ScrollArea className="flex-1 max-h-[400px] py-2">
          <div className="space-y-3 pr-4">
            {loading && jobs.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-12 space-y-3">
                <Loader2 className="w-8 h-8 text-[#d4af37] animate-spin" />
                <p className="text-sm font-serif text-[#2c2416]/70">Loading generation queue...</p>
              </div>
            ) : error ? (
              <div className="flex items-start gap-3 p-4 border-2 border-[#8b4513] bg-[#8b4513]/10 rounded-sm">
                <AlertCircle className="w-5 h-5 text-[#8b4513] flex-shrink-0 mt-0.5" />
                <div className="flex-1">
                  <p className="text-sm font-serif font-semibold text-[#8b4513]">Error</p>
                  <p className="text-xs font-serif text-[#8b4513]/80 mt-1">{error}</p>
                </div>
              </div>
            ) : jobs.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-12 space-y-3 text-center">
                <div className="w-16 h-16 rounded-full bg-[#2c2416]/5 flex items-center justify-center">
                  <Video className="w-8 h-8 text-[#2c2416]/30" />
                </div>
                <div>
                  <p className="text-sm font-serif font-semibold text-[#2c2416]">
                    No generation jobs
                  </p>
                  <p className="text-xs font-serif text-[#2c2416]/60 mt-1">
                    Your cinematographic queue is empty
                  </p>
                </div>
              </div>
            ) : (
              jobs.map((job, index) => (
                <div
                  key={job.id}
                  className={`
                    p-4 border-2 rounded-sm transition-all duration-300
                    ${STATUS_COLORS[job.status]}
                    animate-in fade-in-50 slide-in-from-left-5
                  `}
                  style={{
                    animationDelay: `${index * 50}ms`,
                    backgroundImage:
                      job.status === 'processing'
                        ? 'repeating-linear-gradient(45deg, transparent, transparent 8px, #d4af37 8px, #d4af37 9px)'
                        : 'none',
                    backgroundSize: '100% 100%, 15px 15px',
                    backgroundBlendMode: 'multiply',
                  } as React.CSSProperties}
                >
                  <div className="flex items-start gap-3">
                    {/* Status icon */}
                    <div className="flex-shrink-0 mt-0.5">{STATUS_ICONS[job.status]}</div>

                    {/* Job details */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between gap-2 mb-2">
                        <div className="flex-1">
                          <h4 className="text-sm font-serif font-semibold text-[#2c2416] truncate">
                            Generation Job
                          </h4>
                          <p className="text-xs font-serif text-[#2c2416]/60 mt-0.5">
                            {STATUS_LABELS[job.status]}
                          </p>
                        </div>
                        <span
                          className={`
                          text-xs font-serif font-semibold px-2 py-1 rounded-sm border
                          ${
                            job.status === 'complete'
                              ? 'border-[#2e7d32] text-[#2e7d32] bg-[#2e7d32]/10'
                              : job.status === 'failed'
                                ? 'border-[#8b4513] text-[#8b4513] bg-[#8b4513]/10'
                                : 'border-[#2c2416]/30 text-[#2c2416]/70'
                          }
                        `}
                        >
                          {job.status === 'complete' && '✓'}
                          {job.status === 'processing' && '⟳'}
                          {job.status === 'queued' && '◷'}
                          {job.status === 'failed' && '✗'}
                        </span>
                      </div>

                      {/* Progress bar for processing jobs */}
                      {job.status === 'processing' && (
                        <div className="space-y-1.5">
                          <Progress
                            value={job.progress || 0}
                            className="h-1.5 bg-[#2c2416]/10"
                            indicatorClassName="bg-gradient-to-r from-[#8b4513] to-[#d4af37]"
                          />
                          <div className="flex justify-between items-center">
                            <span className="text-xs font-serif text-[#2c2416]/60">
                              Processing...
                            </span>
                            <span className="text-xs font-serif font-semibold text-[#d4af37]">
                              {job.progress || 0}%
                            </span>
                          </div>
                        </div>
                      )}

                      {/* Error message for failed jobs */}
                      {job.status === 'failed' && job.error && (
                        <p className="text-xs font-serif text-[#8b4513] mt-2 italic">
                          {job.error}
                        </p>
                      )}

                      {/* Note: GenerationJobStatusItem doesn't include updatedAt */}
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </ScrollArea>

        {/* Auto-refresh indicator */}
        {hasActiveJobs && (
          <div className="flex items-center justify-center gap-2 py-2 text-xs font-serif text-[#2c2416]/50">
            <RefreshCw className="w-3 h-3 animate-spin" />
            <span>Auto-refreshing every 3 seconds</span>
          </div>
        )}

        {/* Last update time */}
        <div className="text-xs font-serif text-center text-[#2c2416]/40 py-1 border-t border-[#2c2416]/10">
          Last updated: {lastUpdate.toLocaleTimeString()}
        </div>

        {/* Footer */}
        <div className="border-t-2 border-[#2c2416]/20 pt-4">
          <Button
            onClick={closeDialog}
            className="w-full bg-[#2c2416] hover:bg-[#8b4513] text-[#f4f1e8] font-serif text-sm tracking-wider transition-all duration-300 shadow-md hover:shadow-lg border-2 border-[#2c2416] hover:border-[#d4af37]"
          >
            <Minimize2 className="w-4 h-4 mr-2" />
            MINIMIZE
            <span className="text-xs ml-2 opacity-70">(generation continues)</span>
          </Button>
        </div>

        {/* Decorative film reel stamp */}
        <div className="absolute -top-3 -right-3 opacity-25 pointer-events-none rotate-12">
          <div className="relative w-16 h-16">
            <div className="absolute inset-0 border-4 border-[#8b4513] rounded-sm" />
            <div className="absolute top-1 left-1 right-1 bottom-1 border-2 border-[#8b4513]" />
            <div className="absolute inset-0 flex items-center justify-center">
              <Video className="w-6 h-6 text-[#8b4513]" />
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
