import { Bold, Italic, Strikethrough, Underline } from "lucide-react";
import { Label } from "@/components/ui/label";
import { Toggle } from "@/components/ui/toggle";

export type TextStyleState = {
  bold: boolean;
  italic: boolean;
  underline: boolean;
  strikethrough: boolean;
};

type TextStyleTogglesProps = {
  value: TextStyleState;
  onChange: (value: TextStyleState) => void;
};

export function TextStyleToggles({ value, onChange }: TextStyleTogglesProps) {
  return (
    <div className="space-y-2">
      <Label className="font-ui text-xs text-muted">Text Styling</Label>
      <div className="grid grid-cols-4 gap-1 rounded-sm border border-sepia/20 bg-cream/70 p-1">
        <Toggle
          pressed={value.bold}
          onPressedChange={(pressed) => onChange({ ...value, bold: pressed })}
          aria-label="Toggle bold"
          className="h-8"
        >
          <Bold className="h-4 w-4" />
        </Toggle>
        <Toggle
          pressed={value.italic}
          onPressedChange={(pressed) => onChange({ ...value, italic: pressed })}
          aria-label="Toggle italic"
          className="h-8"
        >
          <Italic className="h-4 w-4" />
        </Toggle>
        <Toggle
          pressed={value.underline}
          onPressedChange={(pressed) => onChange({ ...value, underline: pressed })}
          aria-label="Toggle underline"
          className="h-8"
        >
          <Underline className="h-4 w-4" />
        </Toggle>
        <Toggle
          pressed={value.strikethrough}
          onPressedChange={(pressed) => onChange({ ...value, strikethrough: pressed })}
          aria-label="Toggle strikethrough"
          className="h-8"
        >
          <Strikethrough className="h-4 w-4" />
        </Toggle>
      </div>
    </div>
  );
}
