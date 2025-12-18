import { z } from 'zod';

// Supported mime types
export const ImageMimeType = z.enum(['image/jpeg', 'image/png', 'image/webp']);

// Database record
export const ImageSchema = z.object({
  id: z.string().uuid(),
  projectId: z.string().uuid(),
  originalFilename: z.string(),
  storagePath: z.string(),
  mimeType: ImageMimeType,
  width: z.number().int().positive(),
  height: z.number().int().positive(),
  uploadedAt: z.date(),
});

// Animation suggestion
export const AnimationSuggestionSchema = z.object({
  id: z.string(),
  description: z.string().max(100),
  prompt: z.string().max(500),
});

// Image analysis result (from AI)
export const ImageAnalysisResultSchema = z.object({
  imageId: z.string().uuid(),
  sceneDescription: z.string().max(500),
  suggestions: z.array(AnimationSuggestionSchema).min(1).max(4),
});

// Types
export type ImageMime = z.infer<typeof ImageMimeType>;
export type Image = z.infer<typeof ImageSchema>;
export type AnimationSuggestion = z.infer<typeof AnimationSuggestionSchema>;
export type ImageAnalysisResult = z.infer<typeof ImageAnalysisResultSchema>;

// Validation functions
export function validateImage(data: unknown) {
  return ImageSchema.safeParse(data);
}

export function validateAnimationSuggestion(data: unknown) {
  return AnimationSuggestionSchema.safeParse(data);
}

export function validateImageAnalysisResult(data: unknown) {
  return ImageAnalysisResultSchema.safeParse(data);
}

export function validateImageMimeType(data: unknown) {
  return ImageMimeType.safeParse(data);
}
