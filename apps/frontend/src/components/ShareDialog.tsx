import { useEffect, useState } from "react";
import { Check, Copy, Info, Loader2 } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { api, parseApiError } from "@/lib/api";
import { toast } from "@/components/ui/use-toast";

type ShareDialogProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  projectId?: string | null;
  projectName?: string | null;
};

type ProjectData = {
  id: string;
  name: string;
  slug: string;
  createdAt: string;
  updatedAt: string;
};

export function ShareDialog({ open, onOpenChange, projectId, projectName }: ShareDialogProps) {
  const [shareUrl, setShareUrl] = useState<string>("");
  const [copyStatus, setCopyStatus] = useState<"idle" | "copied" | "error">("idle");
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!open || !projectId) {
      setShareUrl("");
      setCopyStatus("idle");
      setIsLoading(true);
      setError(null);
      return;
    }

    const fetchProjectSlug = async () => {
      setIsLoading(true);
      setError(null);
      try {
        const project = await api.get(`projects/${projectId}`).json<ProjectData>();
        const baseUrl = window.location.origin;
        const url = `${baseUrl}/view/${project.slug}`;
        setShareUrl(url);
      } catch (err) {
        const parsed = await parseApiError(err);
        setError(parsed.message);
        toast({
          title: "Unable to load share link",
          description: parsed.message,
          variant: "destructive",
        });
      } finally {
        setIsLoading(false);
      }
    };

    void fetchProjectSlug();
  }, [open, projectId, toast]);

  const handleCopyLink = async () => {
    if (!shareUrl) return;

    try {
      if (navigator.clipboard?.writeText) {
        await navigator.clipboard.writeText(shareUrl);
      } else {
        // Fallback for older browsers
        const textarea = document.createElement("textarea");
        textarea.value = shareUrl;
        textarea.style.position = "fixed";
        textarea.style.left = "-9999px";
        document.body.appendChild(textarea);
        textarea.select();
        document.execCommand("copy");
        document.body.removeChild(textarea);
      }
      setCopyStatus("copied");
      toast({
        title: "Link copied",
        description: "Share link copied to clipboard.",
        variant: "success",
      });
    } catch {
      setCopyStatus("error");
      toast({
        title: "Copy failed",
        description: "Please copy the link manually.",
        variant: "destructive",
      });
    }

    // Reset copy status after 2 seconds
    setTimeout(() => setCopyStatus("idle"), 2000);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-xl">
        <DialogHeader>
          <DialogTitle>Share Your Gazette</DialogTitle>
          <DialogDescription>
            Anyone with this link and the project password can view your gazette.
          </DialogDescription>
        </DialogHeader>

        {isLoading ? (
          <div className="py-6 text-center">
            <p className="flex items-center justify-center gap-2 font-ui text-sm text-muted">
              <Loader2 className="h-4 w-4 animate-spin" />
              Loading share link...
            </p>
          </div>
        ) : error ? (
          <div className="rounded-md border border-aged-red/40 bg-aged-red/10 px-4 py-3">
            <p className="font-ui text-sm text-aged-red">{error}</p>
          </div>
        ) : (
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="share-url" className="font-ui text-xs uppercase tracking-wider">
                Share Link
              </Label>
              <div className="flex gap-2">
                <Input
                  id="share-url"
                  value={shareUrl}
                  readOnly
                  className="flex-1 font-mono text-sm"
                />
                <Button
                  type="button"
                  variant="outline"
                  onClick={handleCopyLink}
                  disabled={!shareUrl}
                  className="min-w-[100px]"
                >
                  {copyStatus === "copied" ? (
                    <>
                      <Check className="h-4 w-4" />
                      Copied
                    </>
                  ) : (
                    <>
                      <Copy className="h-4 w-4" />
                      Copy
                    </>
                  )}
                </Button>
              </div>
            </div>

            <div className="rounded-md border border-sepia/20 bg-cream/70 p-4">
              <div className="flex items-start gap-3">
                <Info className="mt-0.5 h-4 w-4 flex-shrink-0 text-gold" />
                <div className="flex-1">
                  <p className="font-ui text-sm font-semibold text-ink">Password Required</p>
                  <p className="font-ui text-xs text-muted">
                    Recipients will need to enter the project password to view this gazette.
                    {projectName && (
                      <>
                        {" "}
                        The password is the same one used to access{" "}
                        <span className="font-semibold text-ink">"{projectName}"</span>.
                      </>
                    )}
                  </p>
                </div>
              </div>
            </div>

            {copyStatus === "error" && (
              <div className="rounded-md border border-aged-red/40 bg-aged-red/10 px-4 py-3">
                <p className="font-ui text-sm text-aged-red">
                  Failed to copy link. Please try selecting and copying manually.
                </p>
              </div>
            )}
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
