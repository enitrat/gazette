import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import type { Template } from "@gazette/shared";
import { PageSidebar } from "@/components/PageSidebar";
import { ExportDialog } from "@/components/ExportDialog";
import { TemplateDialog } from "@/components/TemplateDialog";
import { GenerationProgressDialog } from "@/components/GenerationProgressDialog";
import { Button } from "@/components/ui/button";
import { getAuthSession } from "@/lib/auth";
import { usePagesStore } from "@/stores/pages-store";
import { Download, Plus, Save, Share2, Sparkles } from "lucide-react";

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
  const [canvasRefreshKey, setCanvasRefreshKey] = useState(0);

  const activePageId = useMemo(() => pageId ?? pages[0]?.id, [pageId, pages]);

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
            <Button variant="outline" onClick={() => setIsProgressOpen(true)} disabled={!projectId}>
              View generation
            </Button>
          </div>
          <div className="mx-auto aspect-[3/4] max-w-2xl">
            <div key={canvasRefreshKey} className="gazette-page h-full w-full rounded-md p-8">
              <p className="text-center font-subheading text-muted">
                {activePageId ? "Click to add elements to your gazette" : "Select a page to begin"}
              </p>
            </div>
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
        onComplete={() => setCanvasRefreshKey((prev) => prev + 1)}
      />
      <ExportDialog
        open={isExportDialogOpen}
        onOpenChange={setIsExportDialogOpen}
        projectId={projectId}
      />
    </div>
  );
}
