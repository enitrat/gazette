import {
  AlertTriangle,
  ImagePlus,
  MoreHorizontal,
  PanelLeft,
  Plus,
  Save,
  Share2,
  Sparkles,
  Trash2,
  Type,
} from "lucide-react";
import { Button, type ButtonProps } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Separator } from "@/components/ui/separator";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
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

type ToolbarButtonProps = ButtonProps & {
  tooltip: string;
};

function ToolbarButton({ tooltip, ...props }: ToolbarButtonProps) {
  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <Button {...props} />
      </TooltipTrigger>
      <TooltipContent>{tooltip}</TooltipContent>
    </Tooltip>
  );
}

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
      <TooltipProvider>
        <div className="flex flex-col gap-3">
          <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
            <div className="flex items-center gap-3">
              <ToolbarButton
                type="button"
                variant="ghost"
                size="icon"
                className="hidden md:inline-flex lg:hidden"
                onClick={onOpenSidebar}
                aria-label="Open pages panel"
                tooltip="Open pages panel"
              >
                <PanelLeft />
              </ToolbarButton>
              <span className="font-masthead text-2xl text-sepia text-ink-effect">
                La Gazette de la Vie
              </span>
              {projectName ? (
                <span className="rounded-full border border-sepia/30 bg-cream/70 px-3 py-1 font-ui text-xs text-muted">
                  {projectName}
                </span>
              ) : null}
            </div>
            <div className="flex items-center justify-end gap-2 md:justify-end">
              <div className="hidden flex-wrap items-center gap-3 md:flex">
                <div className="flex items-center gap-2">
                  <ToolbarButton
                    type="button"
                    variant="outline"
                    onClick={onAddPage}
                    tooltip="Add a new page"
                  >
                    <Plus />
                    Add Page
                  </ToolbarButton>
                  <ToolbarButton
                    type="button"
                    variant="outline"
                    onClick={onAddImage}
                    disabled={disableAddImage}
                    tooltip="Add an image"
                  >
                    <ImagePlus />
                    Add Image
                  </ToolbarButton>
                  <ToolbarButton
                    type="button"
                    variant="outline"
                    onClick={onAddText}
                    disabled={disableAddText}
                    tooltip="Add text"
                  >
                    <Type />
                    Add Text
                  </ToolbarButton>
                  <ToolbarButton
                    type="button"
                    variant="outline"
                    onClick={onRequestDelete}
                    disabled={!canDelete}
                    className="border-aged-red/40 text-aged-red hover:bg-aged-red/10"
                    tooltip="Delete selected element"
                  >
                    <Trash2 />
                    Delete
                  </ToolbarButton>
                </div>
                <Separator orientation="vertical" className="h-6" />
                <div className="flex items-center gap-2">
                  <ToolbarButton
                    type="button"
                    onClick={onGenerateAll}
                    disabled={disableGenerate}
                    className="bg-gold text-ink hover:bg-gold/90"
                    tooltip="Generate all content"
                  >
                    <Sparkles />
                    Generate All
                  </ToolbarButton>
                  <ToolbarButton
                    type="button"
                    variant="ghost"
                    onClick={onOpenProgress}
                    tooltip="View generation progress"
                  >
                    View progress
                  </ToolbarButton>
                </div>
                <Separator orientation="vertical" className="h-6" />
                <div className="flex items-center gap-2">
                  <ToolbarButton
                    type="button"
                    variant="outline"
                    onClick={onOpenShare}
                    tooltip="Share this project"
                  >
                    <Share2 />
                    Share
                  </ToolbarButton>
                  <ToolbarButton
                    type="button"
                    variant="ghost"
                    onClick={onOpenExport}
                    tooltip="Export this project"
                  >
                    Export
                  </ToolbarButton>
                </div>
                <Separator orientation="vertical" className="h-6" />
                <div className="flex items-center gap-2">
                  <ToolbarButton
                    type="button"
                    onClick={onSave}
                    disabled={disableSave}
                    className="bg-gold text-ink hover:bg-gold/90"
                    tooltip="Save changes"
                  >
                    <Save />
                    Save
                  </ToolbarButton>
                </div>
              </div>
              <div className="flex items-center gap-2 md:hidden">
                <ToolbarButton
                  type="button"
                  onClick={onGenerateAll}
                  disabled={disableGenerate}
                  className="bg-gold text-ink hover:bg-gold/90"
                  tooltip="Generate all content"
                >
                  <Sparkles />
                  Generate
                </ToolbarButton>
                <ToolbarButton
                  type="button"
                  onClick={onSave}
                  disabled={disableSave}
                  className="bg-gold text-ink hover:bg-gold/90"
                  tooltip="Save changes"
                >
                  <Save />
                  Save
                </ToolbarButton>
                <DropdownMenu>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <DropdownMenuTrigger asChild>
                        <Button type="button" variant="ghost" size="icon" aria-label="More actions">
                          <MoreHorizontal />
                        </Button>
                      </DropdownMenuTrigger>
                    </TooltipTrigger>
                    <TooltipContent>More actions</TooltipContent>
                  </Tooltip>
                  <DropdownMenuContent align="end" className="w-56">
                    <DropdownMenuItem onSelect={() => onAddPage()}>
                      <Plus className="mr-2 h-4 w-4" />
                      Add Page
                    </DropdownMenuItem>
                    <DropdownMenuItem onSelect={() => onAddImage()} disabled={disableAddImage}>
                      <ImagePlus className="mr-2 h-4 w-4" />
                      Add Image
                    </DropdownMenuItem>
                    <DropdownMenuItem onSelect={() => onAddText()} disabled={disableAddText}>
                      <Type className="mr-2 h-4 w-4" />
                      Add Text
                    </DropdownMenuItem>
                    <DropdownMenuItem onSelect={() => onRequestDelete()} disabled={!canDelete}>
                      <Trash2 className="mr-2 h-4 w-4 text-aged-red" />
                      Delete
                    </DropdownMenuItem>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem onSelect={() => onOpenProgress()}>
                      <Sparkles className="mr-2 h-4 w-4" />
                      View progress
                    </DropdownMenuItem>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem onSelect={() => onOpenShare()}>
                      <Share2 className="mr-2 h-4 w-4" />
                      Share
                    </DropdownMenuItem>
                    <DropdownMenuItem onSelect={() => onOpenExport()}>Export</DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>
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
      </TooltipProvider>

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
