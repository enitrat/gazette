import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";
import { cn } from "@/lib/utils";
import type { PageSummary } from "@/stores/pages-store";
import { PageCard } from "@/components/editor/PageCard";

type PagesListProps = {
  pages: PageSummary[];
  activePageId?: string | null;
  isLoading?: boolean;
  error?: string | null;
  onSelectPage: (pageId: string) => void;
  onNewPage: () => void;
  className?: string;
};

export function PagesList({
  pages,
  activePageId,
  isLoading,
  error,
  onSelectPage,
  onNewPage,
  className,
}: PagesListProps) {
  return (
    <Card className={cn("border-sepia/20 bg-cream/90 p-3 shadow-none paper-texture", className)}>
      <div className="mb-3 flex items-center justify-between">
        <span className="font-headline text-base text-ink-effect">Pages</span>
        <Badge
          variant="secondary"
          className="border border-sepia/20 bg-muted/10 font-ui text-[10px] text-muted"
        >
          {pages.length} total
        </Badge>
      </div>
      <div className="space-y-3">
        <ScrollArea className="h-[240px] pr-2">
          <div className="space-y-2">
            {isLoading ? (
              <div className="rounded-sm border border-sepia/20 bg-cream/70 p-3 font-ui text-xs text-muted">
                Loading pages...
              </div>
            ) : null}
            {!isLoading && error ? (
              <div className="rounded-sm border border-aged-red/30 bg-aged-red/10 p-3 font-ui text-xs text-aged-red">
                {error}
              </div>
            ) : null}
            {!isLoading && !error && pages.length === 0 ? (
              <div className="rounded-sm border border-sepia/20 bg-cream/70 p-3 font-ui text-xs text-muted">
                Every story begins with a blank page. Add your first.
              </div>
            ) : null}
            {!isLoading && !error
              ? pages.map((page) => (
                  <PageCard
                    key={page.id}
                    page={page}
                    isSelected={page.id === activePageId}
                    onSelect={onSelectPage}
                  />
                ))
              : null}
          </div>
        </ScrollArea>
        <Button type="button" variant="outline" className="w-full" onClick={onNewPage}>
          + New Page
        </Button>
      </div>
    </Card>
  );
}
