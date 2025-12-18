import { useMemo, useState } from "react";
import { createFileRoute } from "@tanstack/react-router";

import { TemplateDialog, TEMPLATE_OPTIONS, type CreatedPage } from "@/components/TemplateDialog";

export const Route = createFileRoute("/editor")({
  component: EditorPage,
});

function EditorPage() {
  const [isTemplateDialogOpen, setIsTemplateDialogOpen] = useState(false);
  const [pages, setPages] = useState<
    { id: string; title: string; subtitle: string; templateId: string }[]
  >([
    {
      id: "page-1",
      title: "Page 1",
      subtitle: "Cover",
      templateId: "classic-front",
    },
  ]);

  const templateNameById = useMemo(() => {
    const map = new Map<string, string>();
    TEMPLATE_OPTIONS.forEach((template) => map.set(template.id, template.name));
    return map;
  }, []);

  const handlePageCreated = (page: CreatedPage) => {
    setPages((prev) => [
      ...prev,
      {
        id: page.id,
        title: page.title,
        subtitle: page.subtitle,
        templateId: page.templateId,
      },
    ]);
  };

  return (
    <div className="flex min-h-[calc(100vh-57px)]">
      {/* Sidebar */}
      <aside className="w-64 border-r border-sepia/20 bg-parchment p-4">
        <h3 className="mb-4 text-ink-effect">Pages</h3>
        <div className="space-y-2">
          {pages.map((page, index) => {
            const templateName = templateNameById.get(page.templateId) ?? "Custom layout";
            const title = page.title?.trim() ? page.title : `Page ${index + 1}`;
            const subtitle = page.subtitle?.trim() ? page.subtitle : templateName;

            return (
              <div
                key={page.id}
                className="cursor-pointer rounded-sm border border-sepia/30 bg-cream p-3 transition-colors hover:border-gold"
              >
                <p className="font-ui text-sm font-medium text-ink">{title}</p>
                <p className="font-ui text-xs text-muted">{subtitle}</p>
              </div>
            );
          })}
          <button
            type="button"
            onClick={() => setIsTemplateDialogOpen(true)}
            className="flex w-full items-center justify-center gap-2 rounded-sm border border-dashed border-muted/50 bg-transparent p-3 font-ui text-sm text-muted transition-colors hover:border-gold hover:text-sepia"
          >
            + Add Page
          </button>
        </div>
      </aside>

      {/* Canvas */}
      <main className="flex-1 bg-cream/50 p-8">
        <div className="mx-auto aspect-[3/4] max-w-2xl">
          <div className="gazette-page h-full w-full rounded-md p-8">
            <p className="text-center font-subheading text-muted">
              Click to add elements to your gazette
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
        onCreated={handlePageCreated}
      />
    </div>
  );
}
