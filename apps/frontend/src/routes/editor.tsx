import { createFileRoute, redirect } from "@tanstack/react-router";
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
import { Download, ImagePlus, PanelLeft, Plus, Save, Share2, Sparkles } from "lucide-react";

export const Route = createFileRoute("/editor")({
  validateSearch: (search: Record<string, unknown>) => ({
    pageId: typeof search.pageId === "string" ? search.pageId : undefined,
  }),
  beforeLoad: () => {
    const session = getAuthSession();
    if (!session) {
      throw redirect({
        to: "/auth",
      });
    }
  },
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
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
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
    setIsSidebarOpen(false);
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
    <div className="flex min-h-[calc(100vh-57px)] flex-col pb-20 md:pb-0">
      <header className="editor-toolbar border-b border-sepia/20 bg-parchment/90 px-4 py-2 md:px-6 md:py-3">
        <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
          <div className="flex items-center gap-3">
            <Button
              type="button"
              variant="ghost"
              size="icon"
              className="md:hidden"
              onClick={() => setIsSidebarOpen(true)}
              aria-label="Open pages panel"
            >
              <PanelLeft />
            </Button>
            <span className="font-masthead text-2xl text-sepia text-ink-effect">
              La Gazette de la Vie
            </span>
            {session?.projectName && (
              <span className="rounded-full border border-sepia/30 bg-cream/70 px-3 py-1 font-ui text-xs text-muted">
                {session.projectName}
              </span>
            )}
          </div>
          <div className="hidden flex-wrap items-center gap-2 md:flex">
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

      <hr className="divider-vintage m-0" />

      <div className="flex flex-1">
        {/* Sidebar */}
        <PageSidebar
          projectId={projectId}
          activePageId={activePageId}
          onSelectPage={handleSelectPage}
          onRequestNewPage={() => setIsTemplateDialogOpen(true)}
          className="editor-sidebar hidden lg:block"
        />

        {isSidebarOpen ? (
          <div
            className="fixed inset-0 z-40 bg-ink/40 backdrop-blur-sm lg:hidden"
            onClick={() => setIsSidebarOpen(false)}
          >
            <div className="h-full" onClick={(event) => event.stopPropagation()}>
              <PageSidebar
                projectId={projectId}
                activePageId={activePageId}
                onSelectPage={handleSelectPage}
                onRequestNewPage={() => setIsTemplateDialogOpen(true)}
                onClose={() => setIsSidebarOpen(false)}
                className="editor-sidebar h-full shadow-xl"
              />
            </div>
          </div>
        ) : null}

        {/* Canvas */}
        <main className="editor-canvas flex-1 bg-cream/50 p-4 sm:p-6 lg:p-8">
          <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h2 className="font-headline text-ink-effect">Editor Canvas</h2>
              <p className="font-ui text-xs text-muted">
                Track generation progress while you keep editing.
              </p>
            </div>
            <div className="hidden items-center gap-2 sm:flex">
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
              projectName={session?.projectName}
              showChrome={true}
              className="h-full w-full"
              emptyState={
                activePageId
                  ? "This page awaits your memories. Click to add a photograph and bring the past to life."
                  : "Every story begins with a blank page. Add your first."
              }
              selectedElementId={selectedElementId}
              onSelectElement={setSelectedElementId}
              onClearSelection={() => setSelectedElementId(null)}
              onImageDoubleClick={handleImageDoubleClick}
              enableGestures
            />
          </div>
        </main>

        {/* Properties Panel */}
        <aside className="editor-properties hidden w-72 border-l border-sepia/20 bg-parchment p-4 lg:block">
          <h3 className="mb-4 font-headline text-ink-effect">Properties</h3>
          <hr className="divider-vintage" />
          <p className="font-ui text-sm text-muted">Select an element to edit its properties</p>
        </aside>
      </div>

      <div className="fixed inset-x-0 bottom-0 z-30 border-t border-sepia/30 bg-parchment/95 px-3 py-2 backdrop-blur md:hidden">
        <div className="flex items-center gap-2 overflow-x-auto">
          <Button
            type="button"
            variant="ghost"
            size="icon"
            onClick={() => setIsSidebarOpen(true)}
            aria-label="Open pages panel"
            title="Pages"
          >
            <PanelLeft />
          </Button>
          <Button
            type="button"
            variant="outline"
            size="icon"
            onClick={() => setIsTemplateDialogOpen(true)}
            aria-label="Add page"
            title="Add Page"
          >
            <Plus />
          </Button>
          <Button
            type="button"
            variant="outline"
            size="icon"
            onClick={() => setIsUploadOpen(true)}
            disabled={!projectId || !activePageId}
            aria-label="Add photo"
            title="Add Photo"
          >
            <ImagePlus />
          </Button>
          <Button type="button" size="icon" aria-label="Generate" title="Generate">
            <Sparkles />
          </Button>
          <Button
            type="button"
            variant="outline"
            size="icon"
            disabled={!projectId}
            aria-label="Share"
            title="Share"
          >
            <Share2 />
          </Button>
          <Button
            type="button"
            variant="outline"
            size="icon"
            onClick={() => setIsExportDialogOpen(true)}
            aria-label="Export"
            title="Export"
          >
            <Download />
          </Button>
          <Button
            type="button"
            variant="ghost"
            size="icon"
            disabled={!projectId}
            aria-label="Save"
            title="Save"
          >
            <Save />
          </Button>
        </div>
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
