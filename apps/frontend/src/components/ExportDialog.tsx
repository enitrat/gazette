import { useEffect, useMemo, useState } from "react";
import { CheckCircle2, Download, Film, Loader2, Printer, TriangleAlert } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { apiBaseUrl, type ApiErrorPayload } from "@/lib/api";
import { getAuthToken } from "@/lib/auth";
import { cn } from "@/lib/utils";
import { toast } from "@/components/ui/use-toast";

type ExportDialogProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  projectId?: string | null;
};

type ExportFormat = "html" | "videos" | "pdf";

const EXPORT_LABELS: Record<ExportFormat, string> = {
  html: "HTML Download",
  videos: "Video ZIP",
  pdf: "Print PDF",
};

const getFilenameFromHeader = (header: string | null, fallback: string) => {
  if (!header) return fallback;
  const utfMatch = header.match(/filename\*=UTF-8''([^;]+)/i);
  if (utfMatch?.[1]) {
    try {
      return decodeURIComponent(utfMatch[1]);
    } catch {
      return utfMatch[1];
    }
  }
  const match = header.match(/filename="?([^";]+)"?/i);
  return match?.[1] ?? fallback;
};

export function ExportDialog({ open, onOpenChange, projectId }: ExportDialogProps) {
  const [activeExport, setActiveExport] = useState<ExportFormat | null>(null);
  const [status, setStatus] = useState<"idle" | "downloading" | "success" | "error">("idle");
  const [progress, setProgress] = useState<{ loaded: number; total?: number } | null>(null);
  const [message, setMessage] = useState<string | null>(null);

  const progressPercent = useMemo(() => {
    if (!progress?.total || progress.total <= 0) return null;
    return Math.min(100, Math.round((progress.loaded / progress.total) * 100));
  }, [progress]);

  const resetState = () => {
    setActiveExport(null);
    setStatus("idle");
    setProgress(null);
    setMessage(null);
  };

  useEffect(() => {
    if (!open) {
      resetState();
    }
  }, [open]);

  const handleDownload = async (format: Extract<ExportFormat, "html" | "videos">) => {
    if (!projectId) {
      setStatus("error");
      setMessage("Missing project. Please open a project before exporting.");
      return;
    }

    setActiveExport(format);
    setStatus("downloading");
    setProgress({ loaded: 0, total: undefined });
    setMessage("Preparing download...");

    try {
      const token = getAuthToken();
      const url = `${apiBaseUrl}/projects/${projectId}/export/${format}`;

      const response = await fetch(url, {
        headers: token ? { Authorization: `Bearer ${token}` } : undefined,
      });

      if (!response.ok) {
        let errorMessage = `Export failed (${response.status}).`;
        try {
          const data = (await response.json()) as ApiErrorPayload;
          if (data?.error?.message) {
            errorMessage = data.error.message;
          }
        } catch {
          // Ignore non-JSON error responses.
        }
        throw new Error(errorMessage);
      }

      const contentLength = Number(response.headers.get("Content-Length") ?? 0);
      const total = Number.isFinite(contentLength) && contentLength > 0 ? contentLength : undefined;
      const reader = response.body?.getReader();
      const chunks: Uint8Array[] = [];
      let loaded = 0;

      if (reader) {
        while (true) {
          const { done, value } = await reader.read();
          if (done) break;
          if (value) {
            chunks.push(value);
            loaded += value.length;
            setProgress({ loaded, total });
          }
        }
      } else {
        const blob = await response.blob();
        chunks.push(new Uint8Array(await blob.arrayBuffer()));
        loaded = chunks[0].length;
        setProgress({ loaded, total });
      }

      const blob = new Blob(chunks, {
        type: response.headers.get("Content-Type") ?? "application/octet-stream",
      });
      const fallbackName = format === "html" ? "gazette.html.zip" : "gazette-videos.zip";
      const filename = getFilenameFromHeader(
        response.headers.get("Content-Disposition"),
        fallbackName
      );
      const downloadUrl = window.URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = downloadUrl;
      link.download = filename;
      link.click();
      window.URL.revokeObjectURL(downloadUrl);

      setStatus("success");
      setMessage(`${EXPORT_LABELS[format]} is ready. Your download should begin shortly.`);
      toast({
        title: "Export ready",
        description: `${EXPORT_LABELS[format]} is ready.`,
        variant: "success",
      });
    } catch (error) {
      const description = error instanceof Error ? error.message : "Unable to export right now.";
      setStatus("error");
      setMessage(description);
      toast({
        title: "Export failed",
        description,
        variant: "destructive",
      });
    }
  };

  const handlePrint = () => {
    setActiveExport("pdf");
    setStatus("success");
    setProgress(null);
    setMessage("Print dialog opened. Choose “Save as PDF” for a file export.");
    window.print();
  };

  const isBusy = status === "downloading";

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-xl">
        <DialogHeader>
          <DialogTitle>Export Gazette</DialogTitle>
          <DialogDescription>
            Choose a format to share or archive your gazette. Downloads include all pages.
          </DialogDescription>
        </DialogHeader>

        <div className="grid gap-3">
          <div className="rounded-md border border-sepia/20 bg-cream/70 p-4">
            <div className="flex items-start justify-between gap-4">
              <div>
                <p className="font-ui text-sm font-semibold text-ink">📄 Download as HTML</p>
                <p className="font-ui text-xs text-muted">
                  Standalone webpage for offline sharing.
                </p>
              </div>
              <Button
                type="button"
                variant="outline"
                onClick={() => handleDownload("html")}
                disabled={isBusy}
              >
                {status === "downloading" && activeExport === "html" ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <Download />
                )}
                HTML ZIP
              </Button>
            </div>
          </div>

          <div className="rounded-md border border-sepia/20 bg-cream/70 p-4">
            <div className="flex items-start justify-between gap-4">
              <div>
                <p className="font-ui text-sm font-semibold text-ink">🎬 Download Videos</p>
                <p className="font-ui text-xs text-muted">ZIP with all generated clips.</p>
              </div>
              <Button
                type="button"
                variant="outline"
                onClick={() => handleDownload("videos")}
                disabled={isBusy}
              >
                {status === "downloading" && activeExport === "videos" ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <Film />
                )}
                Video ZIP
              </Button>
            </div>
          </div>

          <div className="rounded-md border border-sepia/20 bg-cream/70 p-4">
            <div className="flex items-start justify-between gap-4">
              <div>
                <p className="font-ui text-sm font-semibold text-ink">🖨️ Print / Save PDF</p>
                <p className="font-ui text-xs text-muted">Optimized for A4 or Letter paper.</p>
              </div>
              <Button type="button" variant="outline" onClick={handlePrint} disabled={isBusy}>
                <Printer />
                Print PDF
              </Button>
            </div>
          </div>
        </div>

        {(status === "downloading" || status === "success" || status === "error") && (
          <div className="rounded-md border border-sepia/20 bg-parchment/80 p-4">
            <div className="flex items-start gap-3">
              {status === "downloading" && <Download className="mt-0.5 h-4 w-4 text-gold" />}
              {status === "success" && (
                <CheckCircle2 className="mt-0.5 h-4 w-4 text-forest-green" />
              )}
              {status === "error" && <TriangleAlert className="mt-0.5 h-4 w-4 text-aged-red" />}
              <div className="flex-1">
                <p className="font-ui text-sm font-semibold text-ink">
                  {status === "downloading"
                    ? `Exporting ${activeExport ? EXPORT_LABELS[activeExport] : "file"}`
                    : status === "success"
                      ? "Export ready"
                      : "Export failed"}
                </p>
                <p className="font-ui text-xs text-muted">{message}</p>

                {status === "downloading" && (
                  <div className="mt-3">
                    <div className="h-2 w-full rounded-full bg-cream/70">
                      <div
                        className={cn(
                          "h-2 rounded-full bg-gold transition-all",
                          progressPercent === null && "animate-pulse"
                        )}
                        style={{ width: progressPercent === null ? "45%" : `${progressPercent}%` }}
                      />
                    </div>
                    <p className="mt-2 font-ui text-[11px] text-muted">
                      {progressPercent === null
                        ? "Preparing download..."
                        : `Downloading ${progressPercent}%`}
                    </p>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
