import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { cn } from "@/lib/utils";

const normalizeHex = (value: string) => {
  if (!value) return "";
  if (value.startsWith("#")) return value;
  return `#${value}`;
};

type ColorPickerProps = {
  label?: string;
  value: string;
  onChange: (value: string) => void;
};

export function ColorPicker({ label = "Color", value, onChange }: ColorPickerProps) {
  const [draft, setDraft] = useState(value);

  useEffect(() => {
    setDraft(value);
  }, [value]);

  return (
    <div className="space-y-2">
      <Label className="font-ui text-xs text-muted">{label}</Label>
      <Popover>
        <PopoverTrigger asChild>
          <Button variant="outline" className="h-9 w-full justify-start gap-2">
            <span
              className="h-5 w-5 rounded border border-sepia/30"
              style={{ backgroundColor: value }}
            />
            <span className="font-ui text-xs text-ink">{value.toUpperCase()}</span>
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-56 space-y-3" align="start">
          <div className="flex items-center gap-2">
            <input
              aria-label="Pick color"
              type="color"
              value={value}
              onChange={(event) => {
                onChange(event.target.value);
                setDraft(event.target.value);
              }}
              className="h-10 w-10 cursor-pointer rounded border border-sepia/30 p-0"
            />
            <Input
              value={draft}
              onChange={(event) => setDraft(event.target.value)}
              onBlur={() => {
                const normalized = normalizeHex(draft.trim());
                if (normalized) {
                  onChange(normalized);
                  setDraft(normalized);
                }
              }}
              className={cn("input-vintage h-9 font-ui text-xs", "uppercase")}
            />
          </div>
          <p className="text-[11px] font-ui text-muted">Choose a color or enter a hex value.</p>
        </PopoverContent>
      </Popover>
    </div>
  );
}
