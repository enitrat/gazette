import {
  Plus,
  Image as ImageIcon,
  Type,
  Trash2,
  Sparkles,
  Activity,
  Share2,
  Download,
  Save,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useUIStore } from "@/stores/ui-store";
import { useElementsStore } from "@/stores/elements-store";
import { usePagesStore } from "@/stores/pages-store";
import { useState } from "react";

export function EditorToolbar() {
  const openDialog = useUIStore((state) => state.openDialog);
  const selectedId = useElementsStore((state) => state.selectedId);
  const deleteElement = useElementsStore((state) => state.deleteElement);
  const createElement = useElementsStore((state) => state.createElement);
  const currentPageId = usePagesStore((state) => state.currentPageId);
  const [isSaving, setIsSaving] = useState(false);

  const handleAddText = async () => {
    if (!currentPageId) return;

    // Create a caption element at the center of the canvas
    await createElement(currentPageId, {
      type: "caption",
      position: {
        x: 400,
        y: 300,
        width: 300,
        height: 100,
      },
      content: "Cliquez pour modifier",
    });
  };

  const handleDelete = async () => {
    if (!selectedId) return;
    await deleteElement(selectedId);
  };

  const handleSave = async () => {
    setIsSaving(true);
    // Simulate save - in real implementation, this would trigger a save operation
    await new Promise((resolve) => setTimeout(resolve, 800));
    setIsSaving(false);
  };

  const handleExport = () => {
    openDialog("export");
  };

  return (
    <TooltipProvider delayDuration={300}>
      <div className="toolbar-wrapper relative border-b border-[#8b7355]/20 bg-gradient-to-b from-[#f5ebe0] to-[#f0e6d7] shadow-[inset_0_1px_0_0_rgba(255,255,255,0.5),0_1px_2px_0_rgba(0,0,0,0.05)]">
        {/* Vintage newspaper texture overlay */}
        <div
          className="pointer-events-none absolute inset-0 opacity-[0.015] mix-blend-multiply"
          style={{
            backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 400 400' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noiseFilter'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noiseFilter)'/%3E%3C/svg%3E")`,
            backgroundSize: "200px 200px",
          }}
        />

        {/* Decorative top border line - vintage press bar effect */}
        <div className="absolute top-0 left-0 right-0 h-[2px] bg-gradient-to-r from-transparent via-[#8b7355]/30 to-transparent" />

        <div className="relative flex h-12 items-center gap-1 overflow-x-auto px-4 scrollbar-vintage">
          {/* Creation Group */}
          <div className="flex items-center gap-1">
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => openDialog("template")}
                  className="toolbar-button group relative h-8 border-[#8b7355]/30 bg-white/60 font-serif text-xs font-medium text-[#2C2416] shadow-sm backdrop-blur-sm transition-all hover:border-[#8b7355]/50 hover:bg-white hover:shadow-md hover:-translate-y-0.5"
                >
                  <Plus className="mr-1.5 h-3.5 w-3.5 transition-transform group-hover:rotate-90" />
                  <span className="tracking-wide">Page</span>
                  {/* Vintage ink dot decoration */}
                  <div className="absolute -bottom-1 left-1/2 h-0.5 w-0.5 -translate-x-1/2 rounded-full bg-[#8b7355] opacity-40" />
                </Button>
              </TooltipTrigger>
              <TooltipContent
                side="bottom"
                className="border-[#8b7355]/30 bg-[#f5ebe0] text-xs font-serif text-[#2C2416]"
              >
                <p>Add Page</p>
              </TooltipContent>
            </Tooltip>

            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => openDialog("upload")}
                  className="toolbar-button group relative h-8 border-[#8b7355]/30 bg-white/60 font-serif text-xs font-medium text-[#2C2416] shadow-sm backdrop-blur-sm transition-all hover:border-[#8b7355]/50 hover:bg-white hover:shadow-md hover:-translate-y-0.5"
                >
                  <ImageIcon className="mr-1.5 h-3.5 w-3.5 transition-transform group-hover:scale-110" />
                  <span className="tracking-wide">Media</span>
                  <div className="absolute -bottom-1 left-1/2 h-0.5 w-0.5 -translate-x-1/2 rounded-full bg-[#8b7355] opacity-40" />
                </Button>
              </TooltipTrigger>
              <TooltipContent
                side="bottom"
                className="border-[#8b7355]/30 bg-[#f5ebe0] text-xs font-serif text-[#2C2416]"
              >
                <p>Add Media</p>
              </TooltipContent>
            </Tooltip>

            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleAddText}
                  disabled={!currentPageId}
                  className="toolbar-button group relative h-8 border-[#8b7355]/30 bg-white/60 font-serif text-xs font-medium text-[#2C2416] shadow-sm backdrop-blur-sm transition-all hover:border-[#8b7355]/50 hover:bg-white hover:shadow-md hover:-translate-y-0.5 disabled:opacity-40"
                >
                  <Type className="mr-1.5 h-3.5 w-3.5 transition-transform group-hover:scale-110" />
                  <span className="tracking-wide">Text</span>
                  <div className="absolute -bottom-1 left-1/2 h-0.5 w-0.5 -translate-x-1/2 rounded-full bg-[#8b7355] opacity-40" />
                </Button>
              </TooltipTrigger>
              <TooltipContent
                side="bottom"
                className="border-[#8b7355]/30 bg-[#f5ebe0] text-xs font-serif text-[#2C2416]"
              >
                <p>Add Text</p>
              </TooltipContent>
            </Tooltip>
          </div>

          <Separator
            orientation="vertical"
            className="mx-2 h-6 bg-gradient-to-b from-transparent via-[#8b7355]/30 to-transparent"
          />

          {/* Edit Group */}
          <div className="flex items-center gap-1">
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  variant="destructive"
                  size="sm"
                  onClick={handleDelete}
                  disabled={!selectedId}
                  className="toolbar-button group relative h-8 border border-[#8b4513]/30 bg-gradient-to-b from-[#a0522d]/90 to-[#8b4513]/90 font-serif text-xs font-medium text-[#f5ebe0] shadow-sm transition-all hover:border-[#8b4513]/50 hover:from-[#a0522d] hover:to-[#8b4513] hover:shadow-md hover:-translate-y-0.5 disabled:opacity-40"
                >
                  <Trash2 className="mr-1.5 h-3.5 w-3.5 transition-transform group-hover:scale-110" />
                  <span className="tracking-wide">Delete</span>
                  <div className="absolute -bottom-1 left-1/2 h-0.5 w-0.5 -translate-x-1/2 rounded-full bg-[#f5ebe0] opacity-60" />
                </Button>
              </TooltipTrigger>
              <TooltipContent
                side="bottom"
                className="border-[#8b7355]/30 bg-[#f5ebe0] text-xs font-serif text-[#2C2416]"
              >
                <p>Delete Selected</p>
              </TooltipContent>
            </Tooltip>
          </div>

          <Separator
            orientation="vertical"
            className="mx-2 h-6 bg-gradient-to-b from-transparent via-[#8b7355]/30 to-transparent"
          />

          {/* Generation Group */}
          <div className="flex items-center gap-1">
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  variant="default"
                  size="sm"
                  onClick={() => openDialog("generation")}
                  className="toolbar-button group relative h-8 border border-[#C9A227]/40 bg-gradient-to-b from-[#d4af37] to-[#C9A227] font-serif text-xs font-medium text-[#2C2416] shadow-sm transition-all hover:border-[#C9A227]/60 hover:from-[#e0bb3e] hover:to-[#d4af37] hover:shadow-md hover:-translate-y-0.5"
                >
                  <Sparkles className="mr-1.5 h-3.5 w-3.5 transition-all group-hover:rotate-12 group-hover:scale-110" />
                  <span className="tracking-wide">Generate All</span>
                  {/* Golden shine effect */}
                  <div className="absolute inset-0 rounded-md bg-gradient-to-r from-transparent via-white/20 to-transparent opacity-0 transition-opacity group-hover:opacity-100" />
                  <div className="absolute -bottom-1 left-1/2 h-0.5 w-0.5 -translate-x-1/2 rounded-full bg-[#2C2416] opacity-50" />
                </Button>
              </TooltipTrigger>
              <TooltipContent
                side="bottom"
                className="border-[#8b7355]/30 bg-[#f5ebe0] text-xs font-serif text-[#2C2416]"
              >
                <p>Generate Videos for All Images</p>
              </TooltipContent>
            </Tooltip>

            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => openDialog("progress")}
                  className="toolbar-button group relative h-8 border-[#8b7355]/30 bg-white/60 font-serif text-xs font-medium text-[#2C2416] shadow-sm backdrop-blur-sm transition-all hover:border-[#8b7355]/50 hover:bg-white hover:shadow-md hover:-translate-y-0.5"
                >
                  <Activity className="mr-1.5 h-3.5 w-3.5 transition-transform group-hover:scale-110" />
                  <span className="tracking-wide">Progress</span>
                  <div className="absolute -bottom-1 left-1/2 h-0.5 w-0.5 -translate-x-1/2 rounded-full bg-[#8b7355] opacity-40" />
                </Button>
              </TooltipTrigger>
              <TooltipContent
                side="bottom"
                className="border-[#8b7355]/30 bg-[#f5ebe0] text-xs font-serif text-[#2C2416]"
              >
                <p>View Generation Progress</p>
              </TooltipContent>
            </Tooltip>
          </div>

          <Separator
            orientation="vertical"
            className="mx-2 h-6 bg-gradient-to-b from-transparent via-[#8b7355]/30 to-transparent"
          />

          {/* Share/Export Group */}
          <div className="flex items-center gap-1">
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => openDialog("share")}
                  className="toolbar-button group relative h-8 border-[#8b7355]/30 bg-white/60 font-serif text-xs font-medium text-[#2C2416] shadow-sm backdrop-blur-sm transition-all hover:border-[#8b7355]/50 hover:bg-white hover:shadow-md hover:-translate-y-0.5"
                >
                  <Share2 className="mr-1.5 h-3.5 w-3.5 transition-transform group-hover:scale-110" />
                  <span className="tracking-wide">Share</span>
                  <div className="absolute -bottom-1 left-1/2 h-0.5 w-0.5 -translate-x-1/2 rounded-full bg-[#8b7355] opacity-40" />
                </Button>
              </TooltipTrigger>
              <TooltipContent
                side="bottom"
                className="border-[#8b7355]/30 bg-[#f5ebe0] text-xs font-serif text-[#2C2416]"
              >
                <p>Share Project</p>
              </TooltipContent>
            </Tooltip>

            <DropdownMenu>
              <Tooltip>
                <TooltipTrigger asChild>
                  <DropdownMenuTrigger asChild>
                    <Button
                      variant="outline"
                      size="sm"
                      className="toolbar-button group relative h-8 border-[#8b7355]/30 bg-white/60 font-serif text-xs font-medium text-[#2C2416] shadow-sm backdrop-blur-sm transition-all hover:border-[#8b7355]/50 hover:bg-white hover:shadow-md hover:-translate-y-0.5"
                    >
                      <Download className="mr-1.5 h-3.5 w-3.5 transition-transform group-hover:-translate-y-0.5" />
                      <span className="tracking-wide">Export</span>
                      <div className="absolute -bottom-1 left-1/2 h-0.5 w-0.5 -translate-x-1/2 rounded-full bg-[#8b7355] opacity-40" />
                    </Button>
                  </DropdownMenuTrigger>
                </TooltipTrigger>
                <TooltipContent
                  side="bottom"
                  className="border-[#8b7355]/30 bg-[#f5ebe0] text-xs font-serif text-[#2C2416]"
                >
                  <p>Export Options</p>
                </TooltipContent>
              </Tooltip>
              <DropdownMenuContent
                align="end"
                className="w-48 border-[#8b7355]/30 bg-[#f5ebe0] font-serif shadow-lg"
              >
                <DropdownMenuItem
                  onClick={handleExport}
                  className="cursor-pointer text-sm text-[#2C2416] hover:bg-[#8b7355]/10 focus:bg-[#8b7355]/10"
                >
                  <Download className="mr-2 h-4 w-4" />
                  Export Options...
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>

          {/* Spacer to push Save to the right */}
          <div className="flex-1" />

          {/* Right-aligned Save Button */}
          <div className="flex items-center gap-1">
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  variant="default"
                  size="sm"
                  onClick={handleSave}
                  disabled={isSaving}
                  className="toolbar-button group relative h-8 border border-[#C9A227]/40 bg-gradient-to-b from-[#d4af37] to-[#C9A227] font-serif text-xs font-medium text-[#2C2416] shadow-sm transition-all hover:border-[#C9A227]/60 hover:from-[#e0bb3e] hover:to-[#d4af37] hover:shadow-md hover:-translate-y-0.5 disabled:opacity-50"
                >
                  <Save
                    className={`mr-1.5 h-3.5 w-3.5 transition-transform ${isSaving ? "animate-pulse" : "group-hover:scale-110"}`}
                  />
                  <span className="tracking-wide">{isSaving ? "Saving..." : "Save"}</span>
                  <div className="absolute inset-0 rounded-md bg-gradient-to-r from-transparent via-white/20 to-transparent opacity-0 transition-opacity group-hover:opacity-100" />
                  <div className="absolute -bottom-1 left-1/2 h-0.5 w-0.5 -translate-x-1/2 rounded-full bg-[#2C2416] opacity-50" />
                </Button>
              </TooltipTrigger>
              <TooltipContent
                side="bottom"
                className="border-[#8b7355]/30 bg-[#f5ebe0] text-xs font-serif text-[#2C2416]"
              >
                <p>Save Changes</p>
              </TooltipContent>
            </Tooltip>
          </div>
        </div>

        {/* Decorative bottom shadow - vintage press effect */}
        <div className="absolute bottom-0 left-0 right-0 h-[1px] bg-gradient-to-r from-transparent via-[#8b7355]/20 to-transparent" />
      </div>

      <style>{`
        @keyframes shimmer {
          0% { transform: translateX(-100%); }
          100% { transform: translateX(100%); }
        }

        .toolbar-button {
          position: relative;
          overflow: hidden;
        }

        .toolbar-button::before {
          content: '';
          position: absolute;
          top: 0;
          left: -100%;
          width: 100%;
          height: 100%;
          background: linear-gradient(
            90deg,
            transparent 0%,
            rgba(255, 255, 255, 0.3) 50%,
            transparent 100%
          );
          transition: left 0.6s;
        }

        .toolbar-button:hover::before {
          left: 100%;
        }

        /* Custom scrollbar for toolbar */
        .scrollbar-vintage::-webkit-scrollbar {
          height: 6px;
        }

        .scrollbar-vintage::-webkit-scrollbar-track {
          background-color: rgba(139, 115, 85, 0.1);
        }

        .scrollbar-vintage::-webkit-scrollbar-thumb {
          background-color: rgba(139, 115, 85, 0.3);
          border-radius: 3px;
        }

        .scrollbar-vintage::-webkit-scrollbar-thumb:hover {
          background-color: rgba(139, 115, 85, 0.5);
        }
      `}</style>
    </TooltipProvider>
  );
}
