import { useState, useEffect } from 'react';
import { useDraggable } from '@dnd-kit/core';
import { Type, Heading1, Heading2, FileText, Image as ImageIcon, LayoutTemplate } from 'lucide-react';
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '@/components/ui/accordion';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import api from '@/lib/api';
import { useUIStore } from '@/stores/ui-store';
import type { SerializedImage, TemplateDefinition } from '@gazette/shared';

interface DraggableItemProps {
  id: string;
  type: 'element' | 'media' | 'template';
  data: any;
  children: React.ReactNode;
  className?: string;
}

function DraggableItem({ id, type, data, children, className = '' }: DraggableItemProps) {
  const { attributes, listeners, setNodeRef, isDragging } = useDraggable({
    id,
    data: { type, ...data },
  });

  return (
    <div
      ref={setNodeRef}
      {...listeners}
      {...attributes}
      className={`
        cursor-grab touch-none transition-all active:cursor-grabbing
        ${isDragging ? 'opacity-50 scale-95' : 'opacity-100 scale-100'}
        ${className}
      `}
    >
      {children}
    </div>
  );
}

export function ContentLibrary({ projectId }: { projectId: string }) {
  const [images, setImages] = useState<SerializedImage[]>([]);
  const [isLoadingImages, setIsLoadingImages] = useState(false);
  const mediaRefreshTrigger = useUIStore((state) => state.mediaRefreshTrigger);

  useEffect(() => {
    const fetchImages = async () => {
      setIsLoadingImages(true);
      try {
        const projectImages = await api.images.list(projectId);
        setImages(projectImages);
      } catch (error) {
        console.error('Failed to fetch images:', error);
        setImages([]);
      } finally {
        setIsLoadingImages(false);
      }
    };

    fetchImages();
  }, [projectId, mediaRefreshTrigger]);

  // Template definitions
  const templates: TemplateDefinition[] = [
    {
      id: 'full-page',
      name: 'Full Page',
      description: 'Single column layout',
      canvas: { width: 816, height: 1056 },
      elements: [],
    },
    {
      id: 'two-columns',
      name: 'Two Columns',
      description: 'Classic newspaper layout',
      canvas: { width: 816, height: 1056 },
      elements: [],
    },
    {
      id: 'three-grid',
      name: 'Three Grid',
      description: 'Multi-column grid',
      canvas: { width: 816, height: 1056 },
      elements: [],
    },
    {
      id: 'masthead',
      name: 'Masthead',
      description: 'Header with title',
      canvas: { width: 816, height: 1056 },
      elements: [],
    },
  ];

  // Text element types
  const textElements = [
    {
      id: 'headline',
      label: 'Headline',
      icon: Heading1,
      description: 'Large title text',
      defaultSize: { width: 400, height: 80 },
    },
    {
      id: 'subheading',
      label: 'Subheading',
      icon: Heading2,
      description: 'Secondary heading',
      defaultSize: { width: 350, height: 60 },
    },
    {
      id: 'caption',
      label: 'Caption',
      icon: Type,
      description: 'Body text',
      defaultSize: { width: 300, height: 120 },
    },
  ];

  return (
    <Accordion type="multiple" defaultValue={['elements', 'media', 'templates']} className="w-full">
      {/* Elements Section */}
      <AccordionItem value="elements" className="border-b border-sepia/20">
        <AccordionTrigger className="px-2 py-3 font-headline text-sm font-semibold text-ink hover:bg-parchment/30 hover:no-underline">
          <div className="flex items-center gap-2">
            <FileText className="h-4 w-4 text-gold" />
            <span>Elements</span>
            <Badge
              variant="outline"
              className="ml-auto border-sepia/30 bg-cream/50 text-[10px] font-ui text-sepia"
            >
              {textElements.length}
            </Badge>
          </div>
        </AccordionTrigger>
        <AccordionContent className="px-2 pb-3 pt-2">
          <div className="space-y-2">
            {textElements.map((element) => (
              <DraggableItem
                key={element.id}
                id={`element-${element.id}`}
                type="element"
                data={{
                  elementType: element.id,
                  defaultSize: element.defaultSize,
                }}
                className="group relative overflow-hidden rounded-sm border border-sepia/20 bg-gradient-to-br from-white to-cream/40 p-3 hover:border-gold/40 hover:shadow-sm"
              >
                {/* Vintage corner decorations */}
                <div className="pointer-events-none absolute -right-1 -top-1 h-3 w-3 border-r border-t border-gold/30 opacity-0 transition-opacity group-hover:opacity-100" />
                <div className="pointer-events-none absolute -bottom-1 -left-1 h-3 w-3 border-b border-l border-gold/30 opacity-0 transition-opacity group-hover:opacity-100" />

                <div className="flex items-center gap-3">
                  <div className="flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-sm bg-sepia/10 transition-colors group-hover:bg-gold/20">
                    <element.icon className="h-4 w-4 text-sepia group-hover:text-gold" strokeWidth={2} />
                  </div>
                  <div className="flex-1">
                    <p className="font-ui text-xs font-semibold text-ink">
                      {element.label}
                    </p>
                    <p className="font-ui text-[10px] text-muted">
                      {element.description}
                    </p>
                  </div>
                  <div className="flex h-5 w-5 flex-shrink-0 items-center justify-center rounded-full bg-sepia/5">
                    <svg
                      className="h-3 w-3 text-sepia/40"
                      fill="none"
                      strokeWidth="2"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path d="M9 5l7 7-7 7" />
                    </svg>
                  </div>
                </div>
              </DraggableItem>
            ))}
          </div>

          {/* Helper text */}
          <p className="mt-3 border-t border-sepia/10 pt-2 font-ui text-[10px] italic text-muted">
            Drag elements onto the canvas to add them
          </p>
        </AccordionContent>
      </AccordionItem>

      {/* Media Section */}
      <AccordionItem value="media" className="border-b border-sepia/20">
        <AccordionTrigger className="px-2 py-3 font-headline text-sm font-semibold text-ink hover:bg-parchment/30 hover:no-underline">
          <div className="flex items-center gap-2">
            <ImageIcon className="h-4 w-4 text-gold" />
            <span>Media</span>
            <Badge
              variant="outline"
              className="ml-auto border-sepia/30 bg-cream/50 text-[10px] font-ui text-sepia"
            >
              {images.length}
            </Badge>
          </div>
        </AccordionTrigger>
        <AccordionContent className="px-2 pb-3 pt-2">
          {isLoadingImages ? (
            <div className="py-8 text-center">
              <div className="inline-block h-6 w-6 animate-spin rounded-full border-2 border-sepia/20 border-t-gold" />
              <p className="mt-2 font-ui text-xs text-muted">Loading media...</p>
            </div>
          ) : images.length === 0 ? (
            <div className="rounded-sm border border-dashed border-sepia/30 bg-cream/20 py-8 text-center">
              <ImageIcon className="mx-auto h-8 w-8 text-sepia/30" strokeWidth={1.5} />
              <p className="mt-2 font-ui text-xs font-medium text-ink">No media yet</p>
              <p className="mt-1 font-ui text-[10px] text-muted">
                Upload images to use in your gazette
              </p>
            </div>
          ) : (
            <ScrollArea className="h-64">
              <div className="grid grid-cols-2 gap-2">
                {images.map((image) => (
                  <DraggableItem
                    key={image.id}
                    id={`media-${image.id}`}
                    type="media"
                    data={{ imageId: image.id }}
                    className="group relative aspect-square overflow-hidden rounded-sm border border-sepia/20 bg-white hover:border-gold/40 hover:shadow-sm"
                  >
                    <img
                      src={api.images.getUrl(image.id)}
                      alt={image.originalFilename}
                      className="h-full w-full object-cover transition-transform group-hover:scale-105"
                    />
                    {/* Overlay on hover */}
                    <div className="absolute inset-0 bg-gradient-to-t from-ink/60 via-transparent to-transparent opacity-0 transition-opacity group-hover:opacity-100" />
                    <p className="absolute bottom-1 left-1 right-1 truncate font-ui text-[9px] font-medium text-white opacity-0 transition-opacity group-hover:opacity-100">
                      {image.originalFilename}
                    </p>
                  </DraggableItem>
                ))}
              </div>
            </ScrollArea>
          )}
        </AccordionContent>
      </AccordionItem>

      {/* Templates Section */}
      <AccordionItem value="templates" className="border-b-0">
        <AccordionTrigger className="px-2 py-3 font-headline text-sm font-semibold text-ink hover:bg-parchment/30 hover:no-underline">
          <div className="flex items-center gap-2">
            <LayoutTemplate className="h-4 w-4 text-gold" />
            <span>Templates</span>
            <Badge
              variant="outline"
              className="ml-auto border-sepia/30 bg-cream/50 text-[10px] font-ui text-sepia"
            >
              {templates.length}
            </Badge>
          </div>
        </AccordionTrigger>
        <AccordionContent className="px-2 pb-3 pt-2">
          <div className="grid grid-cols-2 gap-2">
            {templates.map((template) => (
              <DraggableItem
                key={template.id}
                id={`template-${template.id}`}
                type="template"
                data={{ templateId: template.id }}
                className="group relative aspect-[8.5/11] overflow-hidden rounded-sm border border-sepia/20 bg-gradient-to-br from-white to-cream/40 hover:border-gold/40 hover:shadow-sm"
              >
                {/* Template preview background */}
                <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_50%,rgba(201,162,39,0.05)_0%,transparent_70%)]" />

                {/* Template icon/preview */}
                <div className="absolute inset-0 flex items-center justify-center">
                  <LayoutTemplate className="h-10 w-10 text-sepia/15" strokeWidth={1.5} />
                </div>

                {/* Template name overlay */}
                <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-ink/80 via-ink/40 to-transparent p-2">
                  <p className="font-ui text-[10px] font-semibold text-white">
                    {template.name}
                  </p>
                  {template.description && (
                    <p className="font-ui text-[9px] text-cream/80">
                      {template.description}
                    </p>
                  )}
                </div>

                {/* Corner accent */}
                <div className="pointer-events-none absolute right-1 top-1 h-4 w-4 border-r-2 border-t-2 border-gold/40 opacity-0 transition-opacity group-hover:opacity-100" />
              </DraggableItem>
            ))}
          </div>

          {/* Helper text */}
          <p className="mt-3 border-t border-sepia/10 pt-2 font-ui text-[10px] italic text-muted">
            Choose a template to start a new page
          </p>
        </AccordionContent>
      </AccordionItem>
    </Accordion>
  );
}
