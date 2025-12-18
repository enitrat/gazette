import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/viewer")({
  component: ViewerPage,
});

function ViewerPage() {
  return (
    <div className="min-h-[calc(100vh-57px)] bg-ink/5 p-8">
      <div className="mx-auto max-w-4xl">
        {/* Viewer Controls */}
        <div className="mb-6 flex items-center justify-between">
          <h2 className="text-ink-effect">Gazette Viewer</h2>
          <div className="flex gap-2">
            <button className="rounded-sm border border-sepia/30 bg-parchment px-4 py-2 font-ui text-sm text-sepia transition-colors hover:bg-sepia hover:text-parchment">
              Previous
            </button>
            <span className="flex items-center px-4 font-ui text-sm text-muted">Page 1 of 4</span>
            <button className="rounded-sm border border-sepia/30 bg-parchment px-4 py-2 font-ui text-sm text-sepia transition-colors hover:bg-sepia hover:text-parchment">
              Next
            </button>
          </div>
        </div>

        {/* Gazette Display */}
        <div className="aspect-[3/4]">
          <div className="gazette-page h-full w-full rounded-md p-12">
            <div className="flex h-full flex-col items-center justify-center">
              <h1 className="mb-2 text-ink-effect">La Gazette de la Vie</h1>
              <p className="font-subheading text-lg text-muted">A Family Chronicle</p>
              <div className="mt-8 text-center">
                <p className="font-ui text-sm text-muted">
                  Share your gazette or generate an animated preview
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="mt-6 flex justify-center gap-4">
          <button className="rounded-sm bg-gold px-6 py-2 font-ui text-sm font-medium text-ink transition-colors hover:bg-gold/90">
            Generate Animation
          </button>
          <button className="rounded-sm border border-sepia/30 bg-parchment px-6 py-2 font-ui text-sm text-sepia transition-colors hover:bg-sepia hover:text-parchment">
            Share Gazette
          </button>
        </div>
      </div>
    </div>
  );
}
