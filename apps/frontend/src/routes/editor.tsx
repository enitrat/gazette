import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/editor")({
  component: EditorPage,
});

function EditorPage() {
  return (
    <div className="flex min-h-[calc(100vh-57px)]">
      {/* Sidebar */}
      <aside className="w-64 border-r border-sepia/20 bg-parchment p-4">
        <h3 className="mb-4 text-ink-effect">Pages</h3>
        <div className="space-y-2">
          <div className="cursor-pointer rounded-sm border border-sepia/30 bg-cream p-3 transition-colors hover:border-gold">
            <p className="font-ui text-sm font-medium text-ink">Page 1</p>
            <p className="font-ui text-xs text-muted">Cover</p>
          </div>
          <button className="flex w-full items-center justify-center gap-2 rounded-sm border border-dashed border-muted/50 bg-transparent p-3 font-ui text-sm text-muted transition-colors hover:border-gold hover:text-sepia">
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
    </div>
  );
}
