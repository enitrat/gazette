import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import type { Template } from "@gazette/shared";
import { Canvas } from "@/components/Canvas";
import { PageSidebar } from "@/components/PageSidebar";
import { ExportDialog } from "@/components/ExportDialog";
import { TemplateDialog } from "@/components/TemplateDialog";
import { GenerationProgressDialog } from "@/components/GenerationProgressDialog";
import { ImageUpload, type ImageUploadResult } from "@/components/ImageUpload";
import { ImageEditDialog } from "@/components/ImageEditDialog";
import { Button } from "@/components/ui/button";
import { api, parseApiError } from "@/lib/api";
import { getAuthSession } from "@/lib/auth";
import { useElementsStore } from "@/stores/elements-store";
import { usePagesStore } from "@/stores/pages-store";
import type { CanvasElement } from "@/types/editor";
import { Download, ImagePlus, Plus, Save, Share2, Sparkles } from "lucide-react";

export const Route = createFileRoute("/editor")({
  validateSearch: (search: Record<string, unknown>) => ({
    pageId: typeof search.pageId === "string" ? search.pageId : undefined,
  }),
  component: EditorPage,
});

function EditorPage() {
  const { pageId } = Route.useSearch();
  const navigate = Route.useNavigate();
  const pages = usePagesStore((state) => state.pages);
  const createPage = usePagesStore((state) => state.createPage);
  const [session] = useState(() => getAuthSession());
  const projectId = session?.projectId;
  const [isTemplateDialogOpen, setIsTemplateDialogOpen] = useState(false);
  const [isExportDialogOpen, setIsExportDialogOpen] = useState(false);
  const [isProgressOpen, setIsProgressOpen] = useState(false);
  const [isUploadOpen, setIsUploadOpen] = useState(false);
  const [isImageEditOpen, setIsImageEditOpen] = useState(false);
  const [imageEditElementId, setImageEditElementId] = useState<string | null>(null);
  const elementsByPage = useElementsStore((state) => state.elementsByPage);
  const fetchElements = useElementsStore((state) => state.fetchElements);
  const setElementsForPage = useElementsStore((state) => state.setElementsForPage);
  const selectedElementId = useElementsStore((state) => state.selectedElementId);
  const setSelectedElementId = useElementsStore((state) => state.setSelectedElementId);

  const activePageId = useMemo(() => pageId ?? pages[0]?.id, [pageId, pages]);
  const activePage = useMemo(
    () => pages.find((page) => page.id === activePageId) ?? null,
    [activePageId, pages]
  );
  const activeElements = useMemo(
    () => (activePageId ? (elementsByPage[activePageId] ?? []) : []),
    [activePageId, elementsByPage]
  );
  const imageEditElement = useMemo(
    () => activeElements.find((element) => element.id === imageEditElementId) ?? null,
    [activeElements, imageEditElementId]
  );

  useEffect(() => {
    if (!pageId && pages.length > 0) {
      navigate({
        search: {
          pageId: pages[0]?.id,
        },
        replace: true,
      });
    }
  }, [navigate, pageId, pages]);

  useEffect(() => {
    if (!activePageId) return;
    void fetchElements(activePageId);
    setSelectedElementId(null);
  }, [activePageId, fetchElements, setSelectedElementId]);

  const handleSelectPage = (selectedId: string) => {
    navigate({
      search: {
        pageId: selectedId,
      },
    });
  };

  const handleCreatePage = async (templateId: Template) => {
    if (!projectId) {
      throw new Error("Missing project ID.");
    }

    const lastPage = pages[pages.length - 1];
    const created = await createPage(projectId, templateId, lastPage?.id);
    if (!created) {
      throw new Error("Unable to create page.");
    }
    handleSelectPage(created.id);
  };

  const handleImageUploaded = (result: ImageUploadResult) => {
    if (!activePageId) return;

    const existing = elementsByPage[activePageId] ?? [];
    const offset = existing.length * 18;
    const nextElement: CanvasElement = {
      id: `image-${result.image.id}`,
      type: "image",
      position: {
        x: 80 + offset,
        y: 180 + offset,
        width: 320,
        height: 240,
      },
      imageUrl: result.previewUrl || result.image.url,
      imageWidth: result.image.width,
      imageHeight: result.image.height,
      videoStatus: "none",
    };

    setElementsForPage(activePageId, [...existing, nextElement]);
    setSelectedElementId(nextElement.id);
  };

  const handleImageDoubleClick = (element: CanvasElement) => {
    if (!element.imageUrl) return;
    setImageEditElementId(element.id);
    setIsImageEditOpen(true);
  };

  const handleImageEditOpenChange = (nextOpen: boolean) => {
    setIsImageEditOpen(nextOpen);
    if (!nextOpen) {
      setImageEditElementId(null);
    }
  };

  const handleSaveCrop = async (
    elementId: string,
    cropData: { x: number; y: number; zoom: number }
  ) => {
    if (!activePageId) return;

    const pageElements = elementsByPage[activePageId] ?? [];
    const nextElements = pageElements.map((element) =>
      element.id === elementId ? { ...element, cropData } : element
    );
    setElementsForPage(activePageId, nextElements);

    const isUuid =
      /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(elementId);

    if (!projectId || !isUuid) {
      return;
    }

    try {
      await api.put(`elements/${elementId}`, {
        json: {
          cropData,
        },
      });
    } catch (error) {
      const parsed = await parseApiError(error);
      throw new Error(parsed.message);
    }
  };

  return (
    <div className="flex min-h-[calc(100vh-57px)] flex-col">
      <header className="editor-toolbar border-b border-sepia/20 bg-parchment/90 px-6 py-3">
        <div className="flex items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <span className="font-masthead text-lg text-sepia">La Gazette de la Vie</span>
            {session?.projectName && (
              <span className="rounded-full border border-sepia/30 bg-cream/70 px-3 py-1 font-ui text-xs text-muted">
                {session.projectName}
              </span>
            )}
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <Button type="button" variant="outline" onClick={() => setIsTemplateDialogOpen(true)}>
              <Plus />
              Add Page
            </Button>
            <Button type="button">
              <Sparkles />
              Generate
            </Button>
            <Button
              type="button"
              variant="outline"
              onClick={() => setIsProgressOpen(true)}
              disabled={!projectId}
            >
              View generation
            </Button>
            <Button type="button" variant="outline" disabled={!projectId}>
              <Share2 />
              Share
            </Button>
            <Button type="button" variant="outline" onClick={() => setIsExportDialogOpen(true)}>
              <Download />
              Export
            </Button>
            <Button type="button" variant="ghost" disabled={!projectId}>
              <Save />
              Save
            </Button>
          </div>
        </div>
      </header>

      <div className="flex flex-1">
        {/* Sidebar */}
        <PageSidebar
          projectId={projectId}
          activePageId={activePageId}
          onSelectPage={handleSelectPage}
          onRequestNewPage={() => setIsTemplateDialogOpen(true)}
          className="editor-sidebar"
        />

        {/* Canvas */}
        <main className="editor-canvas flex-1 bg-cream/50 p-8">
          <div className="mb-4 flex items-center justify-between">
            <div>
              <h2 className="text-ink-effect">Editor Canvas</h2>
              <p className="font-ui text-xs text-muted">
                Track generation progress while you keep editing.
              </p>
            </div>
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                onClick={() => setIsUploadOpen(true)}
                disabled={!projectId || !activePageId}
              >
                <ImagePlus />
                Add Photo
              </Button>
              <Button
                variant="outline"
                onClick={() => setIsProgressOpen(true)}
                disabled={!projectId}
              >
                View generation
              </Button>
            </div>
          </div>
          <div className="mx-auto aspect-[3/4] max-w-2xl">
            <Canvas
              page={
                activePage
                  ? {
                      id: activePage.id,
                      title: activePage.title,
                      subtitle: activePage.subtitle,
                      elements: activeElements,
                    }
                  : null
              }
              className="h-full w-full"
              emptyState={
                activePageId ? "Click to add elements to your gazette." : "Select a page."
              }
              selectedElementId={selectedElementId}
              onSelectElement={setSelectedElementId}
              onClearSelection={() => setSelectedElementId(null)}
              onImageDoubleClick={handleImageDoubleClick}
            />
          </div>
        </main>

        {/* Properties Panel */}
        <aside className="editor-properties w-72 border-l border-sepia/20 bg-parchment p-4">
          <h3 className="mb-4 text-ink-effect">Properties</h3>
          <p className="font-ui text-sm text-muted">Select an element to edit its properties</p>
        </aside>
      </div>

      <TemplateDialog
        open={isTemplateDialogOpen}
        onOpenChange={setIsTemplateDialogOpen}
        onCreate={handleCreatePage}
      />
      <GenerationProgressDialog
        projectId={projectId}
        open={isProgressOpen}
        onOpenChange={setIsProgressOpen}
        onComplete={() => {
          if (activePageId) {
            void fetchElements(activePageId);
          }
        }}
      />
      <ImageUpload
        open={isUploadOpen}
        onOpenChange={setIsUploadOpen}
        projectId={projectId}
        onUploadComplete={handleImageUploaded}
      />
      <ImageEditDialog
        open={isImageEditOpen}
        onOpenChange={handleImageEditOpenChange}
        element={imageEditElement}
        onSave={handleSaveCrop}
      />
      <ExportDialog
        open={isExportDialogOpen}
        onOpenChange={setIsExportDialogOpen}
        projectId={projectId}
      />
    </div>
  );
}
