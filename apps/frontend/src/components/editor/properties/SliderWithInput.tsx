import { useMemo } from "react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Slider } from "@/components/ui/slider";

const clamp = (value: number, min: number, max: number) => Math.min(Math.max(value, min), max);

type SliderWithInputProps = {
  label: string;
  value: number;
  onChange: (value: number) => void;
  min: number;
  max: number;
  step?: number;
  displayScale?: number;
};

export function SliderWithInput({
  label,
  value,
  onChange,
  min,
  max,
  step = 1,
  displayScale = 1,
}: SliderWithInputProps) {
  const displayValue = useMemo(() => value * displayScale, [value, displayScale]);

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between gap-2">
        <Label className="font-ui text-xs text-muted">{label}</Label>
        <Input
          type="number"
          value={Number.isFinite(displayValue) ? displayValue : 0}
          onChange={(event) => {
            const raw = Number(event.target.value);
            if (!Number.isFinite(raw)) return;
            const nextValue = clamp(raw / displayScale, min, max);
            onChange(nextValue);
          }}
          min={min * displayScale}
          max={max * displayScale}
          step={step * displayScale}
          className="input-vintage h-8 w-16 text-right font-ui text-xs"
        />
      </div>
      <Slider
        value={[value]}
        onValueChange={([nextValue]) => onChange(nextValue)}
        min={min}
        max={max}
        step={step}
        className="w-full"
      />
    </div>
  );
}
