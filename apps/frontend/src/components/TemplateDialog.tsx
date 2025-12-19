import { useEffect, useMemo, useState } from "react";
import type { Template } from "@gazette/shared";
import { TEMPLATES } from "@gazette/shared/constants";

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
import { toast } from "@/components/ui/use-toast";
import { Loader2 } from "lucide-react";

export type TemplateOption = {
  id: Template;
  name: string;
  description: string;
};

export const TEMPLATE_OPTIONS: TemplateOption[] = [
  {
    id: TEMPLATES.MASTHEAD,
    name: "Masthead",
    description: "Bold masthead with a hero image and subheading.",
  },
  {
    id: TEMPLATES.FULL_PAGE,
    name: "Full Page",
    description: "Single hero image with headline and caption.",
  },
  {
    id: TEMPLATES.TWO_COLUMNS,
    name: "Two Columns",
    description: "Two-column photo spread with captions.",
  },
  {
    id: TEMPLATES.THREE_GRID,
    name: "Three Grid",
    description: "Three photo grid with captions.",
  },
];

type TemplateDialogProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onCreate: (templateId: Template) => Promise<void>;
};

const previewShellClasses =
  "relative h-36 w-full overflow-hidden rounded-sm border border-sepia/20 bg-cream/80 p-2 shadow-inner";

function TemplatePreview({ templateId }: { templateId: string }) {
  switch (templateId) {
    case TEMPLATES.MASTHEAD:
      return (
        <div className={previewShellClasses}>
          <div className="mb-2 h-3 w-3/4 rounded-sm bg-ink/30" />
          <div className="mb-2 h-2 w-2/3 rounded-sm bg-ink/20" />
          <div className="mb-2 h-16 w-full rounded-sm bg-ink/10" />
          <div className="h-2 w-1/2 rounded-sm bg-ink/15" />
        </div>
      );
    case TEMPLATES.FULL_PAGE:
      return (
        <div className={previewShellClasses}>
          <div className="mb-2 h-3 w-2/3 rounded-sm bg-ink/25" />
          <div className="h-20 w-full rounded-sm bg-ink/10" />
          <div className="mt-2 h-2 w-1/2 rounded-sm bg-ink/15" />
        </div>
      );
    case TEMPLATES.TWO_COLUMNS:
      return (
        <div className={previewShellClasses}>
          <div className="mb-2 h-3 w-2/3 rounded-sm bg-ink/25" />
          <div className="grid h-24 grid-cols-2 gap-2">
            <div className="rounded-sm bg-ink/10" />
            <div className="rounded-sm bg-ink/15" />
          </div>
          <div className="mt-2 grid grid-cols-2 gap-2">
            <div className="h-2 rounded-sm bg-ink/15" />
            <div className="h-2 rounded-sm bg-ink/10" />
          </div>
        </div>
      );
    case TEMPLATES.THREE_GRID:
      return (
        <div className={previewShellClasses}>
          <div className="mb-2 h-3 w-3/5 rounded-sm bg-ink/25" />
          <div className="grid h-24 grid-cols-3 gap-2">
            <div className="rounded-sm bg-ink/10" />
            <div className="rounded-sm bg-ink/15" />
            <div className="rounded-sm bg-ink/20" />
          </div>
        </div>
      );
    default:
      return <div className={previewShellClasses} />;
  }
}

export function TemplateDialog({ open, onOpenChange, onCreate }: TemplateDialogProps) {
  const [selectedId, setSelectedId] = useState<Template>(
    TEMPLATE_OPTIONS[0]?.id ?? TEMPLATES.MASTHEAD
  );
  const [isCreating, setIsCreating] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const selectedTemplate = useMemo(
    () => TEMPLATE_OPTIONS.find((template) => template.id === selectedId),
    [selectedId]
  );

  useEffect(() => {
    if (open) {
      setSelectedId(TEMPLATE_OPTIONS[0]?.id ?? TEMPLATES.MASTHEAD);
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
      await onCreate(selectedTemplate.id);
      toast({
        title: "Page created",
        description: "Your new page is ready to edit.",
        variant: "success",
      });
      onOpenChange(false);
    } catch (err) {
      const message = err instanceof Error ? err.message : "Unable to create page.";
      setError(message);
      toast({
        title: "Unable to create page",
        description: message,
        variant: "destructive",
      });
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
            {isCreating ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" />
                Creating...
              </>
            ) : (
              "Create page"
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
