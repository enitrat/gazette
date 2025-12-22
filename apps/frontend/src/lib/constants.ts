import { CANVAS } from "@gazette/shared";

export const CANVAS_WIDTH = CANVAS.WIDTH; // Gazette page width in px
export const CANVAS_HEIGHT = CANVAS.HEIGHT; // Gazette page height in px (newspaper ratio)
export const MIN_ZOOM = 0.25;
export const MAX_ZOOM = 2;
export const ZOOM_STEP = 0.1;
export const DEBOUNCE_DELAY = 300; // ms for auto-save
// In production, use relative URL (same host via Caddy)
// In development, use localhost:3000
export const API_BASE_URL = import.meta.env.VITE_API_URL || "/api";
