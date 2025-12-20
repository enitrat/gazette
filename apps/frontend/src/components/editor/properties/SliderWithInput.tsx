import { useState, useEffect } from 'react';
import { Slider } from '@/components/ui/slider';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

interface SliderWithInputProps {
  label: string;
  value: number;
  min: number;
  max: number;
  step?: number;
  unit?: string;
  onChange: (value: number) => void;
  className?: string;
}

export function SliderWithInput({
  label,
  value,
  min,
  max,
  step = 1,
  unit = '',
  onChange,
  className = '',
}: SliderWithInputProps) {
  const [localValue, setLocalValue] = useState(value);

  useEffect(() => {
    setLocalValue(value);
  }, [value]);

  const handleSliderChange = (values: number[]) => {
    const newValue = values[0];
    setLocalValue(newValue);
    onChange(newValue);
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newValue = parseFloat(e.target.value);
    if (!isNaN(newValue)) {
      const clampedValue = Math.max(min, Math.min(max, newValue));
      setLocalValue(clampedValue);
      onChange(clampedValue);
    }
  };

  const handleInputBlur = () => {
    // Ensure value is within bounds on blur
    const clampedValue = Math.max(min, Math.min(max, localValue));
    if (clampedValue !== localValue) {
      setLocalValue(clampedValue);
      onChange(clampedValue);
    }
  };

  return (
    <div className={`space-y-2 ${className}`}>
      <div className="flex items-center justify-between">
        <Label className="text-xs font-serif text-[#92764C] uppercase tracking-wider">
          {label}
        </Label>
        <div className="flex items-center gap-1">
          <Input
            type="number"
            value={localValue}
            onChange={handleInputChange}
            onBlur={handleInputBlur}
            min={min}
            max={max}
            step={step}
            className="h-7 w-16 text-xs font-mono border-[#92764C]/30 bg-[#F4F1E8]/50 text-[#3D3327] focus-visible:ring-[#D4AF37]"
          />
          {unit && (
            <span className="text-xs font-mono text-[#92764C]/70 w-5">{unit}</span>
          )}
        </div>
      </div>
      <Slider
        value={[localValue]}
        onValueChange={handleSliderChange}
        min={min}
        max={max}
        step={step}
        className="[&_.slider-track]:bg-[#92764C]/20 [&_.slider-range]:bg-[#D4AF37] [&_.slider-thumb]:border-[#D4AF37] [&_.slider-thumb]:bg-[#F4F1E8] hover:[&_.slider-thumb]:bg-[#D4AF37]/10"
      />
    </div>
  );
}
