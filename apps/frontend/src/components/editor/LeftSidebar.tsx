import { Sheet, SheetContent } from "@/components/ui/sheet";
import { cn } from "@/lib/utils";
import type { PageSummary } from "@/stores/pages-store";
import { ProjectHeader } from "@/components/editor/ProjectHeader";
import { PagesList } from "@/components/editor/PagesList";
import { ContentLibrary } from "@/components/editor/ContentLibrary";

type LeftSidebarProps = {
  projectName?: string;
  userId?: string;
  elementCount: number;
  photoCount: number;
  pages: PageSummary[];
  activePageId?: string | null;
  isLoading?: boolean;
  error?: string | null;
  onSelectPage: (pageId: string) => void;
  onNewPage: () => void;
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
  className?: string;
};

function LeftSidebarContent({
  projectName,
  userId,
  elementCount,
  photoCount,
  pages,
  activePageId,
  isLoading,
  error,
  onSelectPage,
  onNewPage,
  className,
}: Omit<LeftSidebarProps, "open" | "onOpenChange">) {
  return (
    <div
      className={cn(
        "flex h-full w-[240px] flex-col gap-4 border-r border-sepia/20 bg-cream/90 p-4",
        className
      )}
    >
      <ProjectHeader
        projectName={projectName}
        userId={userId}
        elementCount={elementCount}
        photoCount={photoCount}
      />
      <PagesList
        pages={pages}
        activePageId={activePageId}
        isLoading={isLoading}
        error={error}
        onSelectPage={onSelectPage}
        onNewPage={onNewPage}
      />
      <ContentLibrary />
    </div>
  );
}

export function LeftSidebar({
  projectName,
  userId,
  elementCount,
  photoCount,
  pages,
  activePageId,
  isLoading,
  error,
  onSelectPage,
  onNewPage,
  open = false,
  onOpenChange,
  className,
}: LeftSidebarProps) {
  const handleSelectPage = (pageId: string) => {
    onSelectPage(pageId);
    onOpenChange?.(false);
  };

  return (
    <>
      <aside className="hidden lg:flex">
        <LeftSidebarContent
          projectName={projectName}
          userId={userId}
          elementCount={elementCount}
          photoCount={photoCount}
          pages={pages}
          activePageId={activePageId}
          isLoading={isLoading}
          error={error}
          onSelectPage={handleSelectPage}
          onNewPage={onNewPage}
          className={className}
        />
      </aside>
      <div className="hidden md:block lg:hidden">
        <Sheet open={open} onOpenChange={onOpenChange}>
          <SheetContent
            side="left"
            className="w-[240px] max-w-[240px] border-sepia/20 bg-cream/95 p-0"
          >
            <LeftSidebarContent
              projectName={projectName}
              userId={userId}
              elementCount={elementCount}
              photoCount={photoCount}
              pages={pages}
              activePageId={activePageId}
              isLoading={isLoading}
              error={error}
              onSelectPage={handleSelectPage}
              onNewPage={onNewPage}
            />
          </SheetContent>
        </Sheet>
      </div>
    </>
  );
}
