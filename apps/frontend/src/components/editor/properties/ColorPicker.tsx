import { useState } from 'react';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

interface ColorPickerProps {
  value: string;
  onChange: (color: string) => void;
  label?: string;
}

const VINTAGE_PALETTE = [
  { name: 'Ink Black', value: '#1A1614' },
  { name: 'Sepia', value: '#92764C' },
  { name: 'Gold Leaf', value: '#D4AF37' },
  { name: 'Aged Paper', value: '#F4F1E8' },
  { name: 'Burgundy', value: '#7C2529' },
  { name: 'Forest Green', value: '#2D4A2B' },
  { name: 'Navy Ink', value: '#1B3A5F' },
  { name: 'Charcoal', value: '#3D3327' },
];

export function ColorPicker({ value, onChange, label = 'Color' }: ColorPickerProps) {
  const [customColor, setCustomColor] = useState(value);
  const [open, setOpen] = useState(false);

  const handlePresetClick = (color: string) => {
    onChange(color);
    setCustomColor(color);
    setOpen(false);
  };

  const handleCustomChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newColor = e.target.value;
    setCustomColor(newColor);
    if (/^#[0-9A-F]{6}$/i.test(newColor)) {
      onChange(newColor);
    }
  };

  return (
    <div className="space-y-2">
      <Label className="text-xs font-serif text-[#92764C] uppercase tracking-wider">
        {label}
      </Label>
      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger asChild>
          <Button
            variant="outline"
            className="w-full h-9 justify-start gap-2 border-[#92764C]/30 bg-[#F4F1E8]/50 hover:bg-[#F4F1E8] hover:border-[#D4AF37] transition-all duration-200"
          >
            <div
              className="w-5 h-5 rounded border-2 border-[#92764C]/30 shadow-inner"
              style={{ backgroundColor: value }}
            />
            <span className="text-xs font-mono text-[#3D3327]">{value}</span>
          </Button>
        </PopoverTrigger>
        <PopoverContent
          className="w-64 border-2 border-[#92764C]/30 bg-[#F4F1E8] shadow-lg"
          align="start"
        >
          <div className="space-y-4">
            {/* Ornamental Header */}
            <div className="text-center relative pb-2">
              <h4 className="text-sm font-serif text-[#3D3327] tracking-wide">
                Printing Inks
              </h4>
              <div className="absolute bottom-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-[#D4AF37] to-transparent" />
            </div>

            {/* Preset Colors */}
            <div className="space-y-2">
              <Label className="text-xs font-serif text-[#92764C] uppercase tracking-wider">
                Traditional Palette
              </Label>
              <div className="grid grid-cols-4 gap-2">
                {VINTAGE_PALETTE.map((color) => (
                  <button
                    key={color.value}
                    onClick={() => handlePresetClick(color.value)}
                    className="group relative aspect-square rounded border-2 transition-all duration-200 hover:scale-110 hover:shadow-md"
                    style={{
                      backgroundColor: color.value,
                      borderColor: value === color.value ? '#D4AF37' : '#92764C30',
                    }}
                    title={color.name}
                  >
                    {value === color.value && (
                      <div className="absolute inset-0 flex items-center justify-center">
                        <div className="w-1.5 h-1.5 rounded-full bg-white shadow-lg" />
                      </div>
                    )}
                  </button>
                ))}
              </div>
            </div>

            {/* Ornamental Divider */}
            <div className="relative h-px bg-gradient-to-r from-transparent via-[#92764C]/30 to-transparent">
              <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-2 h-2 rotate-45 bg-[#F4F1E8] border border-[#92764C]/30" />
            </div>

            {/* Custom Color */}
            <div className="space-y-2">
              <Label className="text-xs font-serif text-[#92764C] uppercase tracking-wider">
                Custom Formulation
              </Label>
              <Input
                type="text"
                value={customColor}
                onChange={handleCustomChange}
                placeholder="#000000"
                className="font-mono text-xs border-[#92764C]/30 bg-white/50 text-[#3D3327] focus-visible:ring-[#D4AF37]"
                maxLength={7}
              />
            </div>
          </div>
        </PopoverContent>
      </Popover>
    </div>
  );
}
