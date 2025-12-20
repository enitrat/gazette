import { useElementsStore, type ElementWithStyle } from '@/stores/elements-store';
import { SliderWithInput } from './SliderWithInput';
import { ColorPicker } from './ColorPicker';
import { ToggleGroup, ToggleGroupItem } from '@/components/ui/toggle-group';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import {
  AlignLeft,
  AlignCenter,
  AlignRight,
  AlignJustify,
  Bold,
  Italic,
  Underline,
  Strikethrough
} from 'lucide-react';

interface StyleTabProps {
  element: ElementWithStyle;
  onUpdate: (updates: Partial<ElementWithStyle>) => void;
}

const FONT_FAMILIES = [
  { name: 'Playfair Display', value: 'Playfair Display' },
  { name: 'Old Standard TT', value: 'Old Standard TT' },
  { name: 'Libre Baskerville', value: 'Libre Baskerville' },
  { name: 'EB Garamond', value: 'EB Garamond' },
  { name: 'Inter', value: 'Inter' },
];

export function StyleTab({ element }: StyleTabProps) {
  const updateElementStyle = useElementsStore((state) => state.updateElementStyle);

  if (element.type === 'image') {
    return (
      <div className="p-4 space-y-4">
        {/* Image Information */}
        <div className="space-y-3">
          <div className="text-center relative pb-3">
            <h4 className="text-sm font-serif text-[#3D3327] tracking-wide">
              Photographic Plate
            </h4>
            <div className="absolute bottom-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-[#D4AF37] to-transparent" />
          </div>

          <div className="space-y-2 p-3 rounded border border-[#92764C]/20 bg-[#F4F1E8]/30">
            <div className="flex justify-between items-center">
              <span className="text-xs font-serif text-[#92764C] uppercase tracking-wider">
                Dimensions
              </span>
              <span className="text-xs font-mono text-[#3D3327]">
                {Math.round(element.position.width)} × {Math.round(element.position.height)}px
              </span>
            </div>

            {element.imageId && (
              <div className="flex justify-between items-center pt-2 border-t border-[#92764C]/10">
                <span className="text-xs font-serif text-[#92764C] uppercase tracking-wider">
                  Plate ID
                </span>
                <span className="text-xs font-mono text-[#3D3327] truncate max-w-[140px]">
                  {element.imageId.slice(0, 8)}...
                </span>
              </div>
            )}
          </div>

          <p className="text-xs text-[#92764C]/70 text-center italic font-serif leading-relaxed">
            Image styling options will be available in a future update.
          </p>
        </div>
      </div>
    );
  }

  // Get default styles based on element type
  const getDefaultStyle = () => {
    switch (element.type) {
      case 'headline':
        return {
          fontFamily: 'Playfair Display',
          fontSize: 32,
          fontWeight: 'bold' as const,
          lineHeight: 1.2,
          letterSpacing: -0.02,
          color: '#2c1810',
          textAlign: 'left' as const,
          fontStyle: 'normal' as const,
          textDecoration: 'none',
        };
      case 'subheading':
        return {
          fontFamily: 'Playfair Display',
          fontSize: 20,
          fontWeight: 'bold' as const,
          lineHeight: 1.3,
          letterSpacing: -0.01,
          color: '#2c1810',
          textAlign: 'left' as const,
          fontStyle: 'normal' as const,
          textDecoration: 'none',
        };
      case 'caption':
        return {
          fontFamily: 'Crimson Text',
          fontSize: 14,
          fontWeight: 'normal' as const,
          lineHeight: 1.5,
          letterSpacing: 0,
          fontStyle: 'italic' as const,
          color: '#4a3628',
          textAlign: 'left' as const,
          textDecoration: 'none',
        };
    }
  };

  // Text element styling - merge default with custom styles
  const defaultStyle = getDefaultStyle();
  const style = { ...defaultStyle, ...element.style };

  const fontFamily = style.fontFamily;
  const fontSize = style.fontSize;
  const lineHeight = style.lineHeight;
  const letterSpacing = style.letterSpacing;
  const color = style.color;
  const textAlign = style.textAlign;
  const fontWeight = style.fontWeight === 'bold' || style.fontWeight === '700' ? 'bold' : 'normal';
  const fontStyle = style.fontStyle;
  const textDecoration = style.textDecoration;

  const handleStyleUpdate = (updates: any) => {
    updateElementStyle(element.id, updates);
  };

  return (
    <div className="p-4 space-y-6">
      {/* Header */}
      <div className="text-center relative pb-3">
        <h4 className="text-sm font-serif text-[#3D3327] tracking-wide">
          Typography & Ornament
        </h4>
        <div className="absolute bottom-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-[#D4AF37] to-transparent" />
      </div>

      {/* Font Family */}
      <div className="space-y-2">
        <Label className="text-xs font-serif text-[#92764C] uppercase tracking-wider">
          Typeface
        </Label>
        <Select value={fontFamily} onValueChange={(value) => handleStyleUpdate({ fontFamily: value })}>
          <SelectTrigger className="border-[#92764C]/30 bg-[#F4F1E8]/50 text-[#3D3327] hover:border-[#D4AF37] transition-all duration-200">
            <SelectValue />
          </SelectTrigger>
          <SelectContent className="border-2 border-[#92764C]/30 bg-[#F4F1E8]">
            {FONT_FAMILIES.map((font) => (
              <SelectItem
                key={font.value}
                value={font.value}
                className="font-serif hover:bg-[#D4AF37]/10"
              >
                <span style={{ fontFamily: font.value }}>{font.name}</span>
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Ornamental Divider */}
      <div className="relative h-px bg-gradient-to-r from-transparent via-[#92764C]/30 to-transparent">
        <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-2 h-2 rotate-45 bg-[#F4F1E8] border border-[#92764C]/30" />
      </div>

      {/* Font Size */}
      <SliderWithInput
        label="Size"
        value={fontSize}
        min={8}
        max={72}
        step={1}
        unit="pt"
        onChange={(value) => handleStyleUpdate({ fontSize: value })}
      />

      {/* Line Height */}
      <SliderWithInput
        label="Leading"
        value={lineHeight}
        min={1.0}
        max={3.0}
        step={0.1}
        onChange={(value) => handleStyleUpdate({ lineHeight: value })}
      />

      {/* Letter Spacing */}
      <SliderWithInput
        label="Tracking"
        value={letterSpacing}
        min={-2}
        max={10}
        step={0.1}
        unit="pt"
        onChange={(value) => handleStyleUpdate({ letterSpacing: value })}
      />

      {/* Ornamental Divider */}
      <div className="relative h-px bg-gradient-to-r from-transparent via-[#92764C]/30 to-transparent">
        <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-2 h-2 rotate-45 bg-[#F4F1E8] border border-[#92764C]/30" />
      </div>

      {/* Color */}
      <ColorPicker
        label="Ink Color"
        value={color}
        onChange={(value) => handleStyleUpdate({ color: value })}
      />

      {/* Text Alignment */}
      <div className="space-y-2">
        <Label className="text-xs font-serif text-[#92764C] uppercase tracking-wider">
          Alignment
        </Label>
        <ToggleGroup
          type="single"
          value={textAlign}
          onValueChange={(value) => value && handleStyleUpdate({ textAlign: value })}
          className="grid grid-cols-4 gap-1 p-1 border border-[#92764C]/30 rounded-md bg-[#F4F1E8]/30"
        >
          <ToggleGroupItem
            value="left"
            aria-label="Align left"
            className="data-[state=on]:bg-[#D4AF37] data-[state=on]:text-white hover:bg-[#D4AF37]/20"
          >
            <AlignLeft className="h-4 w-4" />
          </ToggleGroupItem>
          <ToggleGroupItem
            value="center"
            aria-label="Align center"
            className="data-[state=on]:bg-[#D4AF37] data-[state=on]:text-white hover:bg-[#D4AF37]/20"
          >
            <AlignCenter className="h-4 w-4" />
          </ToggleGroupItem>
          <ToggleGroupItem
            value="right"
            aria-label="Align right"
            className="data-[state=on]:bg-[#D4AF37] data-[state=on]:text-white hover:bg-[#D4AF37]/20"
          >
            <AlignRight className="h-4 w-4" />
          </ToggleGroupItem>
          <ToggleGroupItem
            value="justify"
            aria-label="Justify"
            className="data-[state=on]:bg-[#D4AF37] data-[state=on]:text-white hover:bg-[#D4AF37]/20"
          >
            <AlignJustify className="h-4 w-4" />
          </ToggleGroupItem>
        </ToggleGroup>
      </div>

      {/* Text Style Toggles */}
      <div className="space-y-2">
        <Label className="text-xs font-serif text-[#92764C] uppercase tracking-wider">
          Ornamentation
        </Label>
        <ToggleGroup
          type="multiple"
          value={[
            fontWeight === 'bold' ? 'bold' : '',
            fontStyle === 'italic' ? 'italic' : '',
            textDecoration.includes('underline') ? 'underline' : '',
            textDecoration.includes('line-through') ? 'strikethrough' : '',
          ].filter(Boolean)}
          onValueChange={(values) => {
            handleStyleUpdate({
              fontWeight: values.includes('bold') ? 'bold' : 'normal',
              fontStyle: values.includes('italic') ? 'italic' : 'normal',
              textDecoration: [
                values.includes('underline') ? 'underline' : '',
                values.includes('strikethrough') ? 'line-through' : '',
              ].filter(Boolean).join(' ') || 'none',
            });
          }}
          className="grid grid-cols-4 gap-1 p-1 border border-[#92764C]/30 rounded-md bg-[#F4F1E8]/30"
        >
          <ToggleGroupItem
            value="bold"
            aria-label="Bold"
            className="data-[state=on]:bg-[#D4AF37] data-[state=on]:text-white hover:bg-[#D4AF37]/20"
          >
            <Bold className="h-4 w-4" />
          </ToggleGroupItem>
          <ToggleGroupItem
            value="italic"
            aria-label="Italic"
            className="data-[state=on]:bg-[#D4AF37] data-[state=on]:text-white hover:bg-[#D4AF37]/20"
          >
            <Italic className="h-4 w-4" />
          </ToggleGroupItem>
          <ToggleGroupItem
            value="underline"
            aria-label="Underline"
            className="data-[state=on]:bg-[#D4AF37] data-[state=on]:text-white hover:bg-[#D4AF37]/20"
          >
            <Underline className="h-4 w-4" />
          </ToggleGroupItem>
          <ToggleGroupItem
            value="strikethrough"
            aria-label="Strikethrough"
            className="data-[state=on]:bg-[#D4AF37] data-[state=on]:text-white hover:bg-[#D4AF37]/20"
          >
            <Strikethrough className="h-4 w-4" />
          </ToggleGroupItem>
        </ToggleGroup>
      </div>
    </div>
  );
}
