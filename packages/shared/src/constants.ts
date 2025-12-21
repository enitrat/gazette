// Template constants
export const TEMPLATES = {
  FULL_PAGE: "full-page",
  TWO_COLUMNS: "two-columns",
  THREE_GRID: "three-grid",
  MASTHEAD: "masthead",
} as const;

export const TEMPLATE_NAMES: Record<string, string> = {
  [TEMPLATES.FULL_PAGE]: "Full Page",
  [TEMPLATES.TWO_COLUMNS]: "Two Columns",
  [TEMPLATES.THREE_GRID]: "Three Grid",
  [TEMPLATES.MASTHEAD]: "Masthead",
};

// Element type constants
export const ELEMENT_TYPES = {
  IMAGE: "image",
  HEADLINE: "headline",
  SUBHEADING: "subheading",
  CAPTION: "caption",
} as const;

// Video status constants
export const VIDEO_STATUS = {
  NONE: "none",
  PENDING: "pending",
  PROCESSING: "processing",
  COMPLETE: "complete",
  FAILED: "failed",
} as const;

// Job status constants
export const JOB_STATUS = {
  QUEUED: "queued",
  PROCESSING: "processing",
  COMPLETE: "complete",
  FAILED: "failed",
} as const;

// Image constraints
export const IMAGE_CONSTRAINTS = {
  MAX_FILE_SIZE: 10 * 1024 * 1024, // 10MB
  SUPPORTED_MIME_TYPES: ["image/jpeg", "image/png", "image/webp"] as const,
  MIN_DIMENSION: 100,
  MAX_DIMENSION: 8192,
} as const;

// Validation constraints
export const VALIDATION = {
  PROJECT_NAME_MAX: 100,
  PASSWORD_MIN: 4,
  PASSWORD_MAX: 50,
  PAGE_TITLE_MAX: 200,
  PAGE_SUBTITLE_MAX: 300,
  TEXT_CONTENT_MAX: 1000,
  ANIMATION_PROMPT_MAX: 500,
  SCENE_DESCRIPTION_MAX: 500,
  SUGGESTION_DESCRIPTION_MAX: 100,
  MIN_ANIMATION_SUGGESTIONS: 0,
  MAX_ANIMATION_SUGGESTIONS: 5,
  MAX_GENERATION_ELEMENTS: 25,
} as const;

// API error codes
export const ERROR_CODES = {
  // Authentication
  UNAUTHORIZED: "UNAUTHORIZED",
  INVALID_CREDENTIALS: "INVALID_CREDENTIALS",
  PROJECT_NOT_FOUND: "PROJECT_NOT_FOUND",

  // Validation
  VALIDATION_ERROR: "VALIDATION_ERROR",
  INVALID_INPUT: "INVALID_INPUT",

  // Resources
  NOT_FOUND: "NOT_FOUND",
  PAGE_NOT_FOUND: "PAGE_NOT_FOUND",
  ELEMENT_NOT_FOUND: "ELEMENT_NOT_FOUND",
  IMAGE_NOT_FOUND: "IMAGE_NOT_FOUND",

  // Generation
  GENERATION_FAILED: "GENERATION_FAILED",
  GENERATION_LIMIT_EXCEEDED: "GENERATION_LIMIT_EXCEEDED",

  // Server
  INTERNAL_ERROR: "INTERNAL_ERROR",
  SERVICE_UNAVAILABLE: "SERVICE_UNAVAILABLE",
} as const;

// Default values
export const DEFAULTS = {
  PAGE_ORDER: 0,
  CROP_ZOOM: 1,
  CROP_X: 0,
  CROP_Y: 0,
  GENERATION_PROGRESS: 0,
} as const;

// Canvas dimensions - shared between editor and export
export const CANVAS = {
  WIDTH: 800,
  HEIGHT: 1100,
} as const;

// Text style defaults for each element type - NYT/WSJ Editorial Typography
export const TEXT_STYLES = {
  headline: {
    fontFamily: "Playfair Display",
    fontSize: 36,
    fontWeight: "700" as const,
    lineHeight: 1.1,
    letterSpacing: -0.02,
    color: "#000000",
    textAlign: "left" as const,
    fontStyle: "normal" as const,
    textDecoration: "none",
  },
  subheading: {
    fontFamily: "Libre Baskerville",
    fontSize: 18,
    fontWeight: "400" as const,
    lineHeight: 1.35,
    letterSpacing: 0,
    color: "#333333",
    textAlign: "left" as const,
    fontStyle: "italic" as const,
    textDecoration: "none",
  },
  caption: {
    fontFamily: "EB Garamond",
    fontSize: 13,
    fontWeight: "400" as const,
    lineHeight: 1.45,
    letterSpacing: 0.01,
    color: "#666666",
    textAlign: "left" as const,
    fontStyle: "normal" as const,
    textDecoration: "none",
  },
} as const;

