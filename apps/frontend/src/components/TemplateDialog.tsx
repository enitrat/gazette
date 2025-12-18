import { useEffect, useMemo, useState } from "react";

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

export type TemplateOption = {
  id: string;
  name: string;
  description: string;
};

export type CreatedPage = {
  id: string;
  title: string;
  subtitle: string;
  templateId: string;
  order?: number | null;
};

export const TEMPLATE_OPTIONS: TemplateOption[] = [
  {
    id: "classic-front",
    name: "Classic Front",
    description: "Bold masthead with a hero image and lead story.",
  },
  {
    id: "two-column",
    name: "Two Column",
    description: "Balanced editorial layout with two story columns.",
  },
  {
    id: "grid-gallery",
    name: "Grid Gallery",
    description: "A photo-forward grid for collections and highlights.",
  },
  {
    id: "magazine-spread",
    name: "Magazine Spread",
    description: "Large visual with a supporting narrative column.",
  },
];

type TemplateDialogProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onCreated: (page: CreatedPage) => void;
};

const previewShellClasses =
  "relative h-36 w-full overflow-hidden rounded-sm border border-sepia/20 bg-cream/80 p-2 shadow-inner";

function TemplatePreview({ templateId }: { templateId: string }) {
  switch (templateId) {
    case "classic-front":
      return (
        <div className={previewShellClasses}>
          <div className="mb-2 h-3 w-3/4 rounded-sm bg-ink/30" />
          <div className="mb-2 h-16 w-full rounded-sm bg-ink/10" />
          <div className="h-2 w-2/3 rounded-sm bg-ink/20" />
          <div className="mt-1 h-2 w-1/2 rounded-sm bg-ink/10" />
        </div>
      );
    case "two-column":
      return (
        <div className={previewShellClasses}>
          <div className="mb-2 h-3 w-2/3 rounded-sm bg-ink/25" />
          <div className="grid h-24 grid-cols-2 gap-2">
            <div className="space-y-2">
              <div className="h-2 w-full rounded-sm bg-ink/15" />
              <div className="h-2 w-5/6 rounded-sm bg-ink/10" />
              <div className="h-2 w-4/6 rounded-sm bg-ink/10" />
            </div>
            <div className="space-y-2">
              <div className="h-2 w-full rounded-sm bg-ink/15" />
              <div className="h-2 w-5/6 rounded-sm bg-ink/10" />
              <div className="h-2 w-4/6 rounded-sm bg-ink/10" />
            </div>
          </div>
        </div>
      );
    case "grid-gallery":
      return (
        <div className={previewShellClasses}>
          <div className="mb-2 h-3 w-1/2 rounded-sm bg-ink/25" />
          <div className="grid h-24 grid-cols-2 gap-2">
            <div className="rounded-sm bg-ink/10" />
            <div className="rounded-sm bg-ink/20" />
            <div className="rounded-sm bg-ink/20" />
            <div className="rounded-sm bg-ink/10" />
          </div>
        </div>
      );
    case "magazine-spread":
      return (
        <div className={previewShellClasses}>
          <div className="mb-2 h-3 w-3/5 rounded-sm bg-ink/25" />
          <div className="grid h-24 grid-cols-[1.2fr_1fr] gap-2">
            <div className="rounded-sm bg-ink/15" />
            <div className="space-y-2">
              <div className="h-2 w-full rounded-sm bg-ink/15" />
              <div className="h-2 w-5/6 rounded-sm bg-ink/10" />
              <div className="h-2 w-4/6 rounded-sm bg-ink/10" />
              <div className="h-2 w-2/3 rounded-sm bg-ink/10" />
            </div>
          </div>
        </div>
      );
    default:
      return <div className={previewShellClasses} />;
  }
}

export function TemplateDialog({ open, onOpenChange, onCreated }: TemplateDialogProps) {
  const [selectedId, setSelectedId] = useState<string>(TEMPLATE_OPTIONS[0]?.id ?? "");
  const [isCreating, setIsCreating] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const selectedTemplate = useMemo(
    () => TEMPLATE_OPTIONS.find((template) => template.id === selectedId),
    [selectedId]
  );

  useEffect(() => {
    if (open) {
      setSelectedId(TEMPLATE_OPTIONS[0]?.id ?? "");
      setError(null);
    }
  }, [open]);

  const handleCreate = async () => {
    if (!selectedTemplate) {
      setError("Select a template to continue.");
      return;
    }

    setIsCreating(true);
    setError(null);

    try {
      const response = await fetch("/api/pages", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ template_id: selectedTemplate.id }),
      });

      if (!response.ok) {
        let message = "Failed to create page. Please try again.";
        try {
          const data = await response.json();
          if (typeof data?.error === "string") {
            message = data.error;
          } else if (typeof data?.message === "string") {
            message = data.message;
          }
        } catch {
          // Ignore JSON parsing failures and fall back to default message.
        }
        throw new Error(message);
      }

      let payload: Record<string, unknown> | null = null;
      try {
        payload = (await response.json()) as Record<string, unknown>;
      } catch {
        payload = null;
      }

      const resolvedTemplateId =
        (payload?.template_id as string | undefined) ??
        (payload?.template as string | undefined) ??
        selectedTemplate.id;

      const createdPage: CreatedPage = {
        id:
          (payload?.id as string | undefined) ??
          globalThis.crypto?.randomUUID?.() ??
          `page-${Date.now()}`,
        title: (payload?.title as string | undefined) ?? "",
        subtitle: (payload?.subtitle as string | undefined) ?? "",
        templateId: resolvedTemplateId,
        order: (payload?.order as number | undefined) ?? null,
      };

      onCreated(createdPage);
      onOpenChange(false);
    } catch (err) {
      const message = err instanceof Error ? err.message : "Unable to create page.";
      setError(message);
    } finally {
      setIsCreating(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl">
        <DialogHeader className="space-y-2">
          <DialogTitle>Select a template</DialogTitle>
          <DialogDescription>
            Start with a layout and customize it later. Choose the structure that best fits the
            story you want to tell.
          </DialogDescription>
        </DialogHeader>

        <div className="grid gap-4 sm:grid-cols-2">
          {TEMPLATE_OPTIONS.map((template) => {
            const isSelected = template.id === selectedId;
            return (
              <button
                key={template.id}
                type="button"
                onClick={() => setSelectedId(template.id)}
                className={cn(
                  "group rounded-sm border border-sepia/20 bg-card p-4 text-left shadow-sm transition-all hover:border-gold hover:shadow-md",
                  isSelected && "border-gold ring-2 ring-gold/40"
                )}
              >
                <TemplatePreview templateId={template.id} />
                <div className="mt-3 space-y-1">
                  <p className="font-ui text-sm font-semibold text-ink">{template.name}</p>
                  <p className="font-ui text-xs text-muted">{template.description}</p>
                </div>
              </button>
            );
          })}
        </div>

        {error ? (
          <div className="rounded-sm border border-destructive/30 bg-destructive/10 px-3 py-2 text-sm text-destructive">
            {error}
          </div>
        ) : null}

        <DialogFooter className="gap-2">
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button onClick={handleCreate} disabled={!selectedTemplate || isCreating}>
            {isCreating ? "Creating..." : "Create page"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
