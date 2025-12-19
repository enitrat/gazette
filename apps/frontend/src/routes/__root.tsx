import { createRootRoute, Link, Outlet, useRouterState } from "@tanstack/react-router";
import { TanStackRouterDevtools } from "@tanstack/react-router-devtools";

export const Route = createRootRoute({
  component: RootLayout,
});

function RootLayout() {
  const pathname = useRouterState({ select: (state) => state.location.pathname });
  const isViewerRoute = pathname.startsWith("/view/");

  return (
    <div className="min-h-screen bg-cream">
      {isViewerRoute ? null : (
        <header className="border-b border-sepia/20 bg-parchment">
          <nav className="mx-auto flex max-w-7xl items-center justify-between px-4 py-3">
            <Link to="/" className="font-masthead text-2xl text-sepia no-underline">
              La Gazette de la Vie
            </Link>
            <div className="flex gap-4 font-ui text-sm">
              <Link
                to="/auth"
                className="text-muted no-underline transition-colors hover:text-sepia [&.active]:text-sepia [&.active]:font-medium"
              >
                Sign In
              </Link>
              <Link
                to="/editor"
                className="text-muted no-underline transition-colors hover:text-sepia [&.active]:text-sepia [&.active]:font-medium"
              >
                Editor
              </Link>
              <Link
                to="/viewer"
                className="text-muted no-underline transition-colors hover:text-sepia [&.active]:text-sepia [&.active]:font-medium"
              >
                Viewer
              </Link>
            </div>
          </nav>
        </header>
      )}
      <main>
        <Outlet />
      </main>
      <TanStackRouterDevtools />
    </div>
  );
}
