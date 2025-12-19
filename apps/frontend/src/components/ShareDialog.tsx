import { useEffect, useState } from "react";
import { Check, Copy, Info, Loader2, Mail, MessageCircle, QrCode, Smartphone } from "lucide-react";
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { api, parseApiError } from "@/lib/api";
import { toast } from "@/components/ui/use-toast";
import { QRCodeCanvas } from "qrcode.react";

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
  const [showQrCode, setShowQrCode] = useState(false);

  useEffect(() => {
    if (!open || !projectId) {
      setShareUrl("");
      setCopyStatus("idle");
      setIsLoading(true);
      setError(null);
      setShowQrCode(false);
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

  const shareMessage = projectName
    ? `Check out "${projectName}" on La Gazette de la Vie: ${shareUrl}`
    : `Check out this gazette on La Gazette de la Vie: ${shareUrl}`;
  const encodedMessage = encodeURIComponent(shareMessage);
  const encodedSubject = encodeURIComponent("Shared Gazette");
  const mailtoLink = `mailto:?subject=${encodedSubject}&body=${encodedMessage}`;
  const whatsappLink = `https://wa.me/?text=${encodedMessage}`;
  const smsLink = `sms:?body=${encodedMessage}`;

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
          <div className="space-y-5">
            <div className="space-y-2">
              <Label htmlFor="share-url" className="font-ui text-xs uppercase tracking-wider">
                Share Link
              </Label>
              <div className="flex gap-2">
                <Input
                  id="share-url"
                  value={shareUrl}
                  readOnly
                  className={`flex-1 font-mono text-sm transition ${
                    copyStatus === "copied"
                      ? "border-emerald-300/70 ring-2 ring-emerald-200/70"
                      : ""
                  }`}
                />
                <Button
                  type="button"
                  variant="outline"
                  onClick={handleCopyLink}
                  disabled={!shareUrl}
                  className={`min-w-[100px] transition ${
                    copyStatus === "copied"
                      ? "border-emerald-300 bg-emerald-50 text-emerald-800 shadow-sm animate-in zoom-in-95"
                      : ""
                  }`}
                >
                  {copyStatus === "copied" ? (
                    <>
                      <Check className="h-4 w-4 animate-in zoom-in-95" />
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
              {copyStatus === "copied" && (
                <div className="flex items-center gap-2 rounded-md border border-emerald-200 bg-emerald-50 px-3 py-2 text-emerald-800 animate-in fade-in zoom-in-95">
                  <Check className="h-4 w-4" />
                  <span className="font-ui text-sm font-semibold">
                    Link copied. You can paste it anywhere.
                  </span>
                </div>
              )}
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

            <div className="space-y-3">
              <Label className="font-ui text-xs uppercase tracking-wider">Share via</Label>
              <div className="grid gap-2 sm:grid-cols-3">
                <Button asChild variant="outline" className="justify-start gap-2">
                  <a href={mailtoLink}>
                    <Mail className="h-4 w-4" />
                    Email
                  </a>
                </Button>
                <Button asChild variant="outline" className="justify-start gap-2">
                  <a href={whatsappLink} target="_blank" rel="noreferrer">
                    <MessageCircle className="h-4 w-4" />
                    WhatsApp
                  </a>
                </Button>
                <Button asChild variant="outline" className="justify-start gap-2">
                  <a href={smsLink}>
                    <Smartphone className="h-4 w-4" />
                    Message
                  </a>
                </Button>
              </div>
            </div>

            <div className="rounded-md border border-secondary/40 bg-cream/60 p-4">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div>
                  <p className="font-ui text-sm font-semibold text-ink">QR Code</p>
                  <p className="font-ui text-xs text-muted">
                    Let guests scan and open the gazette instantly.
                  </p>
                </div>
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setShowQrCode((prev) => !prev)}
                  disabled={!shareUrl}
                >
                  <QrCode className="h-4 w-4" />
                  {showQrCode ? "Hide QR" : "Show QR"}
                </Button>
              </div>
              {showQrCode && (
                <div className="mt-4 flex items-center justify-center rounded-md border border-secondary/30 bg-white p-4">
                  <QRCodeCanvas value={shareUrl} size={170} bgColor="#ffffff" fgColor="#2d241c" />
                </div>
              )}
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

        <DialogFooter className="pt-2">
          <DialogClose asChild>
            <Button type="button" className="min-w-[120px]">
              Done
            </Button>
          </DialogClose>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
