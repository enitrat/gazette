import {
  AlertTriangle,
  ImagePlus,
  PanelLeft,
  Plus,
  Save,
  Share2,
  Sparkles,
  Trash2,
  Type,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { cn } from "@/lib/utils";

type ToolbarMessage = {
  tone: "error" | "success" | "info";
  text: string;
};

type EditorToolbarProps = {
  projectName?: string;
  elementCount: number;
  photoCount: number;
  canDelete: boolean;
  isDeleteDialogOpen: boolean;
  onDeleteDialogOpenChange: (open: boolean) => void;
  onConfirmDelete: () => void;
  onOpenSidebar?: () => void;
  onAddPage: () => void;
  onAddImage: () => void;
  onAddText: () => void;
  onRequestDelete: () => void;
  onGenerateAll: () => void;
  onOpenProgress: () => void;
  onOpenShare: () => void;
  onOpenExport: () => void;
  onSave: () => void;
  message?: ToolbarMessage | null;
  disableAddImage?: boolean;
  disableAddText?: boolean;
  disableGenerate?: boolean;
  disableSave?: boolean;
};

const MESSAGE_STYLES: Record<ToolbarMessage["tone"], string> = {
  error: "border-aged-red/30 bg-aged-red/10 text-aged-red",
  success: "border-forest-green/30 bg-forest-green/10 text-forest-green",
  info: "border-sepia/30 bg-cream/70 text-muted",
};

export function EditorToolbar({
  projectName,
  elementCount,
  photoCount,
  canDelete,
  isDeleteDialogOpen,
  onDeleteDialogOpenChange,
  onConfirmDelete,
  onOpenSidebar,
  onAddPage,
  onAddImage,
  onAddText,
  onRequestDelete,
  onGenerateAll,
  onOpenProgress,
  onOpenShare,
  onOpenExport,
  onSave,
  message,
  disableAddImage,
  disableAddText,
  disableGenerate,
  disableSave,
}: EditorToolbarProps) {
  const showPhotoWarning = photoCount > 5;

  return (
    <header className="editor-toolbar border-b border-sepia/20 bg-parchment/90 px-4 py-2 md:px-6 md:py-3">
      <div className="flex flex-col gap-3">
        <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
          <div className="flex items-center gap-3">
            <Button
              type="button"
              variant="ghost"
              size="icon"
              className="md:hidden"
              onClick={onOpenSidebar}
              aria-label="Open pages panel"
            >
              <PanelLeft />
            </Button>
            <span className="font-masthead text-2xl text-sepia text-ink-effect">
              La Gazette de la Vie
            </span>
            {projectName ? (
              <span className="rounded-full border border-sepia/30 bg-cream/70 px-3 py-1 font-ui text-xs text-muted">
                {projectName}
              </span>
            ) : null}
          </div>
          <div className="flex flex-wrap items-center gap-2 md:justify-end">
            <Button type="button" variant="outline" onClick={onAddPage}>
              <Plus />
              Add Page
            </Button>
            <Button type="button" variant="outline" onClick={onAddImage} disabled={disableAddImage}>
              <ImagePlus />
              Add Image
            </Button>
            <Button type="button" variant="outline" onClick={onAddText} disabled={disableAddText}>
              <Type />
              Add Text
            </Button>
            <Button
              type="button"
              variant="destructive"
              onClick={onRequestDelete}
              disabled={!canDelete}
            >
              <Trash2 />
              Delete
            </Button>
            <Button type="button" onClick={onGenerateAll} disabled={disableGenerate}>
              <Sparkles />
              Generate All
            </Button>
            <Button type="button" variant="outline" onClick={onOpenProgress}>
              View generation
            </Button>
            <Button type="button" variant="outline" onClick={onOpenShare}>
              <Share2 />
              Share
            </Button>
            <Button type="button" variant="outline" onClick={onOpenExport}>
              Export
            </Button>
            <Button type="button" variant="ghost" onClick={onSave} disabled={disableSave}>
              <Save />
              Save
            </Button>
          </div>
        </div>
        <div className="flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
          <div className="flex flex-wrap items-center gap-2 text-xs">
            <div className="flex items-center gap-2 rounded-sm border border-sepia/20 bg-cream/70 px-3 py-1 font-ui text-muted">
              <span>Elements: {elementCount}</span>
              <span className="h-3 w-px bg-sepia/30" />
              <span className={cn(showPhotoWarning && "font-semibold text-aged-red")}>
                Photos: {photoCount}
              </span>
              {showPhotoWarning ? <AlertTriangle className="h-3 w-3 text-aged-red" /> : null}
            </div>
            {showPhotoWarning ? (
              <span className="font-ui text-xs text-aged-red">
                Too many photos on this page (limit is 5).
              </span>
            ) : null}
          </div>
          {message ? (
            <div
              className={cn(
                "rounded-sm border px-3 py-1 text-xs font-ui",
                MESSAGE_STYLES[message.tone]
              )}
            >
              {message.text}
            </div>
          ) : null}
        </div>
      </div>

      <Dialog open={isDeleteDialogOpen} onOpenChange={onDeleteDialogOpenChange}>
        <DialogContent className="max-w-md border-sepia/20 bg-parchment">
          <DialogHeader>
            <DialogTitle>Delete selected element?</DialogTitle>
            <DialogDescription>
              This will remove the element from the page. You can add a new element later if you
              need it.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="gap-2 sm:gap-3">
            <Button variant="outline" onClick={() => onDeleteDialogOpenChange(false)}>
              Cancel
            </Button>
            <Button variant="destructive" onClick={onConfirmDelete}>
              Delete element
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </header>
  );
}