// Colors used in the gazette theme - NYT/WSJ Editorial Palette
export const GAZETTE_COLORS = {
  // Paper & backgrounds
  newsprint: "#FAFAFA", // Clean newsprint white
  paper: "#FFFFFF", // Pure white for page
  canvas: "#E8E8E8", // Neutral gray canvas backdrop

  // Typography
  ink: "#121212", // NYT-style deep black
  headline: "#000000", // Pure black for headlines
  body: "#333333", // Slightly softer for body text
  caption: "#666666", // Gray for captions/metadata
  muted: "#999999", // Light gray for subtle text

  // Accents & UI
  rule: "#CCCCCC", // Column separator rules
  border: "#E0E0E0", // Subtle borders
  accent: "#121212", // Black accent (monochrome)

  // Legacy compatibility
  parchment: "#FAFAFA", // Maps to newsprint
  cream: "#F5F5F5", // Light gray
} as const;

// Text element type string literal for styling functions
export type TextElementTypeKey = "headline" | "subheading" | "caption";

// Partial text style for custom overrides
export type PartialTextStyle = {
  fontFamily?: string;
  fontSize?: number;
  fontWeight?: string;
  lineHeight?: number;
  letterSpacing?: number;
  color?: string;
  textAlign?: string;
  fontStyle?: string;
  textDecoration?: string;
};

// Full text style with all properties
export type FullTextStyle = {
  fontFamily: string;
  fontSize: number;
  fontWeight: string;
  lineHeight: number;
  letterSpacing: number;
  color: string;
  textAlign: string;
  fontStyle: string;
  textDecoration: string;
};

/**
 * Get merged text style for an element type, with optional custom overrides.
 * This is the single source of truth for text styling across editor and export.
 */
export function getMergedTextStyle(
  elementType: TextElementTypeKey,
  customStyle?: PartialTextStyle | null
): FullTextStyle {
  const defaults = TEXT_STYLES[elementType];
  return {
    fontFamily: customStyle?.fontFamily ?? defaults.fontFamily,
    fontSize: customStyle?.fontSize ?? defaults.fontSize,
    fontWeight: customStyle?.fontWeight ?? defaults.fontWeight,
    lineHeight: customStyle?.lineHeight ?? defaults.lineHeight,
    letterSpacing: customStyle?.letterSpacing ?? defaults.letterSpacing,
    color: customStyle?.color ?? defaults.color,
    textAlign: customStyle?.textAlign ?? defaults.textAlign,
    fontStyle: customStyle?.fontStyle ?? defaults.fontStyle,
    textDecoration: customStyle?.textDecoration ?? defaults.textDecoration,
  };
}

/**
 * Convert text style to CSS string for use in export/SSR.
 * Uses em for letter-spacing as the values are designed for relative sizing.
 */
export function textStyleToCss(style: FullTextStyle): string {
  const fontSize = `${style.fontSize}px`;
  const letterSpacing = `${style.letterSpacing}em`;
  const fontFamily = style.fontFamily.replace(/'/g, "\\'");

  return `font-family: '${fontFamily}', Georgia, serif; font-size: ${fontSize}; font-weight: ${style.fontWeight}; line-height: ${style.lineHeight}; letter-spacing: ${letterSpacing}; color: ${style.color}; text-align: ${style.textAlign}; font-style: ${style.fontStyle}; text-decoration: ${style.textDecoration};`;
}

/**
 * Convert text style to inline style object for use in editor/React.
 * Uses em for letter-spacing as the values are designed for relative sizing.
 * Returns a plain object that can be cast to React.CSSProperties.
 */
export function textStyleToInlineStyle(style: FullTextStyle): Record<string, string | number> {
  return {
    fontFamily: `"${style.fontFamily}", Georgia, serif`,
    fontSize: `${style.fontSize}px`,
    fontWeight: style.fontWeight,
    lineHeight: style.lineHeight,
    letterSpacing: `${style.letterSpacing}em`,
    color: style.color,
    textAlign: style.textAlign,
    fontStyle: style.fontStyle,
    textDecoration: style.textDecoration,
  };
}
