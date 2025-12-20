import { useEffect, useRef, useState } from "react";
import { useElementsStore, type ElementWithStyle } from "@/stores/elements-store";
import {
  getMergedTextStyle,
  textStyleToInlineStyle,
  type TextElementTypeKey,
} from "@gazette/shared";

interface TextEditorProps {
  element: Extract<ElementWithStyle, { type: "headline" | "subheading" | "caption" }>;
  onBlur?: () => void;
}

export function TextEditor({ element, onBlur }: TextEditorProps) {
  const [content, setContent] = useState(element.content || "");
  const editableRef = useRef<HTMLDivElement>(null);
  const updateElement = useElementsStore((state) => state.updateElement);
  const stopEditing = useElementsStore((state) => state.stopEditing);

  // Auto-focus on mount
  useEffect(() => {
    if (editableRef.current) {
      editableRef.current.focus();

      // Move cursor to end
      const range = document.createRange();
      const selection = window.getSelection();
      range.selectNodeContents(editableRef.current);
      range.collapse(false);
      selection?.removeAllRanges();
      selection?.addRange(range);
    }
  }, []);

  const handleBlur = async () => {
    stopEditing();

    // Save if content changed
    if (content !== element.content) {
      try {
        await updateElement(element.id, {
          content,
        });
      } catch (error) {
        console.error("Failed to update element content:", error);
      }
    }

    onBlur?.();
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    // Save on Escape
    if (e.key === "Escape") {
      e.preventDefault();
      editableRef.current?.blur();
    }

    // Prevent Enter on single-line elements (headlines)
    if (e.key === "Enter" && element.type === "headline") {
      e.preventDefault();
    }
  };

  const handleInput = (e: React.FormEvent<HTMLDivElement>) => {
    const newContent = e.currentTarget.textContent || "";
    setContent(newContent);
  };

  const mergedStyle = getMergedTextStyle(element.type as TextElementTypeKey, element.style);
  const inlineStyle = textStyleToInlineStyle(mergedStyle);

  return (
    <div
      ref={editableRef}
      contentEditable
      suppressContentEditableWarning
      onBlur={handleBlur}
      onKeyDown={handleKeyDown}
      onInput={handleInput}
      className="outline-none"
      style={{
        position: "absolute",
        left: 0,
        top: 0,
        width: "100%",
        height: "100%",
        padding: "8px",
        backgroundColor: "rgba(244, 228, 188, 0.3)",
        border: "2px solid #8b7355",
        borderRadius: "2px",
        cursor: "text",
        wordWrap: "break-word",
        overflowWrap: "break-word",
        ...inlineStyle,
      }}
    >
      {element.content}
    </div>
  );
}
