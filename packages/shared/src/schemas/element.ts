import { z } from "zod";

// Element types
export const ElementType = z.enum(["image", "headline", "subheading", "caption"]);

// Video generation status
export const VideoStatus = z.enum(["none", "pending", "processing", "complete", "failed"]);

// Position schema (shared)
export const PositionSchema = z.object({
  x: z.number(),
  y: z.number(),
  width: z.number().positive(),
  height: z.number().positive(),
});

// Crop data schema
export const CropDataSchema = z.object({
  x: z.number(),
  y: z.number(),
  zoom: z.number().positive().default(1),
});

// Text style schema
export const TextStyleSchema = z.object({
  fontFamily: z.string().optional(),
  fontSize: z.number().positive().optional(),
  fontWeight: z.enum(["normal", "bold", "400", "700"]).optional(),
  fontStyle: z.enum(["normal", "italic"]).optional(),
  lineHeight: z.number().positive().optional(),
  letterSpacing: z.number().optional(),
  color: z.string().optional(),
  textAlign: z.enum(["left", "center", "right", "justify"]).optional(),
  textDecoration: z.string().optional(),
});

// Image element
export const ImageElementSchema = z.object({
  id: z.string().uuid(),
  pageId: z.string().uuid(),
  type: z.literal("image"),
  position: PositionSchema,
  imageId: z.string().uuid().nullable(),
  cropData: CropDataSchema.nullable(),
  animationPrompt: z.string().max(500).nullable(),
  videoUrl: z.string().url().nullable(),
  videoStatus: VideoStatus,
  createdAt: z.date(),
  updatedAt: z.date(),
});

// Text element base schema
export const TextElementBaseSchema = z.object({
  id: z.string().uuid(),
  pageId: z.string().uuid(),
  position: PositionSchema,
  content: z.string().max(1000),
  style: TextStyleSchema.nullable(),
  createdAt: z.date(),
  updatedAt: z.date(),
});

// Text element with type union
export const TextElementSchema = TextElementBaseSchema.extend({
  type: z.enum(["headline", "subheading", "caption"]),
});

// Union of all element types
export const ElementSchema = z.discriminatedUnion("type", [
  ImageElementSchema,
  TextElementBaseSchema.extend({ type: z.literal("headline") }),
  TextElementBaseSchema.extend({ type: z.literal("subheading") }),
  TextElementBaseSchema.extend({ type: z.literal("caption") }),
]);

// Create element request
export const CreateElementSchema = z.discriminatedUnion("type", [
  z.object({
    type: z.literal("image"),
    position: PositionSchema,
    imageId: z.string().uuid().optional(),
    // Optional video fields for creating elements from existing videos
    videoUrl: z.string().optional(),
    videoStatus: VideoStatus.optional(),
  }),
  z.object({
    type: z.enum(["headline", "subheading", "caption"]),
    position: PositionSchema,
    content: z.string().max(1000).default(""),
    style: TextStyleSchema.optional(),
  }),
]);

// Update element request
export const UpdateElementSchema = z.object({
  position: PositionSchema.optional(),
  cropData: CropDataSchema.nullable().optional(),
  animationPrompt: z.string().max(500).nullable().optional(),
  content: z.string().max(1000).optional(),
  style: TextStyleSchema.nullable().optional(),
});

// Types
export type ElementTypeEnum = z.infer<typeof ElementType>;
export type VideoStatusEnum = z.infer<typeof VideoStatus>;
export type TextStyle = z.infer<typeof TextStyleSchema>;
export type Position = z.infer<typeof PositionSchema>;
export type CropData = z.infer<typeof CropDataSchema>;
export type ImageElement = z.infer<typeof ImageElementSchema>;
export type TextElement = z.infer<typeof TextElementSchema>;
export type Element = z.infer<typeof ElementSchema>;
export type CreateElement = z.infer<typeof CreateElementSchema>;
export type UpdateElement = z.infer<typeof UpdateElementSchema>;

// Validation functions
export function validateCreateElement(data: unknown) {
  return CreateElementSchema.safeParse(data);
}

export function validateUpdateElement(data: unknown) {
  return UpdateElementSchema.safeParse(data);
}

export function validateElement(data: unknown) {
  return ElementSchema.safeParse(data);
}

export function validatePosition(data: unknown) {
  return PositionSchema.safeParse(data);
}

export function validateCropData(data: unknown) {
  return CropDataSchema.safeParse(data);
}
