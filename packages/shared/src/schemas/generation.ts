import { z } from "zod";

// Job status
export const JobStatus = z.enum(["queued", "processing", "complete", "failed"]);

export const GenerationMetadataSchema = z.object({
  promptUsed: z.string().max(500).nullable(),
  promptSource: z.enum(["gemini", "override", "fallback"]).nullable(),
  suggestionId: z.string().nullable(),
  sceneDescription: z.string().max(500).nullable(),
  durationSeconds: z.number().int().positive().nullable(),
  resolution: z.enum(["480p", "720p", "1080p"]).nullable(),
  geminiModel: z.string().nullable().optional(),
  wanModel: z.string().nullable().optional(),
});

// Generation job database record
export const GenerationJobSchema = z.object({
  id: z.string().uuid(),
  elementId: z.string().uuid(),
  imageId: z.string().uuid(),
  prompt: z.string().max(500),
  status: JobStatus,
  progress: z.number().min(0).max(100),
  videoUrl: z.string().url().nullable(),
  error: z.string().nullable(),
  metadata: GenerationMetadataSchema.nullable(),
  createdAt: z.date(),
  updatedAt: z.date(),
});

// Single element generation input
export const GenerationElementInputSchema = z.object({
  elementId: z.string().uuid(),
  imageId: z.string().uuid(),
  prompt: z.string().min(1).max(500),
});

// Generation request
export const GenerationRequestSchema = z.object({
  elements: z.array(GenerationElementInputSchema).min(1).max(25),
});

// Generation job status item (subset of full job)
export const GenerationJobStatusItemSchema = GenerationJobSchema.pick({
  id: true,
  elementId: true,
  status: true,
  progress: true,
  videoUrl: true,
  error: true,
});

// Generation status response
export const GenerationStatusSchema = z.object({
  projectId: z.string().uuid(),
  totalJobs: z.number().int(),
  completed: z.number().int(),
  processing: z.number().int(),
  queued: z.number().int(),
  failed: z.number().int(),
  jobs: z.array(GenerationJobStatusItemSchema),
});

// Types
export type JobStatusEnum = z.infer<typeof JobStatus>;
export type GenerationMetadata = z.infer<typeof GenerationMetadataSchema>;
export type GenerationJob = z.infer<typeof GenerationJobSchema>;
export type GenerationElementInput = z.infer<typeof GenerationElementInputSchema>;
export type GenerationRequest = z.infer<typeof GenerationRequestSchema>;
export type GenerationJobStatusItem = z.infer<typeof GenerationJobStatusItemSchema>;
export type GenerationStatus = z.infer<typeof GenerationStatusSchema>;

// Validation functions
export function validateGenerationJob(data: unknown) {
  return GenerationJobSchema.safeParse(data);
}

export function validateGenerationElementInput(data: unknown) {
  return GenerationElementInputSchema.safeParse(data);
}

export function validateGenerationRequest(data: unknown) {
  return GenerationRequestSchema.safeParse(data);
}

export function validateGenerationStatus(data: unknown) {
  return GenerationStatusSchema.safeParse(data);
}
