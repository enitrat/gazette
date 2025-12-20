import type { SerializedElement } from '@/lib/api';

/**
 * Extended element type for the frontend editor
 * Includes UI-specific state like selection and editing
 */
export type EditorElement = SerializedElement & {
  // UI State
  isSelected?: boolean;
  isEditing?: boolean;
  isLocked?: boolean;
  isHidden?: boolean;

  // Interaction State
  isDragging?: boolean;
  isResizing?: boolean;
  isRotating?: boolean;
}

/**
 * Canvas viewport state
 */
export interface CanvasState {
  zoom: number;
  panOffset: {
    x: number;
    y: number;
  };
  canvasSize: {
    width: number;
    height: number;
  };
}

/**
 * Dialog types used throughout the editor
 */
export type DialogType =
  | 'upload'
  | 'template'
  | 'share'
  | 'export'
  | 'progress'
  | 'animation'
  | 'imageEdit'
  | null;

/**
 * Editor tool types
 */
export type EditorTool =
  | 'select'
  | 'text'
  | 'image'
  | 'shape'
  | 'line'
  | 'hand';

/**
 * Shape types for shape tool
 */
export type ShapeType =
  | 'rectangle'
  | 'circle'
  | 'triangle'
  | 'line'
  | 'arrow';

/**
 * Text alignment options
 */
export type TextAlign = 'left' | 'center' | 'right' | 'justify';

/**
 * Font weight options
 */
export type FontWeight = 'normal' | 'bold' | '100' | '200' | '300' | '400' | '500' | '600' | '700' | '800' | '900';

/**
 * Font style options
 */
export type FontStyle = 'normal' | 'italic';

/**
 * Text decoration options
 */
export type TextDecoration = 'none' | 'underline' | 'line-through';

/**
 * Animation preset types
 */
export type AnimationType =
  | 'fade-in'
  | 'slide-in-left'
  | 'slide-in-right'
  | 'slide-in-up'
  | 'slide-in-down'
  | 'zoom-in'
  | 'zoom-out'
  | 'rotate-in'
  | 'bounce'
  | 'none';

/**
 * Animation configuration
 */
export interface Animation {
  type: AnimationType;
  duration: number;
  delay: number;
  easing: 'linear' | 'ease' | 'ease-in' | 'ease-out' | 'ease-in-out';
}

/**
 * Export format options
 */
export type ExportFormat = 'pdf' | 'png' | 'jpg' | 'json';

/**
 * Export configuration
 */
export interface ExportOptions {
  format: ExportFormat;
  quality?: number; // For images (0-1)
  includeBleed?: boolean; // For PDF
  pageRange?: 'all' | 'current' | 'custom';
  customPages?: number[]; // For custom page range
}

/**
 * Template category
 */
export type TemplateCategory =
  | 'all'
  | 'newsletter'
  | 'poster'
  | 'magazine'
  | 'brochure'
  | 'announcement';

/**
 * Template data structure
 */
export interface Template {
  id: string;
  name: string;
  category: TemplateCategory;
  thumbnail: string;
  description?: string;
  pages: number;
  elements: SerializedElement[];
}

/**
 * History action for undo/redo
 */
export interface HistoryAction {
  type: 'add' | 'update' | 'delete' | 'reorder';
  elementId?: string;
  before?: any;
  after?: any;
  timestamp: number;
}

/**
 * Editor keyboard shortcuts
 */
export interface KeyboardShortcut {
  key: string;
  ctrlKey?: boolean;
  shiftKey?: boolean;
  altKey?: boolean;
  metaKey?: boolean;
  action: () => void;
  description: string;
}

/**
 * Grid and snap settings
 */
export interface GridSettings {
  enabled: boolean;
  size: number;
  color: string;
  opacity: number;
  snap: boolean;
  snapThreshold: number;
}

/**
 * Ruler settings
 */
export interface RulerSettings {
  enabled: boolean;
  unit: 'px' | 'cm' | 'in' | 'mm';
  guides: Guide[];
}

/**
 * Guide line
 */
export interface Guide {
  id: string;
  type: 'horizontal' | 'vertical';
  position: number;
  locked?: boolean;
}

/**
 * Selection bounds
 */
export interface SelectionBounds {
  x: number;
  y: number;
  width: number;
  height: number;
  rotation?: number;
}

/**
 * Resize handle positions
 */
export type ResizeHandle =
  | 'nw'
  | 'n'
  | 'ne'
  | 'e'
  | 'se'
  | 's'
  | 'sw'
  | 'w';

/**
 * Drag operation state
 */
export interface DragState {
  isDragging: boolean;
  startX: number;
  startY: number;
  currentX: number;
  currentY: number;
  elementIds: string[];
}

/**
 * Resize operation state
 */
export interface ResizeState {
  isResizing: boolean;
  handle: ResizeHandle | null;
  startX: number;
  startY: number;
  startWidth: number;
  startHeight: number;
  aspectRatio?: number;
}

/**
 * Clipboard data
 */
export interface ClipboardData {
  elements: SerializedElement[];
  timestamp: number;
}
