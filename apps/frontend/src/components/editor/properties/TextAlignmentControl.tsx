import { AlignCenter, AlignJustify, AlignLeft, AlignRight } from "lucide-react";
import { Label } from "@/components/ui/label";
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";

export type TextAlignment = "left" | "center" | "right" | "justify";

type TextAlignmentControlProps = {
  value: TextAlignment;
  onChange: (value: TextAlignment) => void;
};

export function TextAlignmentControl({ value, onChange }: TextAlignmentControlProps) {
  return (
    <div className="space-y-2">
      <Label className="font-ui text-xs text-muted">Text Alignment</Label>
      <ToggleGroup
        type="single"
        value={value}
        onValueChange={(next) => {
          if (!next) return;
          onChange(next as TextAlignment);
        }}
        className="grid grid-cols-4 gap-1 rounded-sm border border-sepia/20 bg-cream/70 p-1"
      >
        <ToggleGroupItem value="left" aria-label="Align left" className="h-8">
          <AlignLeft className="h-4 w-4" />
        </ToggleGroupItem>
        <ToggleGroupItem value="center" aria-label="Align center" className="h-8">
          <AlignCenter className="h-4 w-4" />
        </ToggleGroupItem>
        <ToggleGroupItem value="right" aria-label="Align right" className="h-8">
          <AlignRight className="h-4 w-4" />
        </ToggleGroupItem>
        <ToggleGroupItem value="justify" aria-label="Justify" className="h-8">
          <AlignJustify className="h-4 w-4" />
        </ToggleGroupItem>
      </ToggleGroup>
    </div>
  );
}
