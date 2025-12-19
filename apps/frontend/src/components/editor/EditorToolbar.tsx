import {
  Activity,
  Download,
  Image,
  Loader2,
  MoreHorizontal,
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
  isGenerating?: boolean;
  isSaving?: boolean;
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
  canDelete,
  isDeleteDialogOpen,
  onDeleteDialogOpenChange,
  onConfirmDelete,
  onAddPage,
  onAddImage,
  onAddText,
  onRequestDelete,
  onGenerateAll,
  onOpenProgress,
  onOpenShare,
  onOpenExport,
  onSave,
  disableAddImage,
  disableAddText,
  disableGenerate,
  disableSave,
  isGenerating = false,
  isSaving = false,
}: EditorToolbarProps) {
  const generateDisabled = disableGenerate || isGenerating;
  const saveDisabled = disableSave || isSaving;

  return (
    <header className="w-full border-b border-sepia/20 bg-parchment/90">
      <TooltipProvider>
        <div className="flex h-14 items-center justify-between px-6">
          <div className="hidden items-center md:flex">
            <div className="flex items-center gap-2">
              <ToolbarButton
                type="button"
                variant="outline"
                onClick={onAddPage}
                tooltip="Add a new page"
                className="border-sepia/40 text-ink hover:bg-sepia/10"
              >
                <Plus className="h-4 w-4" />+ Add Page
              </ToolbarButton>
              <ToolbarButton
                type="button"
                variant="outline"
                onClick={onAddImage}
                disabled={disableAddImage}
                tooltip="Add an image"
                className="border-sepia/40 text-ink hover:bg-sepia/10"
              >
                <Image className="h-4 w-4" />
                Add Image
              </ToolbarButton>
              <ToolbarButton
                type="button"
                variant="outline"
                onClick={onAddText}
                disabled={disableAddText}
                tooltip="Add text"
                className="border-sepia/40 text-ink hover:bg-sepia/10"
              >
                <Type className="h-4 w-4" />
                Add Text
              </ToolbarButton>
            </div>
            <Separator orientation="vertical" className="mx-4 h-6" />
            <div className="flex items-center gap-2">
              <ToolbarButton
                type="button"
                variant="destructive"
                onClick={onRequestDelete}
                disabled={!canDelete}
                tooltip="Delete selected element"
                className="bg-aged-red text-cream hover:bg-aged-red/90"
              >
                <Trash2 className="h-4 w-4" />
                Delete
              </ToolbarButton>
            </div>
            <Separator orientation="vertical" className="mx-4 h-6" />
            <div className="flex items-center gap-2">
              <ToolbarButton
                type="button"
                onClick={onGenerateAll}
                disabled={generateDisabled}
                tooltip="Generate all content"
                className="bg-gold text-ink hover:bg-gold/90"
              >
                {isGenerating ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <Sparkles className="h-4 w-4" />
                )}
                Generate All
              </ToolbarButton>
              <ToolbarButton
                type="button"
                variant="outline"
                onClick={onOpenProgress}
                tooltip="View generation progress"
                className="border-sepia/40 text-ink hover:bg-sepia/10"
              >
                <Activity className="h-4 w-4" />
                View Progress
              </ToolbarButton>
            </div>
            <Separator orientation="vertical" className="mx-4 h-6" />
            <div className="flex items-center gap-2">
              <ToolbarButton
                type="button"
                variant="outline"
                onClick={onOpenShare}
                tooltip="Share this project"
                className="border-sepia/40 text-ink hover:bg-sepia/10"
              >
                <Share2 className="h-4 w-4" />
                Share
              </ToolbarButton>
              <DropdownMenu>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <DropdownMenuTrigger asChild>
                      <Button
                        type="button"
                        variant="outline"
                        className="border-sepia/40 text-ink hover:bg-sepia/10"
                      >
                        <Download className="h-4 w-4" />
                        Export
                      </Button>
                    </DropdownMenuTrigger>
                  </TooltipTrigger>
                  <TooltipContent>Export options</TooltipContent>
                </Tooltip>
                <DropdownMenuContent align="start" className="w-52">
                  <DropdownMenuItem onSelect={() => onOpenExport()}>
                    📄 Download as HTML
                  </DropdownMenuItem>
                  <DropdownMenuItem onSelect={() => onOpenExport()}>
                    🎬 Download Videos
                  </DropdownMenuItem>
                  <DropdownMenuItem onSelect={() => onOpenExport()}>
                    🖨️ Print / Save PDF
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
            <Separator orientation="vertical" className="mx-4 h-6" />
            <div className="flex items-center gap-2">
              <ToolbarButton
                type="button"
                onClick={onSave}
                disabled={saveDisabled}
                tooltip="Save changes"
                className="bg-gold text-ink hover:bg-gold/90"
              >
                {isSaving ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <Save className="h-4 w-4" />
                )}
                Save
              </ToolbarButton>
            </div>
          </div>

          <div className="flex w-full items-center justify-between gap-3 md:hidden">
            <ToolbarButton
              type="button"
              onClick={onGenerateAll}
              disabled={generateDisabled}
              tooltip="Generate all content"
              className="bg-gold text-ink hover:bg-gold/90"
            >
              {isGenerating ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Sparkles className="h-4 w-4" />
              )}
              Generate All
            </ToolbarButton>
            <div className="flex items-center gap-2">
              <ToolbarButton
                type="button"
                onClick={onSave}
                disabled={saveDisabled}
                tooltip="Save changes"
                className="bg-gold text-ink hover:bg-gold/90"
              >
                {isSaving ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <Save className="h-4 w-4" />
                )}
                Save
              </ToolbarButton>
              <DropdownMenu>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <DropdownMenuTrigger asChild>
                      <Button type="button" variant="outline" size="icon">
                        <MoreHorizontal className="h-4 w-4" />
                      </Button>
                    </DropdownMenuTrigger>
                  </TooltipTrigger>
                  <TooltipContent>More actions</TooltipContent>
                </Tooltip>
                <DropdownMenuContent align="end" className="w-56">
                  <DropdownMenuItem onSelect={() => onAddPage()}>
                    <Plus className="mr-2 h-4 w-4" />+ Add Page
                  </DropdownMenuItem>
                  <DropdownMenuItem onSelect={() => onAddImage()} disabled={disableAddImage}>
                    <Image className="mr-2 h-4 w-4" />
                    Add Image
                  </DropdownMenuItem>
                  <DropdownMenuItem onSelect={() => onAddText()} disabled={disableAddText}>
                    <Type className="mr-2 h-4 w-4" />
                    Add Text
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem onSelect={() => onRequestDelete()} disabled={!canDelete}>
                    <Trash2 className="mr-2 h-4 w-4 text-aged-red" />
                    Delete
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem onSelect={() => onOpenProgress()}>
                    <Activity className="mr-2 h-4 w-4" />
                    View Progress
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem onSelect={() => onOpenShare()}>
                    <Share2 className="mr-2 h-4 w-4" />
                    Share
                  </DropdownMenuItem>
                  <DropdownMenuItem onSelect={() => onOpenExport()}>
                    <Download className="mr-2 h-4 w-4" />
                    Export
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
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
