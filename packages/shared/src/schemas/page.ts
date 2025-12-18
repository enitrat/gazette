import { z } from "zod";

// Template types
export const TemplateType = z.enum(["full-page", "two-columns", "three-grid", "masthead"]);

// Database record
export const PageSchema = z.object({
  id: z.string().uuid(),
  projectId: z.string().uuid(),
  order: z.number().int().min(0),
  templateId: TemplateType,
  title: z.string().max(200).default(""),
  subtitle: z.string().max(300).default(""),
  createdAt: z.date(),
  updatedAt: z.date(),
});

// Create page request
export const CreatePageSchema = z.object({
  templateId: TemplateType,
  afterPageId: z.string().uuid().optional(),
});

// Update page request
export const UpdatePageSchema = z.object({
  title: z.string().max(200).optional(),
  subtitle: z.string().max(300).optional(),
  templateId: TemplateType.optional(),
  order: z.number().int().min(0).optional(),
});

// Types
export type Template = z.infer<typeof TemplateType>;
export type Page = z.infer<typeof PageSchema>;
export type CreatePage = z.infer<typeof CreatePageSchema>;
export type UpdatePage = z.infer<typeof UpdatePageSchema>;

// Validation functions
export function validateCreatePage(data: unknown) {
  return CreatePageSchema.safeParse(data);
}

export function validateUpdatePage(data: unknown) {
  return UpdatePageSchema.safeParse(data);
}

export function validatePage(data: unknown) {
  return PageSchema.safeParse(data);
}
