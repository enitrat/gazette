import { useState } from 'react';
import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { GripVertical, MoreVertical, Copy, Trash2, Edit3, FileText } from 'lucide-react';
import { usePagesStore } from '@/stores/pages-store';
import type { PageListItem } from '@/lib/api';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';

interface PageCardProps {
  page: PageListItem;
  isSelected: boolean;
  onSelect: () => void;
  onDuplicate: () => void;
  onDelete: () => void;
}

export function PageCard({ page, isSelected, onSelect, onDuplicate, onDelete }: PageCardProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [editedTitle, setEditedTitle] = useState(page.title || `Page ${page.order + 1}`);
  const updatePage = usePagesStore((state) => state.updatePage);

  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: page.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  };

  const handleDoubleClick = () => {
    setIsEditing(true);
  };

  const handleTitleSubmit = async () => {
    setIsEditing(false);
    if (editedTitle !== page.title) {
      await updatePage(page.id, { title: editedTitle });
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleTitleSubmit();
    } else if (e.key === 'Escape') {
      setEditedTitle(page.title || `Page ${page.order + 1}`);
      setIsEditing(false);
    }
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={`
        group relative rounded-sm border transition-all duration-200
        ${isDragging ? 'opacity-50 scale-95' : 'opacity-100 scale-100'}
        ${
          isSelected
            ? 'border-gold bg-gradient-to-br from-parchment/80 to-cream/60 shadow-md ring-2 ring-gold/30'
            : 'border-sepia/20 bg-cream/40 hover:border-sepia/40 hover:bg-cream/60 hover:shadow-sm'
        }
      `}
    >
      {/* Vintage decorative corner accents */}
      <div className="pointer-events-none absolute -left-px -top-px h-2 w-2 border-l-2 border-t-2 border-gold/40" />
      <div className="pointer-events-none absolute -right-px -top-px h-2 w-2 border-r-2 border-t-2 border-gold/40" />

      <div className="flex items-start gap-2 p-3">
        {/* Drag Handle */}
        <button
          {...attributes}
          {...listeners}
          className="mt-1 cursor-grab touch-none text-sepia/40 transition-colors hover:text-sepia active:cursor-grabbing"
          aria-label="Drag to reorder"
        >
          <GripVertical className="h-4 w-4" />
        </button>

        <button
          onClick={onSelect}
          onDoubleClick={handleDoubleClick}
          className="flex flex-1 flex-col gap-2 text-left"
        >
          {/* Page Thumbnail Preview */}
          <div
            className={`
              relative aspect-[8.5/11] w-full overflow-hidden rounded-sm border
              transition-all duration-200
              ${
                isSelected
                  ? 'border-gold/60 bg-white shadow-inner'
                  : 'border-sepia/30 bg-gradient-to-br from-white to-cream/40'
              }
            `}
          >
            {/* Vintage paper texture overlay */}
            <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,transparent_0%,rgba(92,64,51,0.03)_100%)]" />

            {/* Template indicator icon */}
            <div className="absolute inset-0 flex items-center justify-center">
              <FileText className="h-8 w-8 text-sepia/15" strokeWidth={1.5} />
            </div>

            {/* Template badge */}
            <div className="absolute right-1 top-1 rounded-sm bg-sepia/90 px-1.5 py-0.5 text-[9px] font-ui font-medium uppercase tracking-wider text-cream shadow-sm">
              {page.templateId.replace('-', ' ')}
            </div>

            {/* Page number badge */}
            <div className="absolute bottom-1 left-1 flex h-5 w-5 items-center justify-center rounded-full bg-gold/90 text-[10px] font-ui font-bold text-ink shadow-sm">
              {page.order + 1}
            </div>
          </div>

          {/* Page Title */}
          {isEditing ? (
            <Input
              value={editedTitle}
              onChange={(e) => setEditedTitle(e.target.value)}
              onBlur={handleTitleSubmit}
              onKeyDown={handleKeyDown}
              className="h-7 border-gold/40 bg-white px-2 text-xs font-ui font-medium text-ink focus:ring-gold"
              autoFocus
              onClick={(e) => e.stopPropagation()}
            />
          ) : (
            <div className="flex items-center gap-1.5">
              <p className="line-clamp-2 text-xs font-ui font-medium text-ink">
                {page.title || `Page ${page.order + 1}`}
              </p>
              {isSelected && (
                <Edit3 className="h-3 w-3 flex-shrink-0 text-gold/60" />
              )}
            </div>
          )}
        </button>

        {/* Actions Menu */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button
              variant="ghost"
              size="sm"
              className="h-7 w-7 p-0 text-sepia/50 opacity-0 transition-all hover:bg-sepia/10 hover:text-sepia group-hover:opacity-100"
              onClick={(e) => e.stopPropagation()}
            >
              <MoreVertical className="h-3.5 w-3.5" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent
            align="end"
            className="w-40 border-sepia/20 bg-cream font-ui"
          >
            <DropdownMenuItem
              onClick={(e) => {
                e.stopPropagation();
                setIsEditing(true);
              }}
              className="cursor-pointer text-xs hover:bg-parchment/60 focus:bg-parchment/60"
            >
              <Edit3 className="mr-2 h-3.5 w-3.5" />
              Rename
            </DropdownMenuItem>
            <DropdownMenuItem
              onClick={(e) => {
                e.stopPropagation();
                onDuplicate();
              }}
              className="cursor-pointer text-xs hover:bg-parchment/60 focus:bg-parchment/60"
            >
              <Copy className="mr-2 h-3.5 w-3.5" />
              Duplicate
            </DropdownMenuItem>
            <DropdownMenuItem
              onClick={(e) => {
                e.stopPropagation();
                onDelete();
              }}
              className="cursor-pointer text-xs text-aged-red hover:bg-aged-red/10 focus:bg-aged-red/10 focus:text-aged-red"
            >
              <Trash2 className="mr-2 h-3.5 w-3.5" />
              Delete
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </div>
  );
}
