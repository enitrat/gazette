import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { cn } from "@/lib/utils";

type ProjectHeaderProps = {
  projectName?: string;
  userId?: string;
  elementCount: number;
  photoCount: number;
  className?: string;
};

export function ProjectHeader({
  projectName = "La Gazette de la Vie",
  userId = "test123456",
  elementCount,
  photoCount,
  className,
}: ProjectHeaderProps) {
  return (
    <Card className={cn("border-sepia/20 bg-cream/90 p-3 shadow-none paper-texture", className)}>
      <div className="space-y-2">
        <div className="flex items-start justify-between gap-2">
          <div className="font-headline text-lg text-ink-effect">{projectName}</div>
          <Badge
            variant="secondary"
            className="border border-sepia/20 bg-muted/10 font-ui text-[10px] text-muted"
          >
            {userId}
          </Badge>
        </div>
        <div className="font-ui text-xs text-muted">
          Elements: {elementCount} | Photos: {photoCount}
        </div>
      </div>
    </Card>
  );
}
