import { createRootRoute, Link, Outlet, useNavigate, useRouterState } from "@tanstack/react-router";
import { TanStackRouterDevtools } from "@tanstack/react-router-devtools";
import { useEffect, useState } from "react";
import { LogOut, Menu, Newspaper } from "lucide-react";

import { getAuthSession, clearAuthSession } from "@/lib/auth";
import { Button } from "@/components/ui/button";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { Sheet, SheetClose, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";

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

  const navValue = pathname.startsWith("/viewer") ? "viewer" : "editor";

  const SignOutDialog = ({ className }: { className?: string }) => (
    <AlertDialog>
      <AlertDialogTrigger asChild>
        <Button variant="outline" size="sm" className={className}>
          <LogOut className="h-4 w-4" />
          <span>Sign Out</span>
        </Button>
      </AlertDialogTrigger>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Sign out of this project?</AlertDialogTitle>
          <AlertDialogDescription>
            You will be returned to the project selection screen.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel>Cancel</AlertDialogCancel>
          <AlertDialogAction onClick={handleSignOut}>Sign Out</AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );

  return (
    <div className="min-h-screen bg-cream">
      {isViewerRoute ? null : (
        <header className="border-b border-sepia/20 bg-parchment">
          <nav className="mx-auto flex max-w-7xl items-center justify-between gap-4 px-4 py-3">
            <div className="flex items-center gap-3">
              <Link to="/" className="font-masthead text-2xl text-sepia no-underline">
                La Gazette de la Vie
              </Link>
              {session ? (
                <span className="inline-flex items-center gap-2 rounded-full border border-sepia/40 bg-cream/80 px-3 py-1 text-xs font-semibold text-sepia">
                  <Newspaper className="h-3.5 w-3.5 text-sepia/80" />
                  <span className="max-w-[12rem] truncate">{session.projectName}</span>
                </span>
              ) : null}
            </div>
            {session ? (
              <>
                <div className="hidden items-center gap-3 font-ui text-sm md:flex">
                  <Tabs value={navValue}>
                    <TabsList className="bg-cream/50">
                      <TabsTrigger value="editor" asChild>
                        <Link to="/editor" className="no-underline">
                          Editor
                        </Link>
                      </TabsTrigger>
                      <TabsTrigger value="viewer" asChild>
                        <Link to="/viewer" className="no-underline">
                          Viewer
                        </Link>
                      </TabsTrigger>
                    </TabsList>
                  </Tabs>
                  <SignOutDialog className="h-9 px-3 text-sepia" />
                </div>
                <div className="flex items-center md:hidden">
                  <Sheet>
                    <SheetTrigger asChild>
                      <Button variant="ghost" size="icon" className="text-sepia">
                        <Menu className="h-5 w-5" />
                        <span className="sr-only">Open menu</span>
                      </Button>
                    </SheetTrigger>
                    <SheetContent side="right" className="w-72">
                      <div className="flex flex-col gap-4 font-ui text-sm">
                        <div className="rounded-sm border border-sepia/30 bg-cream/70 p-3 text-xs text-sepia">
                          <div className="flex items-center gap-2 font-semibold">
                            <Newspaper className="h-4 w-4" />
                            <span className="truncate">{session.projectName}</span>
                          </div>
                        </div>
                        <div className="flex flex-col gap-2">
                          <SheetClose asChild>
                            <Link
                              to="/editor"
                              className="rounded-sm border border-sepia/20 px-3 py-2 text-sm font-semibold text-sepia transition-colors hover:bg-cream"
                            >
                              Editor
                            </Link>
                          </SheetClose>
                          <SheetClose asChild>
                            <Link
                              to="/viewer"
                              className="rounded-sm border border-sepia/20 px-3 py-2 text-sm font-semibold text-sepia transition-colors hover:bg-cream"
                            >
                              Viewer
                            </Link>
                          </SheetClose>
                        </div>
                        <SignOutDialog className="justify-center" />
                      </div>
                    </SheetContent>
                  </Sheet>
                </div>
              </>
            ) : (
              <>
                <div className="hidden items-center gap-3 font-ui text-sm md:flex">
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
                </div>
                <div className="flex items-center md:hidden">
                  <Sheet>
                    <SheetTrigger asChild>
                      <Button variant="ghost" size="icon" className="text-sepia">
                        <Menu className="h-5 w-5" />
                        <span className="sr-only">Open menu</span>
                      </Button>
                    </SheetTrigger>
                    <SheetContent side="right" className="w-72">
                      <div className="flex flex-col gap-3 font-ui text-sm">
                        <SheetClose asChild>
                          <Link
                            to="/auth"
                            className="rounded-sm border border-sepia/20 px-3 py-2 text-sm font-semibold text-sepia transition-colors hover:bg-cream"
                          >
                            Sign In
                          </Link>
                        </SheetClose>
                        <SheetClose asChild>
                          <Link
                            to="/auth"
                            className="rounded-sm bg-sepia px-3 py-2 text-sm font-semibold text-parchment transition-colors hover:bg-sepia/90"
                          >
                            Create Project
                          </Link>
                        </SheetClose>
                      </div>
                    </SheetContent>
                  </Sheet>
                </div>
              </>
            )}
          </nav>
        </header>
      )}
      <main>
        <Outlet />
      </main>
      {import.meta.env.DEV ? <TanStackRouterDevtools /> : null}
    </div>
  );
}
