import { z } from "zod";
import { GenerationJobStatusItemSchema } from "./generation";
import { TemplateDefinitionSchema } from "./template";
import { TemplateType } from "./page";

// Helper schema for date strings (backend returns ISO strings)
const DateStringSchema = z.string().datetime();

// =============================================================================
// Pages API Responses
// =============================================================================

// Page list item (includes elementCount)
export const PageListItemSchema = z.object({
  id: z.string().uuid(),
  order: z.number().int().min(0),
  templateId: TemplateType,
  title: z.string(),
  subtitle: z.string(),
  elementCount: z.number().int().min(0),
});

// GET /projects/:id/pages
export const PagesListResponseSchema = z.object({
  pages: z.array(PageListItemSchema),
});

// POST /projects/:id/pages (create page)
export const CreatePageResponseSchema = z.object({
  id: z.string().uuid(),
  projectId: z.string().uuid(),
  order: z.number().int().min(0),
  templateId: TemplateType,
  title: z.string(),
  subtitle: z.string(),
  createdAt: DateStringSchema,
});

// PUT /pages/:id (update page)
export const UpdatePageResponseSchema = z.object({
  id: z.string().uuid(),
  projectId: z.string().uuid(),
  order: z.number().int().min(0),
  templateId: TemplateType,
  title: z.string(),
  subtitle: z.string(),
  updatedAt: DateStringSchema,
});

// PATCH /pages/reorder
export const ReorderPagesResponseSchema = z.object({
  pages: z.array(
    z.object({
      id: z.string().uuid(),
      order: z.number().int().min(0),
    })
  ),
});

// =============================================================================
// Elements API Responses
// =============================================================================

// Image element response includes imageUrl
const ImageElementResponseSchema = z.object({
  id: z.string().uuid(),
  pageId: z.string().uuid(),
  type: z.literal("image"),
  position: z.object({
    x: z.number(),
    y: z.number(),
    width: z.number().positive(),
    height: z.number().positive(),
  }),
  imageId: z.string().uuid().nullable(),
  imageUrl: z.string().nullable(),
  cropData: z
    .object({
      x: z.number(),
      y: z.number(),
      zoom: z.number().positive(),
    })
    .nullable(),
  animationPrompt: z.string().nullable(),
  videoUrl: z.string().nullable(),
  videoStatus: z.enum(["none", "pending", "processing", "complete", "failed"]),
  createdAt: z.union([z.date(), DateStringSchema]).optional(),
  updatedAt: z.union([z.date(), DateStringSchema]).optional(),
});

// Text style schema for API responses
const TextStyleResponseSchema = z
  .object({
    fontFamily: z.string().optional(),
    fontSize: z.number().positive().optional(),
    fontWeight: z.enum(["normal", "bold", "400", "700"]).optional(),
    fontStyle: z.enum(["normal", "italic"]).optional(),
    lineHeight: z.number().positive().optional(),
    letterSpacing: z.number().optional(),
    color: z.string().optional(),
    textAlign: z.enum(["left", "center", "right", "justify"]).optional(),
    textDecoration: z.string().optional(),
  })
  .nullable();

// Text element response
const TextElementResponseSchema = z.object({
  id: z.string().uuid(),
  pageId: z.string().uuid(),
  type: z.enum(["headline", "subheading", "caption"]),
  position: z.object({
    x: z.number(),
    y: z.number(),
    width: z.number().positive(),
    height: z.number().positive(),
  }),
  content: z.string(),
  style: TextStyleResponseSchema,
  createdAt: z.union([z.date(), DateStringSchema]).optional(),
  updatedAt: z.union([z.date(), DateStringSchema]).optional(),
});

// Union of element responses
export const SerializedElementSchema = z.union([
  ImageElementResponseSchema,
  TextElementResponseSchema,
]);

// GET /pages/:id/elements
export const ElementsListResponseSchema = z.object({
  elements: z.array(SerializedElementSchema),
});

// POST /pages/:id/elements (create element) - returns single element
export const CreateElementResponseSchema = SerializedElementSchema;

// PUT /elements/:id (update element) - returns single element
export const UpdateElementResponseSchema = SerializedElementSchema;

// =============================================================================
// Images API Responses
// =============================================================================

// Serialized image for API responses
export const SerializedImageSchema = z.object({
  id: z.string().uuid(),
  projectId: z.string().uuid(),
  originalFilename: z.string(),
  storagePath: z.string(),
  mimeType: z.enum(["image/jpeg", "image/png", "image/webp"]),
  width: z.number().int().positive(),
  height: z.number().int().positive(),
  uploadedAt: DateStringSchema,
});

// GET /projects/:id/images
export const ImagesListResponseSchema = z.object({
  images: z.array(SerializedImageSchema),
});

// =============================================================================
// Videos API Responses
// =============================================================================

