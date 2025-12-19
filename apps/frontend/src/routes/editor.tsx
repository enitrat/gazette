import { createFileRoute, redirect } from "@tanstack/react-router";
import { useEffect, useMemo, useRef, useState } from "react";
import type { Template } from "@gazette/shared";
import { Canvas } from "@/components/Canvas";
import { EditorToolbar } from "@/components/EditorToolbar";
import { PropertiesPanel } from "@/components/PropertiesPanel";
import { PageSidebar } from "@/components/PageSidebar";
import { ExportDialog } from "@/components/ExportDialog";
import { ShareDialog } from "@/components/ShareDialog";
import { TemplateDialog } from "@/components/TemplateDialog";
import { GenerationProgressDialog } from "@/components/GenerationProgressDialog";
import { AnimationDialog } from "@/components/AnimationDialog";
import { ImageUpload, type ImageUploadResult } from "@/components/ImageUpload";
import { ImageEditDialog } from "@/components/ImageEditDialog";
import { Button } from "@/components/ui/button";
import { api, parseApiError } from "@/lib/api";
import { getAuthSession } from "@/lib/auth";
import { useElementsStore } from "@/stores/elements-store";
import { usePagesStore } from "@/stores/pages-store";
import type { CanvasElement } from "@/types/editor";
import {
  Download,
  ImagePlus,
  Loader2,
  PanelLeft,
  Plus,
  Save,
  Share2,
  Sparkles,
  Trash2,
  Type,
} from "lucide-react";
import { toast } from "@/components/ui/use-toast";

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
  const pagesError = usePagesStore((state) => state.error);
  const pagesLoading = usePagesStore((state) => state.isLoading);
  const createPage = usePagesStore((state) => state.createPage);
  const [session] = useState(() => getAuthSession());
  const projectId = session?.projectId;
  const [isTemplateDialogOpen, setIsTemplateDialogOpen] = useState(false);
  const [isExportDialogOpen, setIsExportDialogOpen] = useState(false);
  const [isShareDialogOpen, setIsShareDialogOpen] = useState(false);
  const [isProgressOpen, setIsProgressOpen] = useState(false);
  const [isUploadOpen, setIsUploadOpen] = useState(false);
  const [isAnimationOpen, setIsAnimationOpen] = useState(false);
  const [animationElementId, setAnimationElementId] = useState<string | null>(null);
  const [isImageEditOpen, setIsImageEditOpen] = useState(false);
  const [imageEditElementId, setImageEditElementId] = useState<string | null>(null);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [toolbarMessage, setToolbarMessage] = useState<{
    tone: "error" | "success" | "info";
    text: string;
  } | null>(null);
  const [isGeneratingAll, setIsGeneratingAll] = useState(false);
  const elementsByPage = useElementsStore((state) => state.elementsByPage);
  const fetchElements = useElementsStore((state) => state.fetchElements);
  const setElementsForPage = useElementsStore((state) => state.setElementsForPage);
  const createImageElement = useElementsStore((state) => state.createImageElement);
  const createTextElement = useElementsStore((state) => state.createTextElement);
  const deleteElement = useElementsStore((state) => state.deleteElement);
  const selectedElementId = useElementsStore((state) => state.selectedElementId);
  const setSelectedElementId = useElementsStore((state) => state.setSelectedElementId);
  const selectElement = useElementsStore((state) => state.selectElement);
  const updateElement = useElementsStore((state) => state.updateElement);
  const elementsError = useElementsStore((state) => state.error);
  const elementsLoading = useElementsStore((state) => state.isLoading);
  const lastErrorRef = useRef<string | null>(null);

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
  const animationElement = useMemo(
    () => activeElements.find((element) => element.id === animationElementId) ?? null,
    [activeElements, animationElementId]
  );
  const elementCount = activeElements.length;
  const photoCount = activeElements.filter((element) => element.type === "image").length;

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

  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.defaultPrevented) return;
      const target = event.target as HTMLElement | null;
      if (target?.isContentEditable) return;
      const tagName = target?.tagName?.toLowerCase();
      if (tagName === "input" || tagName === "textarea") return;

      if ((event.key === "Delete" || event.key === "Backspace") && selectedElementId) {
        event.preventDefault();
        setIsDeleteDialogOpen(true);
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [selectedElementId]);

  useEffect(() => {
    const combinedError = elementsError || pagesError;
    if (!combinedError || combinedError === lastErrorRef.current) return;
    lastErrorRef.current = combinedError;
    toast({
      title: "Something went wrong",
      description: combinedError,
      variant: "destructive",
    });
  }, [elementsError, pagesError, toast]);

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
      const message = "Missing project ID.";
      toast({
        title: "Unable to create page",
        description: message,
        variant: "destructive",
      });
      throw new Error(message);
    }

    const lastPage = pages[pages.length - 1];
    const created = await createPage(projectId, templateId, lastPage?.id);
    if (!created) {
      const message = "Unable to create page.";
      toast({
        title: "Unable to create page",
        description: message,
        variant: "destructive",
      });
      throw new Error(message);
    }
    toast({
      title: "Page created",
      description: "Your new page is ready to edit.",
      variant: "success",
    });
    handleSelectPage(created.id);
  };

  const handleImageUploaded = async (result: ImageUploadResult) => {
    if (!activePageId) return;

    const existing = elementsByPage[activePageId] ?? [];
    const offset = existing.length * 18;
    const position = {
      x: 80 + offset,
      y: 180 + offset,
      width: 320,
      height: 240,
    };

    const createdElement = await createImageElement(
      activePageId,
      result.image.id,
      position,
      result.previewUrl || result.image.url,
      result.image.width,
      result.image.height
    );

    if (createdElement) {
      setSelectedElementId(createdElement.id);
      setAnimationElementId(createdElement.id);
      setIsAnimationOpen(true);
    } else {
      toast({
        title: "Image upload failed",
        description: "We couldn't place the image. Please try again.",
        variant: "destructive",
      });
    }
  };

  const handleAddText = async () => {
    if (!activePageId) return;
    const offset = activeElements.length * 14;
    const position = {
      x: 90 + offset,
      y: 120 + offset,
      width: 320,
      height: 60,
    };
    const createdElement = await createTextElement(
      activePageId,
      "headline",
      position,
      "New headline"
    );
    if (createdElement) {
      setSelectedElementId(createdElement.id);
    }
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

  const handleAnimationOpenChange = (nextOpen: boolean) => {
    setIsAnimationOpen(nextOpen);
    if (!nextOpen) {
      setAnimationElementId(null);
    }
  };

  const handleSaveCrop = async (
    elementId: string,
    cropData: { x: number; y: number; zoom: number }
  ) => {
    if (!activePageId) return;

    updateElement(activePageId, elementId, { cropData }, { immediate: true });
  };

  const handleElementPositionChange = async (
    elementId: string,
    position: CanvasElement["position"]
  ) => {
    if (!activePageId) return;

    updateElement(activePageId, elementId, { position });
    selectElement(elementId);
  };

  const handleSaveAnimationPrompt = async (elementId: string, prompt: string) => {
    if (!activePageId) return;

    const pageElements = elementsByPage[activePageId] ?? [];
    const previousElements = pageElements;
    const nextElements = pageElements.map((element) =>
      element.id === elementId ? { ...element, animationPrompt: prompt } : element
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
          animationPrompt: prompt,
        },
      });
    } catch (error) {
      const parsed = await parseApiError(error);
      setElementsForPage(activePageId, previousElements);
      toast({
        title: "Unable to save crop",
        description: parsed.message,
        variant: "destructive",
      });
      throw new Error(parsed.message);
    }
  };

  const handleTextCommit = async (elementId: string, content: string) => {
    if (!activePageId) return;

    const pageElements = elementsByPage[activePageId] ?? [];
    const previousElements = pageElements;
    const nextElements = pageElements.map((element) =>
      element.id === elementId ? { ...element, content } : element
    );
    setElementsForPage(activePageId, nextElements);
    setSelectedElementId(elementId);

    const isUuid =
      /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(elementId);

    if (!projectId || !isUuid) {
      return;
    }

    try {
      await api.put(`elements/${elementId}`, {
        json: {
          content,
        },
      });
    } catch (error) {
      const parsed = await parseApiError(error);
      setElementsForPage(activePageId, previousElements);
      toast({
        title: "Unable to save changes",
        description: parsed.message,
        variant: "destructive",
      });
    }
  };

  const handleRequestDelete = () => {
    if (!selectedElementId) return;
    setIsDeleteDialogOpen(true);
  };

  const handleConfirmDelete = async () => {
    if (!activePageId || !selectedElementId) return;
    const deleted = await deleteElement(activePageId, selectedElementId);
    if (deleted) {
      setIsDeleteDialogOpen(false);
      setSelectedElementId(null);
    }
  };

  const showToolbarMessage = (tone: "error" | "success" | "info", text: string) => {
    setToolbarMessage({ tone, text });
    window.setTimeout(() => setToolbarMessage(null), 5000);
  };

  const handleGenerateAll = async () => {
    if (!projectId) return;
    setIsGeneratingAll(true);
    try {
      type GenerationElement = {
        id: string;
        type?: string;
        imageId?: string | null;
        animationPrompt?: string | null;
      };

      const pageRequests = await Promise.all(
        pages.map(async (page) => {
          const data = await api
            .get(`pages/${page.id}/elements`)
            .json<{ elements?: GenerationElement[] }>();
          return data.elements ?? [];
        })
      );

      const imageElements = pageRequests
        .flat()
        .filter((element) => element.type === "image" && element.imageId)
        .map((element) => {
          const rawPrompt =
            typeof element.animationPrompt === "string" ? element.animationPrompt : "";
          const prompt =
            rawPrompt.trim().length > 0
              ? rawPrompt.trim()
              : "Animate this photo with gentle movement.";
          return {
            elementId: String(element.id),
            imageId: String(element.imageId),
            prompt,
          };
        });

      if (imageElements.length === 0) {
        showToolbarMessage("info", "No image elements ready for generation yet.");
        return;
      }

      if (imageElements.length > 25) {
        showToolbarMessage("error", "Too many images selected. Limit is 25 per generation.");
        return;
      }

      await api.post(`projects/${projectId}/generate`, {
        json: {
          elements: imageElements,
        },
      });

      showToolbarMessage("success", `Generation started for ${imageElements.length} images.`);
      setIsProgressOpen(true);
      if (activePageId) {
        void fetchElements(activePageId);
      }
    } catch (error) {
      const parsed = await parseApiError(error);
      showToolbarMessage("error", parsed.message);
    } finally {
      setIsGeneratingAll(false);
    }
  };

  return (
    <div className="flex min-h-[calc(100vh-57px)] flex-col pb-20 md:pb-0">
      <EditorToolbar
        projectName={session?.projectName}
        elementCount={elementCount}
        photoCount={photoCount}
        canDelete={Boolean(selectedElementId)}
        isDeleteDialogOpen={isDeleteDialogOpen}
        onDeleteDialogOpenChange={setIsDeleteDialogOpen}
        onConfirmDelete={handleConfirmDelete}
        onOpenSidebar={() => setIsSidebarOpen(true)}
        onAddPage={() => setIsTemplateDialogOpen(true)}
        onAddImage={() => setIsUploadOpen(true)}
        onAddText={handleAddText}
        onRequestDelete={handleRequestDelete}
        onGenerateAll={handleGenerateAll}
        onOpenProgress={() => setIsProgressOpen(true)}
        onOpenShare={() => setIsShareDialogOpen(true)}
        onOpenExport={() => setIsExportDialogOpen(true)}
        onSave={() => undefined}
        message={toolbarMessage}
        disableAddImage={!projectId || !activePageId || photoCount >= 5}
        disableAddText={!activePageId}
        disableGenerate={!projectId || isGeneratingAll}
        disableSave={!projectId}
      />

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
          </div>
          <div className="mx-auto aspect-[3/4] max-w-2xl">
            {pagesLoading ? (
              <div className="flex h-full items-center justify-center rounded-sm border border-sepia/20 bg-cream/70">
                <span className="inline-flex items-center gap-2 text-sm text-muted">
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Loading pages...
                </span>
              </div>
            ) : pages.length === 0 ? (
              <div className="flex h-full flex-col items-center justify-center gap-4 rounded-sm border border-dashed border-sepia/30 bg-cream/60 p-6 text-center">
                <div>
                  <p className="font-headline text-ink-effect">Start your first page</p>
                  <p className="mt-1 text-sm text-muted">
                    Choose a template to begin building your gazette.
                  </p>
                </div>
                <Button type="button" onClick={() => setIsTemplateDialogOpen(true)}>
                  <Plus />
                  Add your first page
                </Button>
              </div>
            ) : (
              <div className="relative h-full w-full">
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
                  onSelectElement={selectElement}
                  onClearSelection={() => selectElement(null)}
                  onImageDoubleClick={handleImageDoubleClick}
                  onTextCommit={handleTextCommit}
                  onElementPositionChange={handleElementPositionChange}
                  onResizeElement={handleElementPositionChange}
                  enableGestures
                />
                {elementsLoading ? (
                  <div className="absolute inset-0 flex items-center justify-center rounded-sm bg-cream/60">
                    <span className="inline-flex items-center gap-2 text-sm text-muted">
                      <Loader2 className="h-4 w-4 animate-spin" />
                      Loading elements...
                    </span>
                  </div>
                ) : null}
              </div>
            )}
          </div>
        </main>

        {/* Properties Panel */}
        <PropertiesPanel
          pageId={activePageId}
          elements={activeElements}
          onEditImage={handleImageDoubleClick}
        />
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
            disabled={!projectId || !activePageId || photoCount >= 5}
            aria-label="Add photo"
            title="Add Photo"
          >
            <ImagePlus />
          </Button>
          <Button
            type="button"
            variant="outline"
            size="icon"
            onClick={handleAddText}
            disabled={!activePageId}
            aria-label="Add text"
            title="Add Text"
          >
            <Type />
          </Button>
          <Button
            type="button"
            variant="destructive"
            size="icon"
            onClick={handleRequestDelete}
            disabled={!selectedElementId}
            aria-label="Delete"
            title="Delete"
          >
            <Trash2 />
          </Button>
          <Button
            type="button"
            size="icon"
            onClick={handleGenerateAll}
            disabled={!projectId || isGeneratingAll}
            aria-label="Generate all"
            title="Generate All"
          >
            <Sparkles />
          </Button>
          <Button
            type="button"
            variant="outline"
            size="icon"
            onClick={() => setIsShareDialogOpen(true)}
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
      <AnimationDialog
        open={isAnimationOpen}
        onOpenChange={handleAnimationOpenChange}
        element={animationElement}
        onSavePrompt={handleSaveAnimationPrompt}
      />
      <ExportDialog
        open={isExportDialogOpen}
        onOpenChange={setIsExportDialogOpen}
        projectId={projectId}
      />
      <ShareDialog
        open={isShareDialogOpen}
        onOpenChange={setIsShareDialogOpen}
        projectId={projectId}
        projectName={session?.projectName}
      />
    </div>
  );
}
