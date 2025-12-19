import { createRootRoute, Link, Outlet, useRouterState, useNavigate } from "@tanstack/react-router";
import { TanStackRouterDevtools } from "@tanstack/router-devtools";
import { useEffect, useState } from "react";
import { getAuthSession, clearAuthSession } from "@/lib/auth";
import { Button } from "@/components/ui/button";
import { LogOut } from "lucide-react";

export const Route = createRootRoute({
  component: RootLayout,
});

function RootLayout() {
  const pathname = useRouterState({ select: (state) => state.location.pathname });
  const navigate = useNavigate();
  const isViewerRoute = pathname.startsWith("/view/");
  const [session, setSession] = useState(() => getAuthSession());

  // Update session state when pathname changes (e.g., after login)
  useEffect(() => {
    setSession(getAuthSession());
  }, [pathname]);

  const handleSignOut = () => {
    clearAuthSession();
    setSession(null);
    navigate({ to: "/" });
  };

  return (
    <div className="min-h-screen bg-cream">
      {isViewerRoute ? null : (
        <header className="border-b border-sepia/20 bg-parchment">
          <nav className="mx-auto flex max-w-7xl items-center justify-between px-4 py-3">
            <Link to="/" className="font-masthead text-2xl text-sepia no-underline">
              La Gazette de la Vie
            </Link>
            <div className="flex items-center gap-4 font-ui text-sm">
              {session ? (
                <>
                  <span className="rounded-full border border-sepia/30 bg-cream/70 px-3 py-1 text-xs text-muted">
                    {session.projectName}
                  </span>
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
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={handleSignOut}
                    className="h-auto px-2 py-1 text-muted hover:text-sepia"
                  >
                    <LogOut className="h-4 w-4" />
                    <span className="ml-1">Sign Out</span>
                  </Button>
                </>
              ) : (
                <>
                  <Link
                    to="/auth"
                    className="text-muted no-underline transition-colors hover:text-sepia [&.active]:text-sepia [&.active]:font-medium"
                  >
                    Sign In
                  </Link>
                  <Link
                    to="/auth"
                    className="rounded-sm bg-sepia px-3 py-1.5 text-parchment no-underline transition-colors hover:bg-sepia/90"
                  >
                    Create Project
                  </Link>
                </>
              )}
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