// Serialized video for API responses
export const SerializedVideoSchema = z.object({
  id: z.string().uuid(),
  projectId: z.string().uuid(),
  generationJobId: z.string().uuid().nullable(),
  sourceImageId: z.string().uuid().nullable(),
  filename: z.string(),
  storagePath: z.string(),
  mimeType: z.string(),
  width: z.number().int().nonnegative().nullable(),
  height: z.number().int().nonnegative().nullable(),
  durationSeconds: z.number().int().nonnegative().nullable(),
  fileSize: z.number().int().nonnegative().nullable(),
  createdAt: DateStringSchema,
  url: z.string(),
});

// GET /projects/:id/videos
export const VideosListResponseSchema = z.object({
  videos: z.array(SerializedVideoSchema),
});

// =============================================================================
// Templates API Responses
// =============================================================================

// GET /templates
export const TemplatesListResponseSchema = z.object({
  templates: z.array(TemplateDefinitionSchema),
});

// =============================================================================
// Generation API Responses
// =============================================================================

// Job reference in generation start response
const GenerationJobRefSchema = z.object({
  id: z.string().uuid(),
  elementId: z.string().uuid(),
  status: z.enum(["queued", "processing", "complete", "failed"]),
});

// POST /pages/:id/generate
export const StartPageGenerationResponseSchema = z.object({
  pageId: z.string().uuid(),
  jobCount: z.number().int().min(0),
  estimatedDuration: z.number().int().min(0),
  jobs: z.array(GenerationJobRefSchema),
});

// POST /projects/:id/generate
export const StartProjectGenerationResponseSchema = z.object({
  projectId: z.string().uuid(),
  jobCount: z.number().int().min(0),
  estimatedDuration: z.number().int().min(0),
  jobs: z.array(GenerationJobRefSchema),
});

// GET /generation/:id or GET /jobs/:id (single job status)
export const GenerationJobResponseSchema = z.object({
  id: z.string().uuid(),
  elementId: z.string().uuid(),
  imageId: z.string().uuid(),
  prompt: z.string(),
  status: z.enum(["queued", "processing", "complete", "failed"]),
  progress: z.number().min(0).max(100),
  videoUrl: z.string().nullable(),
  error: z.string().nullable(),
  metadata: z
    .object({
      promptUsed: z.string().nullable(),
      promptSource: z.enum(["gemini", "override", "fallback"]).nullable(),
      suggestionId: z.string().nullable(),
      sceneDescription: z.string().nullable(),
      durationSeconds: z.number().int().positive().nullable(),
      resolution: z.enum(["480p", "720p", "1080p"]).nullable(),
      geminiModel: z.string().nullable().optional(),
      wanModel: z.string().nullable().optional(),
    })
    .nullable(),
  createdAt: DateStringSchema,
  updatedAt: DateStringSchema,
});

// GET /projects/:id/generation/status
export const GenerationStatusResponseSchema = z.object({
  projectId: z.string().uuid(),
  totalJobs: z.number().int().min(0),
  completed: z.number().int().min(0),
  processing: z.number().int().min(0),
  queued: z.number().int().min(0),
  failed: z.number().int().min(0),
  jobs: z.array(GenerationJobStatusItemSchema),
});

// =============================================================================
// View API Responses
// =============================================================================

// POST /view/:slug/access
export const ViewAccessResponseSchema = z.object({
  viewToken: z.string(),
  expiresIn: z.number().int().positive(),
});

// View element (simplified, no createdAt/updatedAt)
const ViewElementSchema = z.union([
  z.object({
    id: z.string().uuid(),
    pageId: z.string().uuid(),
    type: z.literal("image"),
    position: z.object({
      x: z.number(),
      y: z.number(),
      width: z.number().positive(),
      height: z.number().positive(),
    }),
    imageId: z.string().uuid().nullable(),
    imageUrl: z.string().nullable(),
    cropData: z
      .object({
        x: z.number(),
        y: z.number(),
        zoom: z.number().positive(),
      })
      .nullable(),
    animationPrompt: z.string().nullable(),
    videoUrl: z.string().nullable(),
    videoStatus: z.enum(["none", "pending", "processing", "complete", "failed"]),
  }),
  z.object({
    id: z.string().uuid(),
    pageId: z.string().uuid(),
    type: z.enum(["headline", "subheading", "caption"]),
    position: z.object({
      x: z.number(),
      y: z.number(),
      width: z.number().positive(),
      height: z.number().positive(),
    }),
    content: z.string(),
    style: TextStyleResponseSchema,
  }),
]);

// Page with elements
const ViewPageSchema = z.object({
  id: z.string().uuid(),
  order: z.number().int().min(0),
  templateId: TemplateType,
  title: z.string(),
  subtitle: z.string(),
  elements: z.array(ViewElementSchema),
});

// GET /view/:slug or GET /projects/:id/view
export const ViewProjectResponseSchema = z.object({
  project: z.object({
    id: z.string().uuid(),
    name: z.string(),
    slug: z.string(),
    shareUrl: z.string(),
    createdAt: DateStringSchema.nullable(),
  }),
  pages: z.array(ViewPageSchema),
});

// =============================================================================
// Project API Responses
// =============================================================================

