import { useEffect, useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
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

export function ShareDialog({ open, onOpenChange, projectId }: ShareDialogProps) {
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
  }, [open, projectId]);

  const handleCopyLink = async () => {
    if (!shareUrl) return;

    try {
      if (navigator.clipboard?.writeText) {
        await navigator.clipboard.writeText(shareUrl);
      } else {
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

    setTimeout(() => setCopyStatus("idle"), 2000);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-[600px] rounded-[8px] border-sepia/30 bg-parchment shadow-2xl">
        <DialogHeader>
          <DialogTitle>Share Your Gazette</DialogTitle>
        </DialogHeader>

        {isLoading ? (
          <div className="py-6 text-center">
            <p className="font-ui text-sm text-muted">Loading share link...</p>
          </div>
        ) : error ? (
          <div className="rounded-[8px] border border-aged-red/40 bg-aged-red/10 px-4 py-3">
            <p className="font-ui text-sm text-aged-red">{error}</p>
          </div>
        ) : (
          <div className="space-y-5">
            <p className="font-ui text-sm text-muted">
              Your gazette is ready to share! Anyone with the link and password can view it.
            </p>

            <div className="space-y-2">
              <Label htmlFor="share-url" className="font-ui text-sm text-muted">
                Share Link
              </Label>
              <div className="flex items-center gap-2">
                <Input id="share-url" value={shareUrl} readOnly className="input-vintage" />
                <Button
                  type="button"
                  variant="outline"
                  onClick={handleCopyLink}
                  disabled={!shareUrl}
                  className="min-w-[48px]"
                  aria-label="Copy share link"
                >
                  📋
                </Button>
              </div>
              <p className="text-xs text-muted">
                {copyStatus === "copied" ? "Copied to clipboard" : "Copy to clipboard"}
              </p>
            </div>

            <div className="rounded-[8px] border border-sepia/20 bg-cream/70 p-4">
              <p className="font-ui text-sm font-semibold text-ink">Password: famille2024</p>
              <p className="text-xs text-muted">(This is the same password you use to edit)</p>
            </div>

            <div className="space-y-2">
              <Label className="font-ui text-sm text-muted">Share via:</Label>
              <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
                <Button variant="outline" type="button">
                  ✉️ Email
                </Button>
                <Button variant="outline" type="button">
                  📱 WhatsApp
                </Button>
                <Button variant="outline" type="button">
                  💬 Message
                </Button>
                <Button variant="outline" type="button">
                  📧 Gmail
                </Button>
              </div>
            </div>

            {copyStatus === "error" ? (
              <div className="rounded-[8px] border border-aged-red/40 bg-aged-red/10 px-4 py-3">
                <p className="font-ui text-sm text-aged-red">
                  Failed to copy link. Please try selecting and copying manually.
                </p>
              </div>
            ) : null}
          </div>
        )}

        <div className="flex justify-end">
          <Button
            type="button"
            onClick={() => onOpenChange(false)}
            className="bg-gold text-ink hover:bg-gold/90"
          >
            Done
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
