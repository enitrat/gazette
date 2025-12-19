import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import type { Template } from "@gazette/shared";
import { PageSidebar } from "@/components/PageSidebar";
import { TemplateDialog } from "@/components/TemplateDialog";
import { getAuthSession } from "@/lib/auth";
import { usePagesStore } from "@/stores/pages-store";

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
    <div className="flex min-h-[calc(100vh-57px)]">
      {/* Sidebar */}
      <PageSidebar
        projectId={projectId}
        activePageId={activePageId}
        onSelectPage={handleSelectPage}
        onRequestNewPage={() => setIsTemplateDialogOpen(true)}
      />

      {/* Canvas */}
      <main className="flex-1 bg-cream/50 p-8">
        <div className="mx-auto aspect-[3/4] max-w-2xl">
          <div className="gazette-page h-full w-full rounded-md p-8">
            <p className="text-center font-subheading text-muted">
              {activePageId ? "Click to add elements to your gazette" : "Select a page to begin"}
            </p>
          </div>
        </div>
      </main>

      {/* Properties Panel */}
      <aside className="w-72 border-l border-sepia/20 bg-parchment p-4">
        <h3 className="mb-4 text-ink-effect">Properties</h3>
        <p className="font-ui text-sm text-muted">Select an element to edit its properties</p>
      </aside>

      <TemplateDialog
        open={isTemplateDialogOpen}
        onOpenChange={setIsTemplateDialogOpen}
        onCreate={handleCreatePage}
      />
    </div>
  );
}
