import { useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { useUIStore } from '@/stores/ui-store';
import { useAuthStore } from '@/stores/auth-store';
import { usePagesStore } from '@/stores/pages-store';
import { useToast } from '@/components/ui/use-toast';
import { Layout, Columns2, Grid3x3, Newspaper } from 'lucide-react';

interface Template {
  id: string;
  name: string;
  description: string;
  icon: React.ReactNode;
  preview: React.ReactNode;
}

const TEMPLATES: Template[] = [
  {
    id: 'full-page',
    name: 'Full Page Layout',
    description: 'Single column, ideal for feature articles',
    icon: <Layout className="w-6 h-6" />,
    preview: (
      <div className="w-full h-32 border-2 border-[#2c2416]/30 rounded-sm p-2">
        <div className="w-full h-full bg-[#2c2416]/10 rounded-sm" />
      </div>
    ),
  },
  {
    id: 'two-columns',
    name: 'Two Column Layout',
    description: 'Classic newspaper format',
    icon: <Columns2 className="w-6 h-6" />,
    preview: (
      <div className="w-full h-32 border-2 border-[#2c2416]/30 rounded-sm p-2 flex gap-2">
        <div className="flex-1 h-full bg-[#2c2416]/10 rounded-sm" />
        <div className="flex-1 h-full bg-[#2c2416]/10 rounded-sm" />
      </div>
    ),
  },
  {
    id: 'three-grid',
    name: 'Three Grid Layout',
    description: 'Modern editorial grid',
    icon: <Grid3x3 className="w-6 h-6" />,
    preview: (
      <div className="w-full h-32 border-2 border-[#2c2416]/30 rounded-sm p-2">
        <div className="grid grid-cols-3 gap-2 h-full">
          <div className="bg-[#2c2416]/10 rounded-sm" />
          <div className="bg-[#2c2416]/10 rounded-sm" />
          <div className="bg-[#2c2416]/10 rounded-sm" />
        </div>
      </div>
    ),
  },
  {
    id: 'masthead',
    name: 'Masthead Layout',
    description: 'Front page with prominent header',
    icon: <Newspaper className="w-6 h-6" />,
    preview: (
      <div className="w-full h-32 border-2 border-[#2c2416]/30 rounded-sm p-2 space-y-2">
        <div className="w-full h-6 bg-[#2c2416]/20 rounded-sm" />
        <div className="flex gap-2 flex-1">
          <div className="flex-1 bg-[#2c2416]/10 rounded-sm" />
          <div className="flex-1 bg-[#2c2416]/10 rounded-sm" />
        </div>
      </div>
    ),
  },
];

export function TemplateDialog() {
  const { activeDialog, closeDialog } = useUIStore();
  const { currentProject } = useAuthStore();
  const { createPage } = usePagesStore();
  const { toast } = useToast();
  const [selectedTemplate, setSelectedTemplate] = useState<string | null>(null);
  const [creating, setCreating] = useState(false);

  const handleCreatePage = async () => {
    if (!selectedTemplate || !currentProject) return;

    try {
      setCreating(true);
      await createPage(currentProject.id, selectedTemplate);
      closeDialog();
      toast({
        title: 'Page created',
        description: 'Your new page has been added to the project',
      });
    } catch (err) {
      console.error('Failed to create page:', err);
      toast({
        title: 'Failed to create page',
        description: err instanceof Error ? err.message : 'An error occurred',
        variant: 'destructive',
      });
    } finally {
      setCreating(false);
    }
  };

  return (
    <Dialog
      open={activeDialog === 'template'}
      onOpenChange={(open) => {
        if (!open) {
          setSelectedTemplate(null);
          closeDialog();
        }
      }}
    >
      <DialogContent className="sm:max-w-[700px] bg-[#f4f1e8] border-4 border-[#2c2416] shadow-2xl">
        {/* Ornamental corner decorations */}
        <div className="absolute top-0 left-0 w-10 h-10">
          <div className="absolute top-0 left-0 w-full h-0.5 bg-[#d4af37]" />
          <div className="absolute top-0 left-0 w-0.5 h-full bg-[#d4af37]" />
          <div className="absolute top-2 left-2 w-6 h-6 border-t-2 border-l-2 border-[#2c2416]/30" />
        </div>
        <div className="absolute top-0 right-0 w-10 h-10">
          <div className="absolute top-0 right-0 w-full h-0.5 bg-[#d4af37]" />
          <div className="absolute top-0 right-0 w-0.5 h-full bg-[#d4af37]" />
          <div className="absolute top-2 right-2 w-6 h-6 border-t-2 border-r-2 border-[#2c2416]/30" />
        </div>
        <div className="absolute bottom-0 left-0 w-10 h-10">
          <div className="absolute bottom-0 left-0 w-full h-0.5 bg-[#d4af37]" />
          <div className="absolute bottom-0 left-0 w-0.5 h-full bg-[#d4af37]" />
          <div className="absolute bottom-2 left-2 w-6 h-6 border-b-2 border-l-2 border-[#2c2416]/30" />
        </div>
        <div className="absolute bottom-0 right-0 w-10 h-10">
          <div className="absolute bottom-0 right-0 w-full h-0.5 bg-[#d4af37]" />
          <div className="absolute bottom-0 right-0 w-0.5 h-full bg-[#d4af37]" />
          <div className="absolute bottom-2 right-2 w-6 h-6 border-b-2 border-r-2 border-[#2c2416]/30" />
        </div>

        <DialogHeader className="space-y-4 pt-2">
          <DialogTitle className="text-3xl font-serif text-center text-[#2c2416] tracking-wide border-b-2 border-[#2c2416] pb-3">
            <span className="inline-block relative">
              <Newspaper className="inline-block w-7 h-7 mr-2 mb-1" />
              SELECT EDITORIAL TEMPLATE
              <div className="absolute -bottom-1 left-0 right-0 h-px bg-[#d4af37]" />
            </span>
          </DialogTitle>
          <DialogDescription className="text-center text-[#2c2416]/70 text-sm italic font-serif">
            Choose a layout for your new publication page
          </DialogDescription>
        </DialogHeader>

        <div className="grid grid-cols-2 gap-4 py-6">
          {TEMPLATES.map((template) => (
            <button
              key={template.id}
              onClick={() => setSelectedTemplate(template.id)}
              className={`
                group relative p-5 rounded-sm border-3 transition-all duration-300
                ${
                  selectedTemplate === template.id
                    ? 'border-[#d4af37] bg-[#d4af37]/10 shadow-lg scale-[1.02]'
                    : 'border-[#2c2416]/30 hover:border-[#8b4513] hover:bg-[#2c2416]/5 hover:scale-[1.01]'
                }
              `}
              style={{
                backgroundImage:
                  selectedTemplate === template.id
                    ? 'none'
                    : 'repeating-linear-gradient(45deg, transparent, transparent 8px, #2c2416 8px, #2c2416 9px)',
                backgroundSize: '100% 100%, 15px 15px',
                backgroundBlendMode: 'multiply',
              } as React.CSSProperties}
            >
              {/* Selection indicator */}
              {selectedTemplate === template.id && (
                <div className="absolute -top-2 -right-2 w-6 h-6 bg-[#d4af37] rounded-full border-2 border-[#2c2416] flex items-center justify-center animate-in zoom-in-50">
                  <div className="w-2 h-2 bg-[#2c2416] rounded-full" />
                </div>
              )}

              <div className="space-y-3">
                {/* Icon and title */}
                <div className="flex items-center gap-2 text-left">
                  <div
                    className={`
                    p-2 rounded-sm border transition-all duration-300
                    ${
                      selectedTemplate === template.id
                        ? 'border-[#d4af37] bg-[#d4af37]/20 text-[#2c2416]'
                        : 'border-[#2c2416]/20 bg-[#2c2416]/5 text-[#2c2416]/70 group-hover:border-[#d4af37] group-hover:bg-[#d4af37]/10'
                    }
                  `}
                  >
                    {template.icon}
                  </div>
                  <div className="flex-1">
                    <h3
                      className={`
                      text-sm font-serif font-semibold tracking-wide
                      ${selectedTemplate === template.id ? 'text-[#2c2416]' : 'text-[#2c2416]/80'}
                    `}
                    >
                      {template.name}
                    </h3>
                    <p className="text-xs text-[#2c2416]/60 font-serif italic">
                      {template.description}
                    </p>
                  </div>
                </div>

                {/* Preview */}
                <div className="transition-all duration-300 group-hover:shadow-md">
                  {template.preview}
                </div>
              </div>
            </button>
          ))}
        </div>

        {/* Footer */}
        <div className="border-t-2 border-[#2c2416]/20 pt-4 flex gap-3">
          <Button
            onClick={() => {
              setSelectedTemplate(null);
              closeDialog();
            }}
            disabled={creating}
            variant="outline"
            className="flex-1 border-2 border-[#2c2416]/30 text-[#2c2416] hover:bg-[#2c2416]/5 font-serif tracking-wide"
          >
            CANCEL
          </Button>
          <Button
            onClick={handleCreatePage}
            disabled={!selectedTemplate || creating}
            className="flex-1 bg-[#2c2416] hover:bg-[#8b4513] text-[#f4f1e8] font-serif tracking-wider transition-all duration-300 shadow-md hover:shadow-lg border-2 border-[#2c2416] hover:border-[#d4af37] disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {creating ? 'CREATING PAGE...' : 'CREATE PAGE'}
          </Button>
        </div>

        {/* Decorative stamp */}
        <div className="absolute -bottom-3 -right-3 opacity-20 pointer-events-none">
          <div className="w-20 h-20 border-4 border-[#8b4513] rounded-full flex items-center justify-center rotate-12">
            <span className="text-[#8b4513] font-serif text-xs font-bold">TEMPLATE</span>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
