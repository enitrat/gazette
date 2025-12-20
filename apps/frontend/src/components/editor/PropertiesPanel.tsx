import { useElementsStore } from '@/stores/elements-store';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { StyleTab } from './properties/StyleTab';
import { LayoutTab } from './properties/LayoutTab';
import { ScrollArea } from '@/components/ui/scroll-area';
import { FileImage, Type } from 'lucide-react';

interface PropertiesPanelProps {
  onLayerChange?: (elementId: string, direction: 'front' | 'forward' | 'backward' | 'back') => void;
  onGenerateVideo?: (elementId: string) => void;
}

export function PropertiesPanel(_props: PropertiesPanelProps) {
  const getSelectedElement = useElementsStore((state) => state.getSelectedElement);
  const updateElementLocal = useElementsStore((state) => state.updateElementLocal);
  const selectedElement = getSelectedElement();

  const handleUpdate = (updates: any) => {
    if (selectedElement) {
      updateElementLocal(selectedElement.id, updates);
    }
  };

  if (!selectedElement) {
    return (
      <div className="w-full h-full border-l-2 border-[#92764C]/20 bg-gradient-to-br from-[#F4F1E8] via-[#F4F1E8]/95 to-[#F4F1E8]/90 flex flex-col">
        {/* Header with Ornamental Border */}
        <div className="p-4 border-b-2 border-[#92764C]/20 bg-[#F4F1E8]">
          <div className="relative pb-3">
            <h2 className="text-lg font-serif text-[#3D3327] tracking-wide text-center">
              Properties
            </h2>
            <div className="absolute bottom-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-[#D4AF37] to-transparent" />
          </div>
        </div>

        {/* Empty State */}
        <div className="flex-1 flex items-center justify-center p-8">
          <div className="text-center space-y-4">
            {/* Decorative Frame */}
            <div className="relative inline-block">
              <div className="absolute inset-0 border-2 border-[#92764C]/20 rounded-lg transform rotate-2" />
              <div className="relative bg-[#F4F1E8] border-2 border-[#92764C]/30 rounded-lg p-6">
                <div className="w-16 h-16 mx-auto rounded-full bg-gradient-to-br from-[#D4AF37]/20 to-[#92764C]/10 flex items-center justify-center">
                  <div className="w-12 h-12 rounded-full bg-[#F4F1E8] border border-[#92764C]/30 flex items-center justify-center">
                    <Type className="w-6 h-6 text-[#92764C]" />
                  </div>
                </div>
              </div>
            </div>

            {/* Message */}
            <div className="space-y-2 max-w-[240px]">
              <p className="text-sm font-serif text-[#3D3327] leading-relaxed">
                No Element Selected
              </p>
              <p className="text-xs text-[#92764C]/70 font-serif italic leading-relaxed">
                Select an element from the canvas to view and modify its properties
              </p>
            </div>

            {/* Ornamental Divider */}
            <div className="relative h-px bg-gradient-to-r from-transparent via-[#92764C]/30 to-transparent max-w-[200px] mx-auto">
              <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-2 h-2 rotate-45 bg-[#F4F1E8] border border-[#92764C]/30" />
            </div>
          </div>
        </div>
      </div>
    );
  }

  const isImage = selectedElement.type === 'image';
  const elementTypeLabel = isImage ? 'Photographic Plate' : 'Text Element';
  const ElementIcon = isImage ? FileImage : Type;

  return (
    <div className="w-full h-full border-l-2 border-[#92764C]/20 bg-gradient-to-br from-[#F4F1E8] via-[#F4F1E8]/95 to-[#F4F1E8]/90 flex flex-col">
      {/* Header with Element Info */}
      <div className="p-4 border-b-2 border-[#92764C]/20 bg-[#F4F1E8] space-y-3">
        <div className="relative pb-3">
          <h2 className="text-lg font-serif text-[#3D3327] tracking-wide text-center">
            Properties
          </h2>
          <div className="absolute bottom-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-[#D4AF37] to-transparent" />
        </div>

        {/* Element Type Badge */}
        <div className="flex items-center justify-center gap-2 p-2 rounded border border-[#92764C]/20 bg-[#F4F1E8]/50">
          <ElementIcon className="w-4 h-4 text-[#D4AF37]" />
          <span className="text-xs font-serif text-[#3D3327] uppercase tracking-wider">
            {elementTypeLabel}
          </span>
        </div>
      </div>

      {/* Tabs */}
      <Tabs defaultValue="style" className="flex-1 flex flex-col">
        <TabsList className="w-full grid grid-cols-2 gap-1 p-1 bg-[#F4F1E8] border-b-2 border-[#92764C]/20 rounded-none h-auto">
          <TabsTrigger
            value="style"
            className="data-[state=active]:bg-[#D4AF37] data-[state=active]:text-white data-[state=active]:shadow-md text-[#92764C] font-serif text-xs uppercase tracking-wider py-2.5 rounded-sm transition-all duration-200 hover:bg-[#D4AF37]/10"
          >
            Style
          </TabsTrigger>
          <TabsTrigger
            value="layout"
            className="data-[state=active]:bg-[#D4AF37] data-[state=active]:text-white data-[state=active]:shadow-md text-[#92764C] font-serif text-xs uppercase tracking-wider py-2.5 rounded-sm transition-all duration-200 hover:bg-[#D4AF37]/10"
          >
            Layout
          </TabsTrigger>
        </TabsList>

        <ScrollArea className="flex-1">
          <TabsContent value="style" className="m-0">
            <StyleTab element={selectedElement} onUpdate={handleUpdate} />
          </TabsContent>

          <TabsContent value="layout" className="m-0">
            <LayoutTab element={selectedElement} onUpdate={handleUpdate} />
          </TabsContent>
        </ScrollArea>
      </Tabs>

      {/* Footer with Ornamental Detail */}
      <div className="p-3 border-t border-[#92764C]/10 bg-[#F4F1E8]/80">
        <div className="relative h-px bg-gradient-to-r from-transparent via-[#D4AF37]/50 to-transparent">
          <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 flex gap-1">
            <div className="w-1 h-1 rounded-full bg-[#D4AF37]" />
            <div className="w-1 h-1 rounded-full bg-[#D4AF37]" />
            <div className="w-1 h-1 rounded-full bg-[#D4AF37]" />
          </div>
        </div>
      </div>
    </div>
  );
}