// POST /projects (create project)
export const CreateProjectResponseSchema = z.object({
  id: z.string().uuid(),
  name: z.string(),
  slug: z.string(),
  token: z.string(),
  createdAt: DateStringSchema.nullable(),
});

// POST /projects/access
export const AccessProjectResponseSchema = z.object({
  id: z.string().uuid(),
  name: z.string(),
  slug: z.string(),
  token: z.string(),
  createdAt: DateStringSchema.nullable(),
  updatedAt: DateStringSchema.nullable(),
});

// GET /projects/:id
export const GetProjectResponseSchema = z.object({
  id: z.string().uuid(),
  name: z.string(),
  slug: z.string(),
  createdAt: DateStringSchema.nullable(),
  updatedAt: DateStringSchema.nullable(),
});

// =============================================================================
// Types
// =============================================================================

export type PageListItem = z.infer<typeof PageListItemSchema>;
export type PagesListResponse = z.infer<typeof PagesListResponseSchema>;
export type CreatePageResponse = z.infer<typeof CreatePageResponseSchema>;
export type UpdatePageResponse = z.infer<typeof UpdatePageResponseSchema>;
export type ReorderPagesResponse = z.infer<typeof ReorderPagesResponseSchema>;

export type SerializedElement = z.infer<typeof SerializedElementSchema>;
export type ElementsListResponse = z.infer<typeof ElementsListResponseSchema>;
export type CreateElementResponse = z.infer<typeof CreateElementResponseSchema>;
export type UpdateElementResponse = z.infer<typeof UpdateElementResponseSchema>;

export type SerializedImage = z.infer<typeof SerializedImageSchema>;
export type ImagesListResponse = z.infer<typeof ImagesListResponseSchema>;

export type SerializedVideo = z.infer<typeof SerializedVideoSchema>;
export type VideosListResponse = z.infer<typeof VideosListResponseSchema>;

export type TemplatesListResponse = z.infer<typeof TemplatesListResponseSchema>;

export type StartPageGenerationResponse = z.infer<typeof StartPageGenerationResponseSchema>;
export type StartProjectGenerationResponse = z.infer<typeof StartProjectGenerationResponseSchema>;
export type GenerationJobResponse = z.infer<typeof GenerationJobResponseSchema>;
export type GenerationStatusResponse = z.infer<typeof GenerationStatusResponseSchema>;

export type ViewAccessResponse = z.infer<typeof ViewAccessResponseSchema>;
export type ViewProjectResponse = z.infer<typeof ViewProjectResponseSchema>;

export type CreateProjectResponse = z.infer<typeof CreateProjectResponseSchema>;
export type AccessProjectResponse = z.infer<typeof AccessProjectResponseSchema>;
export type GetProjectResponse = z.infer<typeof GetProjectResponseSchema>;

// =============================================================================
// Validation Functions
// =============================================================================

// Pages
export function validatePagesListResponse(data: unknown) {
  return PagesListResponseSchema.safeParse(data);
}

export function validateCreatePageResponse(data: unknown) {
  return CreatePageResponseSchema.safeParse(data);
}

export function validateUpdatePageResponse(data: unknown) {
  return UpdatePageResponseSchema.safeParse(data);
}

export function validateReorderPagesResponse(data: unknown) {
  return ReorderPagesResponseSchema.safeParse(data);
}

// Elements
export function validateElementsListResponse(data: unknown) {
  return ElementsListResponseSchema.safeParse(data);
}

export function validateCreateElementResponse(data: unknown) {
  return CreateElementResponseSchema.safeParse(data);
}

export function validateUpdateElementResponse(data: unknown) {
  return UpdateElementResponseSchema.safeParse(data);
}

// Images
export function validateImagesListResponse(data: unknown) {
  return ImagesListResponseSchema.safeParse(data);
}

// Videos
export function validateVideosListResponse(data: unknown) {
  return VideosListResponseSchema.safeParse(data);
}

// Templates
export function validateTemplatesListResponse(data: unknown) {
  return TemplatesListResponseSchema.safeParse(data);
}

// Generation
export function validateStartPageGenerationResponse(data: unknown) {
  return StartPageGenerationResponseSchema.safeParse(data);
}

export function validateStartProjectGenerationResponse(data: unknown) {
  return StartProjectGenerationResponseSchema.safeParse(data);
}

export function validateGenerationJobResponse(data: unknown) {
  return GenerationJobResponseSchema.safeParse(data);
}

export function validateGenerationStatusResponse(data: unknown) {
  return GenerationStatusResponseSchema.safeParse(data);
}

// View
export function validateViewAccessResponse(data: unknown) {
  return ViewAccessResponseSchema.safeParse(data);
}

export function validateViewProjectResponse(data: unknown) {
  return ViewProjectResponseSchema.safeParse(data);
}

// Projects
export function validateCreateProjectResponse(data: unknown) {
  return CreateProjectResponseSchema.safeParse(data);
}

export function validateAccessProjectResponse(data: unknown) {
  return AccessProjectResponseSchema.safeParse(data);
}

export function validateGetProjectResponse(data: unknown) {
  return GetProjectResponseSchema.safeParse(data);
}
