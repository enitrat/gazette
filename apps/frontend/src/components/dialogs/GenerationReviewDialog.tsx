import { useEffect, useState, useMemo } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { ScrollArea } from "@/components/ui/scroll-area";
import { useUIStore } from "@/stores/ui-store";
import { useAuthStore } from "@/stores/auth-store";
import { usePagesStore } from "@/stores/pages-store";
import api, { images } from "@/lib/api";
import type { SerializedElement } from "@/lib/api";
import {
  Sparkles,
  Loader2,
  AlertCircle,
  Image as ImageIcon,
  FileText,
  Play,
  ChevronRight,
} from "lucide-react";
import { toast } from "sonner";

interface ImageElementWithPage {
  element: SerializedElement & { type: "image" };
  pageTitle: string;
  pageOrder: number;
}

export function GenerationReviewDialog() {
  const { activeDialog, closeDialog, openDialog } = useUIStore();
  const { currentProject } = useAuthStore();
  const pages = usePagesStore((state) => state.pages);

  const [imageElements, setImageElements] = useState<ImageElementWithPage[]>([]);
  const [prompts, setPrompts] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(true);
  const [generating, setGenerating] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Fetch all image elements from all pages
  useEffect(() => {
    if (activeDialog !== "generation" || !currentProject || pages.length === 0) {
      return;
    }

    const fetchAllElements = async () => {
      setLoading(true);
      setError(null);

      try {
        const allImageElements: ImageElementWithPage[] = [];
        const initialPrompts: Record<string, string> = {};

        // Fetch elements for each page
        for (const page of pages) {
          const elements = await api.elements.list(page.id);

          // Filter image elements
          const pageImageElements = elements.filter(
            (el): el is SerializedElement & { type: "image" } => {
              if (el.type !== "image") return false;
              if (el.videoStatus === "complete" && el.videoUrl) return false;
              if (el.videoStatus === "pending" || el.videoStatus === "processing") return false;
              return true;
            }
          );

          for (const element of pageImageElements) {
            allImageElements.push({
              element,
              pageTitle: page.title || `Page ${page.order + 1}`,
              pageOrder: page.order,
            });

            // Initialize prompt from element or empty string
            initialPrompts[element.id] = element.animationPrompt || "";
          }
        }

        // Sort by page order
        allImageElements.sort((a, b) => a.pageOrder - b.pageOrder);

        setImageElements(allImageElements);
        setPrompts(initialPrompts);
      } catch (err) {
        setError(err instanceof Error ? err.message : "Failed to fetch elements");
      } finally {
        setLoading(false);
      }
    };

    fetchAllElements();
  }, [activeDialog, currentProject, pages]);

  const handlePromptChange = (elementId: string, value: string) => {
    setPrompts((prev) => ({
      ...prev,
      [elementId]: value,
    }));
  };

  const handleGenerate = async () => {
    if (!currentProject) return;

    setGenerating(true);

    try {
      // First, update all prompts that have been modified
      const updatePromises = imageElements
        .filter((item) => {
          const currentPrompt = prompts[item.element.id] || "";
          const originalPrompt = item.element.animationPrompt || "";
          return currentPrompt !== originalPrompt;
        })
        .map((item) =>
          api.elements.update(item.element.id, {
            animationPrompt: prompts[item.element.id] || null,
          })
        );

      if (updatePromises.length > 0) {
        await Promise.all(updatePromises);
      }

      // Then generate for each page that has images
      const pageIds = [...new Set(imageElements.map((item) => item.element.pageId))];

      for (const pageId of pageIds) {
        await api.generation.generatePage(pageId);
      }

      toast.success("Generation started", {
        description: `Started generation for ${imageElements.length} image(s)`,
      });

      // Close this dialog and open progress dialog
      closeDialog();
      setTimeout(() => openDialog("progress"), 100);
    } catch (err) {
      toast.error("Failed to start generation", {
        description: err instanceof Error ? err.message : "Unknown error",
      });
    } finally {
      setGenerating(false);
    }
  };

  const imagesWithoutPrompt = useMemo(
    () => imageElements.filter((item) => !prompts[item.element.id]?.trim()).length,
    [imageElements, prompts]
  );

  const imagesWithPrompt = imageElements.length - imagesWithoutPrompt;

  return (
    <Dialog
      open={activeDialog === "generation"}
      onOpenChange={(open) => {
        if (!open) closeDialog();
      }}
    >
      <DialogContent className="sm:max-w-[700px] max-h-[85vh] bg-[#f4f1e8] border-4 border-[#2c2416] shadow-2xl flex flex-col">
        {/* Ornamental corners */}
        <div className="absolute top-0 left-0 w-10 h-10 border-t-2 border-l-2 border-[#d4af37]" />
        <div className="absolute top-0 right-0 w-10 h-10 border-t-2 border-r-2 border-[#d4af37]" />
        <div className="absolute bottom-0 left-0 w-10 h-10 border-b-2 border-l-2 border-[#d4af37]" />
        <div className="absolute bottom-0 right-0 w-10 h-10 border-b-2 border-r-2 border-[#d4af37]" />

        <DialogHeader className="space-y-4 pt-2">
          <DialogTitle className="text-3xl font-serif text-center text-[#2c2416] tracking-wide border-b-2 border-[#2c2416] pb-3">
            <span className="inline-block relative">
              <Sparkles className="inline-block w-6 h-6 mr-2 mb-1" />
              GENERATION REVIEW
              <div className="absolute -bottom-1 left-0 right-0 h-px bg-[#d4af37]" />
            </span>
          </DialogTitle>
          <DialogDescription className="text-center text-[#2c2416]/70 text-sm italic font-serif">
            Review and edit animation prompts before generating videos
          </DialogDescription>
        </DialogHeader>

        {/* Summary */}
        <div className="flex items-center justify-between py-3 px-4 bg-[#2c2416]/5 border-y-2 border-[#2c2416]/20">
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2">
              <ImageIcon className="w-4 h-4 text-[#2c2416]/60" />
              <span className="text-sm font-serif text-[#2c2416]">
                {imageElements.length} image{imageElements.length !== 1 ? "s" : ""}
              </span>
            </div>
            <div className="flex items-center gap-2">
              <FileText className="w-4 h-4 text-[#2e7d32]" />
              <span className="text-sm font-serif text-[#2e7d32]">
                {imagesWithPrompt} with prompt
              </span>
            </div>
            {imagesWithoutPrompt > 0 && (
              <div className="flex items-center gap-2">
                <AlertCircle className="w-4 h-4 text-[#d4af37]" />
                <span className="text-sm font-serif text-[#d4af37]">
                  {imagesWithoutPrompt} without prompt
                </span>
              </div>
            )}
          </div>
        </div>

        {/* Images list */}
        <ScrollArea className="flex-1 min-h-0 py-2">
          <div className="space-y-4 pr-4">
            {loading ? (
              <div className="flex flex-col items-center justify-center py-12 space-y-3">
                <Loader2 className="w-8 h-8 text-[#d4af37] animate-spin" />
                <p className="text-sm font-serif text-[#2c2416]/70">
                  Loading images from all pages...
                </p>
              </div>
            ) : error ? (
              <div className="flex items-start gap-3 p-4 border-2 border-[#8b4513] bg-[#8b4513]/10 rounded-sm">
                <AlertCircle className="w-5 h-5 text-[#8b4513] flex-shrink-0 mt-0.5" />
                <div className="flex-1">
                  <p className="text-sm font-serif font-semibold text-[#8b4513]">Error</p>
                  <p className="text-xs font-serif text-[#8b4513]/80 mt-1">{error}</p>
                </div>
              </div>
            ) : imageElements.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-12 space-y-3 text-center">
                <div className="w-16 h-16 rounded-full bg-[#2c2416]/5 flex items-center justify-center">
                  <ImageIcon className="w-8 h-8 text-[#2c2416]/30" />
                </div>
                <div>
                  <p className="text-sm font-serif font-semibold text-[#2c2416]">No images found</p>
                  <p className="text-xs font-serif text-[#2c2416]/60 mt-1">
                    Add images to your pages to generate animated videos
                  </p>
                </div>
              </div>
            ) : (
              imageElements.map((item, index) => (
                <div
                  key={item.element.id}
                  className="p-4 border-2 border-[#2c2416]/20 bg-white/50 rounded-sm animate-in fade-in-50 slide-in-from-left-5"
                  style={{ animationDelay: `${index * 30}ms` }}
                >
                  <div className="flex gap-4">
                    {/* Image thumbnail */}
                    <div className="flex-shrink-0 w-24 h-24 bg-[#2c2416]/5 border border-[#2c2416]/20 rounded-sm overflow-hidden">
                      {item.element.imageId ? (
                        <img
                          src={images.getUrl(item.element.imageId)}
                          alt="Element preview"
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center">
                          <ImageIcon className="w-8 h-8 text-[#2c2416]/20" />
                        </div>
                      )}
                    </div>

                    {/* Content */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-2">
                        <span className="text-xs font-serif font-semibold text-[#8b4513] bg-[#8b4513]/10 px-2 py-0.5 rounded-sm">
                          {item.pageTitle}
                        </span>
                        <ChevronRight className="w-3 h-3 text-[#2c2416]/30" />
                        <span className="text-xs font-serif text-[#2c2416]/60">
                          Image {index + 1}
                        </span>
                      </div>

                      <div className="space-y-1">
                        <label className="text-xs font-serif font-medium text-[#2c2416]">
                          Animation Prompt
                        </label>
                        <Textarea
                          value={prompts[item.element.id] || ""}
                          onChange={(e) => handlePromptChange(item.element.id, e.target.value)}
                          onKeyDown={(e) => e.stopPropagation()}
                          placeholder="Describe how this image should animate (e.g., 'Gentle camera zoom in with soft wind motion')"
                          className="min-h-[60px] text-sm font-serif bg-white border-[#2c2416]/20 focus:border-[#d4af37] focus:ring-[#d4af37]/20 placeholder:text-[#2c2416]/40 resize-none"
                        />
                        {!prompts[item.element.id]?.trim() && (
                          <p className="text-xs font-serif text-[#d4af37] italic">
                            No prompt set — AI will auto-generate animation
                          </p>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </ScrollArea>

        {/* Footer */}
        <div className="border-t-2 border-[#2c2416]/20 pt-4 space-y-3">
          {imagesWithoutPrompt > 0 && imageElements.length > 0 && (
            <p className="text-xs font-serif text-center text-[#d4af37] italic">
              Images without prompts will use AI-generated motion suggestions
            </p>
          )}

          <div className="flex gap-3">
            <Button
              onClick={() => closeDialog()}
              variant="outline"
              className="flex-1 border-[#2c2416]/30 bg-white/60 font-serif text-sm text-[#2c2416] hover:bg-white hover:border-[#2c2416]/50"
            >
              Cancel
            </Button>
            <Button
              onClick={handleGenerate}
              disabled={generating || loading || imageElements.length === 0}
              className="flex-1 bg-gradient-to-b from-[#d4af37] to-[#C9A227] hover:from-[#e0bb3e] hover:to-[#d4af37] text-[#2C2416] font-serif text-sm font-medium shadow-md hover:shadow-lg transition-all disabled:opacity-50"
            >
              {generating ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Starting...
                </>
              ) : (
                <>
                  <Play className="w-4 h-4 mr-2" />
                  Generate {imageElements.length} Video
                  {imageElements.length !== 1 ? "s" : ""}
                </>
              )}
            </Button>
          </div>
        </div>

        {/* Decorative stamp */}
        <div className="absolute -top-3 -right-3 opacity-25 pointer-events-none rotate-12">
          <div className="relative w-16 h-16">
            <div className="absolute inset-0 border-4 border-[#8b4513] rounded-sm" />
            <div className="absolute top-1 left-1 right-1 bottom-1 border-2 border-[#8b4513]" />
            <div className="absolute inset-0 flex items-center justify-center">
              <Sparkles className="w-6 h-6 text-[#8b4513]" />
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
