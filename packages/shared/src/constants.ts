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
  MAX_ANIMATION_SUGGESTIONS: 4,
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
