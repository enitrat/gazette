import { useEffect, useMemo, useState } from "react";
import type { Template } from "@gazette/shared";
import { TEMPLATES } from "@gazette/shared/constants";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { cn } from "@/lib/utils";
import { toast } from "@/components/ui/use-toast";

export type TemplateOption = {
  id: Template;
  title: string;
};

const TEMPLATE_OPTIONS: TemplateOption[] = [
  { id: TEMPLATES.MASTHEAD, title: "Classic Front Page" },
  { id: TEMPLATES.TWO_COLUMNS, title: "Two Column Feature" },
  { id: TEMPLATES.THREE_GRID, title: "Grid Gallery" },
  { id: TEMPLATES.FULL_PAGE, title: "Magazine Spread" },
];

type TemplateDialogProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onCreate: (templateId: Template) => Promise<void>;
};

const previewShellClasses =
  "relative h-40 w-full overflow-hidden rounded-[8px] border border-sepia/20 bg-cream/80 p-3 shadow-inner";

function TemplatePreview({ templateId }: { templateId: string }) {
  switch (templateId) {
    case TEMPLATES.MASTHEAD:
      return (
        <div className={previewShellClasses}>
          <div className="mb-2 h-3 w-3/4 rounded-sm bg-ink/25" />
          <div className="mb-2 h-2 w-2/3 rounded-sm bg-ink/20" />
          <div className="mb-2 h-16 w-full rounded-sm bg-ink/10" />
          <div className="grid grid-cols-2 gap-2">
            <div className="h-6 rounded-sm bg-ink/15" />
            <div className="h-6 rounded-sm bg-ink/10" />
          </div>
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
          <div className="grid h-16 grid-cols-3 gap-2">
            <div className="rounded-sm bg-ink/10" />
            <div className="rounded-sm bg-ink/15" />
            <div className="rounded-sm bg-ink/20" />
          </div>
          <div className="mt-2 h-8 w-full rounded-sm bg-ink/10" />
        </div>
      );
    case TEMPLATES.FULL_PAGE:
      return (
        <div className={previewShellClasses}>
          <div className="mb-2 h-3 w-2/3 rounded-sm bg-ink/25" />
          <div className="grid h-24 grid-cols-[2fr_1fr] gap-2">
            <div className="rounded-sm bg-ink/10" />
            <div className="flex flex-col gap-2">
              <div className="h-3 w-full rounded-sm bg-ink/20" />
              <div className="h-3 w-4/5 rounded-sm bg-ink/15" />
              <div className="h-3 w-2/3 rounded-sm bg-ink/10" />
              <div className="mt-auto h-6 rounded-sm bg-ink/15" />
            </div>
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
    () => TEMPLATE_OPTIONS.find((template) => template.id === selectedId) ?? null,
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
      <DialogContent className="max-w-[800px] rounded-[8px] border-sepia/30 bg-parchment shadow-2xl">
        <DialogHeader className="space-y-1">
          <DialogTitle>Choose Page Template</DialogTitle>
        </DialogHeader>

        <RadioGroup
          value={selectedId}
          onValueChange={(value) => setSelectedId(value as Template)}
          className="grid gap-4 md:grid-cols-2"
        >
          {TEMPLATE_OPTIONS.map((template) => {
            const isSelected = template.id === selectedId;
            return (
              <label
                key={template.id}
                htmlFor={template.id}
                className={cn(
                  "flex cursor-pointer flex-col gap-3 rounded-[8px] border border-sepia/20 bg-cream/60 p-4 text-center transition",
                  isSelected && "border-gold bg-parchment"
                )}
              >
                <TemplatePreview templateId={template.id} />
                <div className="flex items-center justify-center">
                  <RadioGroupItem id={template.id} value={template.id} />
                </div>
                <div className="font-ui text-sm font-semibold text-ink">{template.title}</div>
              </label>
            );
          })}
        </RadioGroup>

        {error ? (
          <div className="rounded-[8px] border border-destructive/30 bg-destructive/10 px-3 py-2 text-sm text-destructive">
            {error}
          </div>
        ) : null}

        <DialogFooter className="gap-2">
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button
            onClick={handleCreate}
            disabled={!selectedTemplate || isCreating}
            className="bg-gold text-ink hover:bg-gold/90"
          >
            {isCreating ? "Creating..." : "Use Template"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
