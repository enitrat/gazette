import { z } from 'zod';

// Database record
export const ProjectSchema = z.object({
  id: z.string().uuid(),
  name: z.string().min(1).max(100),
  slug: z.string().regex(/^[a-z0-9-]+$/),
  passwordHash: z.string(),
  createdAt: z.date(),
  updatedAt: z.date(),
});

// Create project request
export const CreateProjectSchema = z.object({
  name: z
    .string()
    .min(1, 'Project name is required')
    .max(100, 'Project name must be 100 characters or less'),
  password: z
    .string()
    .min(4, 'Password must be at least 4 characters')
    .max(50, 'Password must be 50 characters or less'),
});

// Access project request
export const AccessProjectSchema = z.object({
  name: z.string().min(1),
  password: z.string().min(1),
});

// Project response (without passwordHash)
export const ProjectResponseSchema = ProjectSchema.omit({ passwordHash: true });

// Types
export type Project = z.infer<typeof ProjectSchema>;
export type CreateProject = z.infer<typeof CreateProjectSchema>;
export type AccessProject = z.infer<typeof AccessProjectSchema>;
export type ProjectResponse = z.infer<typeof ProjectResponseSchema>;

// Validation functions
export function validateCreateProject(data: unknown) {
  return CreateProjectSchema.safeParse(data);
}

export function validateAccessProject(data: unknown) {
  return AccessProjectSchema.safeParse(data);
}

export function validateProject(data: unknown) {
  return ProjectSchema.safeParse(data);
}
