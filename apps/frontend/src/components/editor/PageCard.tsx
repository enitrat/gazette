import { MoreVertical } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { cn } from "@/lib/utils";
import type { PageSummary } from "@/stores/pages-store";

type PageCardProps = {
  page: PageSummary;
  isSelected: boolean;
  onSelect: (pageId: string) => void;
};

function PageThumbnail() {
  return (
    <div className="flex h-16 w-12 flex-col gap-1 rounded-sm border border-sepia/30 bg-parchment p-1">
      <div className="h-2 w-full rounded-[2px] bg-sepia/40" />
      <div className="h-1.5 w-4/5 rounded-[2px] bg-sepia/25" />
      <div className="flex flex-1 gap-1">
        <div className="flex-1 rounded-[2px] bg-sepia/15" />
        <div className="w-3 rounded-[2px] bg-sepia/20" />
      </div>
      <div className="h-1.5 w-full rounded-[2px] bg-sepia/20" />
    </div>
  );
}

export function PageCard({ page, isSelected, onSelect }: PageCardProps) {
  const title = page.title.trim();
  const subtitle = page.subtitle.trim();
  const pageName = title || subtitle || "Masthead";

  return (
    <Card
      role="button"
      tabIndex={0}
      onClick={() => onSelect(page.id)}
      className={cn(
        "group cursor-pointer border-sepia/20 bg-cream/90 p-2 shadow-none transition-colors hover:bg-muted/10 paper-texture",
        isSelected && "ring-2 ring-gold"
      )}
    >
      <div className="flex items-center gap-3">
        <PageThumbnail />
        <div className="flex-1">
          <div className="font-ui text-sm text-ink">
            Page {page.order + 1} - {pageName}
          </div>
        </div>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button
              type="button"
              variant="ghost"
              size="icon"
              className="h-7 w-7 text-muted hover:text-sepia"
              onClick={(event) => event.stopPropagation()}
              aria-label="Open page actions"
            >
              <MoreVertical className="h-4 w-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuItem>Duplicate</DropdownMenuItem>
            <DropdownMenuItem>Rename</DropdownMenuItem>
            <DropdownMenuItem className="text-aged-red">Delete</DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </Card>
  );
}
