import { useEffect, useRef, useState } from 'react';
import { useElementsStore, type ElementWithStyle } from '@/stores/elements-store';

interface TextEditorProps {
  element: Extract<ElementWithStyle, { type: 'headline' | 'subheading' | 'caption' }>;
  onBlur?: () => void;
}

export function TextEditor({ element, onBlur }: TextEditorProps) {
  const [content, setContent] = useState(element.content || '');
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
        console.error('Failed to update element content:', error);
      }
    }

    onBlur?.();
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    // Save on Escape
    if (e.key === 'Escape') {
      e.preventDefault();
      editableRef.current?.blur();
    }

    // Prevent Enter on single-line elements (headlines)
    if (e.key === 'Enter' && element.type === 'headline') {
      e.preventDefault();
    }
  };

  const handleInput = (e: React.FormEvent<HTMLDivElement>) => {
    const newContent = e.currentTarget.textContent || '';
    setContent(newContent);
  };

  // Get default font styling based on element type, then merge with custom styles
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

  const defaultStyle = getDefaultStyle();
  const mergedStyle = { ...defaultStyle, ...element.style };

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
        position: 'absolute',
        left: 0,
        top: 0,
        width: '100%',
        height: '100%',
        padding: '8px',
        backgroundColor: 'rgba(244, 228, 188, 0.3)',
        border: '2px solid #8b7355',
        borderRadius: '2px',
        cursor: 'text',
        wordWrap: 'break-word',
        overflowWrap: 'break-word',
        fontFamily: mergedStyle.fontFamily,
        fontSize: typeof mergedStyle.fontSize === 'number' ? `${mergedStyle.fontSize}px` : mergedStyle.fontSize,
        fontWeight: mergedStyle.fontWeight,
        lineHeight: mergedStyle.lineHeight,
        letterSpacing: typeof mergedStyle.letterSpacing === 'number' ? `${mergedStyle.letterSpacing}px` : mergedStyle.letterSpacing,
        color: mergedStyle.color,
        textAlign: mergedStyle.textAlign,
        fontStyle: mergedStyle.fontStyle,
        textDecoration: mergedStyle.textDecoration,
      }}
    >
      {element.content}
    </div>
  );
}
