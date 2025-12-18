import { z } from "zod";
import { ElementType, PositionSchema } from "./element";
import { TemplateType } from "./page";

export const TemplateCanvasSchema = z.object({
  width: z.number().positive(),
  height: z.number().positive(),
});

export const TemplateElementSchema = z.object({
  type: ElementType,
  position: PositionSchema,
  content: z.string().optional(),
});

export const TemplateDefinitionSchema = z.object({
  id: TemplateType,
  name: z.string().min(1),
  description: z.string().optional(),
  canvas: TemplateCanvasSchema,
  elements: z.array(TemplateElementSchema),
});

export type TemplateCanvas = z.infer<typeof TemplateCanvasSchema>;
export type TemplateElementDefinition = z.infer<typeof TemplateElementSchema>;
export type TemplateDefinition = z.infer<typeof TemplateDefinitionSchema>;

export function validateTemplateDefinition(data: unknown) {
  return TemplateDefinitionSchema.safeParse(data);
}

export function validateTemplateDefinitions(data: unknown) {
  return z.array(TemplateDefinitionSchema).safeParse(data);
}
