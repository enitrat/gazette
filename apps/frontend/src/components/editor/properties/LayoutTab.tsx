import type { ElementWithStyle } from '@/stores/elements-store';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

interface LayoutTabProps {
  element: ElementWithStyle;
  onUpdate: (updates: Partial<ElementWithStyle>) => void;
}

export function LayoutTab({ element, onUpdate }: LayoutTabProps) {
  const { position } = element;

  const handlePositionChange = (key: keyof typeof position, value: number) => {
    onUpdate({
      ...element,
      position: {
        ...position,
        [key]: value,
      },
    });
  };

  const renderNumberInput = (
    label: string,
    value: number,
    onChange: (value: number) => void,
    min?: number
  ) => (
    <div className="space-y-1.5">
      <Label className="text-xs font-serif text-[#92764C] uppercase tracking-wider">
        {label}
      </Label>
      <Input
        type="number"
        value={Math.round(value)}
        onChange={(e) => {
          const val = parseFloat(e.target.value);
          if (!isNaN(val)) onChange(val);
        }}
        min={min}
        className="h-9 font-mono text-sm border-[#92764C]/30 bg-[#F4F1E8]/50 text-[#3D3327] focus-visible:ring-[#D4AF37] hover:border-[#D4AF37] transition-all duration-200"
      />
    </div>
  );

  return (
    <div className="p-4 space-y-6">
      {/* Header */}
      <div className="text-center relative pb-3">
        <h4 className="text-sm font-serif text-[#3D3327] tracking-wide">
          Position & Measure
        </h4>
        <div className="absolute bottom-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-[#D4AF37] to-transparent" />
      </div>

      {/* Position Section */}
      <div className="space-y-3">
        <div className="flex items-center gap-2">
          <div className="h-px flex-1 bg-gradient-to-r from-transparent to-[#92764C]/30" />
          <span className="text-xs font-serif text-[#92764C] uppercase tracking-wider">
            Coordinates
          </span>
          <div className="h-px flex-1 bg-gradient-to-l from-transparent to-[#92764C]/30" />
        </div>

        <div className="grid grid-cols-2 gap-3">
          {renderNumberInput('X Position', position.x, (value) =>
            handlePositionChange('x', value)
          )}
          {renderNumberInput('Y Position', position.y, (value) =>
            handlePositionChange('y', value)
          )}
        </div>
      </div>

      {/* Ornamental Divider */}
      <div className="relative h-px bg-gradient-to-r from-transparent via-[#92764C]/30 to-transparent">
        <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-2 h-2 rotate-45 bg-[#F4F1E8] border border-[#92764C]/30" />
      </div>

      {/* Dimensions Section */}
      <div className="space-y-3">
        <div className="flex items-center gap-2">
          <div className="h-px flex-1 bg-gradient-to-r from-transparent to-[#92764C]/30" />
          <span className="text-xs font-serif text-[#92764C] uppercase tracking-wider">
            Dimensions
          </span>
          <div className="h-px flex-1 bg-gradient-to-l from-transparent to-[#92764C]/30" />
        </div>

        <div className="grid grid-cols-2 gap-3">
          {renderNumberInput('Width', position.width, (value) =>
            handlePositionChange('width', value), 1
          )}
          {renderNumberInput('Height', position.height, (value) =>
            handlePositionChange('height', value), 1
          )}
        </div>
      </div>

      {/* Ornamental Divider */}
      <div className="relative h-px bg-gradient-to-r from-transparent via-[#92764C]/30 to-transparent">
        <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-2 h-2 rotate-45 bg-[#F4F1E8] border border-[#92764C]/30" />
      </div>

      {/* Info Box */}
      <div className="p-3 rounded border border-[#92764C]/20 bg-[#F4F1E8]/30">
        <div className="space-y-2 text-xs font-mono text-[#3D3327]">
          <div className="flex justify-between">
            <span className="text-[#92764C]">Aspect Ratio:</span>
            <span>{(position.width / position.height).toFixed(2)}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-[#92764C]">Area:</span>
            <span>{Math.round(position.width * position.height)} px²</span>
          </div>
        </div>
      </div>

      {/* Compositor's Note */}
      <div className="pt-2">
        <p className="text-xs text-[#92764C]/70 text-center italic font-serif leading-relaxed">
          All measurements in points. Drag elements on canvas for visual adjustment.
        </p>
      </div>
    </div>
  );
}
