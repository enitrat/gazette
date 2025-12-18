# La Gazette de la Vie - Data Models

> Zod schemas, TypeScript types, and database schema

---

## 1. Zod Schemas

### 1.1 Project Schema

```typescript
// packages/shared/src/schemas/project.ts
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
  name: z.string()
    .min(1, 'Project name is required')
    .max(100, 'Project name must be 100 characters or less'),
  password: z.string()
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
```

---

### 1.2 Page Schema

```typescript
// packages/shared/src/schemas/page.ts
import { z } from 'zod';

// Template types
export const TemplateType = z.enum([
  'classic-front',
  'two-column',
  'grid-gallery',
  'magazine-spread',
]);

// Database record
export const PageSchema = z.object({
  id: z.string().uuid(),
  projectId: z.string().uuid(),
  order: z.number().int().min(0),
  template: TemplateType,
  title: z.string().max(200).default(''),
  subtitle: z.string().max(300).default(''),
  createdAt: z.date(),
  updatedAt: z.date(),
});

// Create page request
export const CreatePageSchema = z.object({
  template: TemplateType,
  afterPageId: z.string().uuid().optional(),
});

// Update page request
export const UpdatePageSchema = z.object({
  title: z.string().max(200).optional(),
  subtitle: z.string().max(300).optional(),
  template: TemplateType.optional(),
  order: z.number().int().min(0).optional(),
});

// Types
export type Template = z.infer<typeof TemplateType>;
export type Page = z.infer<typeof PageSchema>;
export type CreatePage = z.infer<typeof CreatePageSchema>;
export type UpdatePage = z.infer<typeof UpdatePageSchema>;
```

---

### 1.3 Element Schema

```typescript
// packages/shared/src/schemas/element.ts
import { z } from 'zod';

// Element types
export const ElementType = z.enum(['image', 'headline', 'subheading', 'caption']);

// Video generation status
export const VideoStatus = z.enum(['none', 'pending', 'processing', 'complete', 'failed']);

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

// Image element
export const ImageElementSchema = z.object({
  id: z.string().uuid(),
  pageId: z.string().uuid(),
  type: z.literal('image'),
  position: PositionSchema,
  imageId: z.string().uuid().nullable(),
  cropData: CropDataSchema.nullable(),
  animationPrompt: z.string().max(500).nullable(),
  videoUrl: z.string().url().nullable(),
  videoStatus: VideoStatus,
  createdAt: z.date(),
  updatedAt: z.date(),
});

// Text element
export const TextElementSchema = z.object({
  id: z.string().uuid(),
  pageId: z.string().uuid(),
  type: z.enum(['headline', 'subheading', 'caption']),
  position: PositionSchema,
  content: z.string().max(1000),
  createdAt: z.date(),
  updatedAt: z.date(),
});

// Union of all element types
export const ElementSchema = z.discriminatedUnion('type', [
  ImageElementSchema,
  TextElementSchema.extend({ type: z.literal('headline') }),
  TextElementSchema.extend({ type: z.literal('subheading') }),
  TextElementSchema.extend({ type: z.literal('caption') }),
]);

// Create element request
export const CreateElementSchema = z.discriminatedUnion('type', [
  z.object({
    type: z.literal('image'),
    position: PositionSchema,
  }),
  z.object({
    type: z.enum(['headline', 'subheading', 'caption']),
    position: PositionSchema,
    content: z.string().max(1000).default(''),
  }),
]);

// Update element request
export const UpdateElementSchema = z.object({
  position: PositionSchema.optional(),
  cropData: CropDataSchema.nullable().optional(),
  animationPrompt: z.string().max(500).nullable().optional(),
  content: z.string().max(1000).optional(),
});

// Types
export type ElementTypeEnum = z.infer<typeof ElementType>;
export type VideoStatusEnum = z.infer<typeof VideoStatus>;
export type Position = z.infer<typeof PositionSchema>;
export type CropData = z.infer<typeof CropDataSchema>;
export type ImageElement = z.infer<typeof ImageElementSchema>;
export type TextElement = z.infer<typeof TextElementSchema>;
export type Element = z.infer<typeof ElementSchema>;
export type CreateElement = z.infer<typeof CreateElementSchema>;
export type UpdateElement = z.infer<typeof UpdateElementSchema>;
```

---

### 1.4 Image Schema

```typescript
// packages/shared/src/schemas/image.ts
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
```

---

### 1.5 Generation Schema

```typescript
// packages/shared/src/schemas/generation.ts
import { z } from 'zod';

// Job status
export const JobStatus = z.enum(['queued', 'processing', 'complete', 'failed']);

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
  createdAt: z.date(),
  updatedAt: z.date(),
});

// Single element generation input
export const GenerationElementInput = z.object({
  elementId: z.string().uuid(),
  imageId: z.string().uuid(),
  prompt: z.string().min(1).max(500),
});

// Generation request
export const GenerationRequestSchema = z.object({
  elements: z.array(GenerationElementInput).min(1).max(25),
});

// Generation status response
export const GenerationStatusSchema = z.object({
  projectId: z.string().uuid(),
  totalJobs: z.number().int(),
  completed: z.number().int(),
  processing: z.number().int(),
  queued: z.number().int(),
  failed: z.number().int(),
  jobs: z.array(GenerationJobSchema.pick({
    id: true,
    elementId: true,
    status: true,
    progress: true,
    videoUrl: true,
    error: true,
  })),
});

// Types
export type JobStatusEnum = z.infer<typeof JobStatus>;
export type GenerationJob = z.infer<typeof GenerationJobSchema>;
export type GenerationElementInput = z.infer<typeof GenerationElementInput>;
export type GenerationRequest = z.infer<typeof GenerationRequestSchema>;
export type GenerationStatus = z.infer<typeof GenerationStatusSchema>;
```

---

### 1.6 Shared Index

```typescript
// packages/shared/src/index.ts
export * from './schemas/project';
export * from './schemas/page';
export * from './schemas/element';
export * from './schemas/image';
export * from './schemas/generation';
```

---

## 2. Database Schema (SQLite + Drizzle)

### 2.1 Drizzle Schema

```typescript
// apps/server/src/db/schema.ts
import { sqliteTable, text, integer, real } from 'drizzle-orm/sqlite-core';
import { sql } from 'drizzle-orm';

// Projects table
export const projects = sqliteTable('projects', {
  id: text('id').primaryKey(),
  name: text('name').notNull(),
  slug: text('slug').notNull().unique(),
  passwordHash: text('password_hash').notNull(),
  createdAt: integer('created_at', { mode: 'timestamp' })
    .notNull()
    .default(sql`(unixepoch())`),
  updatedAt: integer('updated_at', { mode: 'timestamp' })
    .notNull()
    .default(sql`(unixepoch())`),
});

// Pages table
export const pages = sqliteTable('pages', {
  id: text('id').primaryKey(),
  projectId: text('project_id')
    .notNull()
    .references(() => projects.id, { onDelete: 'cascade' }),
  order: integer('order').notNull(),
  template: text('template').notNull(), // 'classic-front' | 'two-column' | etc.
  title: text('title').default(''),
  subtitle: text('subtitle').default(''),
  createdAt: integer('created_at', { mode: 'timestamp' })
    .notNull()
    .default(sql`(unixepoch())`),
  updatedAt: integer('updated_at', { mode: 'timestamp' })
    .notNull()
    .default(sql`(unixepoch())`),
});

// Images table (uploaded files)
export const images = sqliteTable('images', {
  id: text('id').primaryKey(),
  projectId: text('project_id')
    .notNull()
    .references(() => projects.id, { onDelete: 'cascade' }),
  originalFilename: text('original_filename').notNull(),
  storagePath: text('storage_path').notNull(),
  mimeType: text('mime_type').notNull(),
  width: integer('width').notNull(),
  height: integer('height').notNull(),
  uploadedAt: integer('uploaded_at', { mode: 'timestamp' })
    .notNull()
    .default(sql`(unixepoch())`),
});

// Elements table (polymorphic: image or text)
export const elements = sqliteTable('elements', {
  id: text('id').primaryKey(),
  pageId: text('page_id')
    .notNull()
    .references(() => pages.id, { onDelete: 'cascade' }),
  type: text('type').notNull(), // 'image' | 'headline' | 'subheading' | 'caption'

  // Position (all elements)
  positionX: real('position_x').notNull(),
  positionY: real('position_y').notNull(),
  positionWidth: real('position_width').notNull(),
  positionHeight: real('position_height').notNull(),

  // Image-specific fields (nullable for text elements)
  imageId: text('image_id').references(() => images.id),
  cropX: real('crop_x'),
  cropY: real('crop_y'),
  cropZoom: real('crop_zoom'),
  animationPrompt: text('animation_prompt'),
  videoUrl: text('video_url'),
  videoStatus: text('video_status').default('none'), // 'none' | 'pending' | 'processing' | 'complete' | 'failed'

  // Text-specific fields (nullable for image elements)
  content: text('content'),

  createdAt: integer('created_at', { mode: 'timestamp' })
    .notNull()
    .default(sql`(unixepoch())`),
  updatedAt: integer('updated_at', { mode: 'timestamp' })
    .notNull()
    .default(sql`(unixepoch())`),
});

// Generation jobs table
export const generationJobs = sqliteTable('generation_jobs', {
  id: text('id').primaryKey(),
  elementId: text('element_id')
    .notNull()
    .references(() => elements.id, { onDelete: 'cascade' }),
  imageId: text('image_id')
    .notNull()
    .references(() => images.id),
  prompt: text('prompt').notNull(),
  status: text('status').notNull().default('queued'), // 'queued' | 'processing' | 'complete' | 'failed'
  progress: integer('progress').notNull().default(0),
  videoUrl: text('video_url'),
  error: text('error'),
  createdAt: integer('created_at', { mode: 'timestamp' })
    .notNull()
    .default(sql`(unixepoch())`),
  updatedAt: integer('updated_at', { mode: 'timestamp' })
    .notNull()
    .default(sql`(unixepoch())`),
});

// Type exports
export type ProjectRecord = typeof projects.$inferSelect;
export type NewProject = typeof projects.$inferInsert;

export type PageRecord = typeof pages.$inferSelect;
export type NewPage = typeof pages.$inferInsert;

export type ImageRecord = typeof images.$inferSelect;
export type NewImage = typeof images.$inferInsert;

export type ElementRecord = typeof elements.$inferSelect;
export type NewElement = typeof elements.$inferInsert;

export type GenerationJobRecord = typeof generationJobs.$inferSelect;
export type NewGenerationJob = typeof generationJobs.$inferInsert;
```

---

### 2.2 Raw SQL Schema

```sql
-- apps/server/src/db/migrations/0001_initial.sql

-- Projects table
CREATE TABLE IF NOT EXISTS projects (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  slug TEXT NOT NULL UNIQUE,
  password_hash TEXT NOT NULL,
  created_at INTEGER NOT NULL DEFAULT (unixepoch()),
  updated_at INTEGER NOT NULL DEFAULT (unixepoch())
);

-- Pages table
CREATE TABLE IF NOT EXISTS pages (
  id TEXT PRIMARY KEY,
  project_id TEXT NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  "order" INTEGER NOT NULL,
  template TEXT NOT NULL,
  title TEXT DEFAULT '',
  subtitle TEXT DEFAULT '',
  created_at INTEGER NOT NULL DEFAULT (unixepoch()),
  updated_at INTEGER NOT NULL DEFAULT (unixepoch())
);

-- Images table (uploaded files)
CREATE TABLE IF NOT EXISTS images (
  id TEXT PRIMARY KEY,
  project_id TEXT NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  original_filename TEXT NOT NULL,
  storage_path TEXT NOT NULL,
  mime_type TEXT NOT NULL,
  width INTEGER NOT NULL,
  height INTEGER NOT NULL,
  uploaded_at INTEGER NOT NULL DEFAULT (unixepoch())
);

-- Elements table (polymorphic: image or text)
CREATE TABLE IF NOT EXISTS elements (
  id TEXT PRIMARY KEY,
  page_id TEXT NOT NULL REFERENCES pages(id) ON DELETE CASCADE,
  type TEXT NOT NULL,
  position_x REAL NOT NULL,
  position_y REAL NOT NULL,
  position_width REAL NOT NULL,
  position_height REAL NOT NULL,
  -- Image-specific (nullable)
  image_id TEXT REFERENCES images(id),
  crop_x REAL,
  crop_y REAL,
  crop_zoom REAL,
  animation_prompt TEXT,
  video_url TEXT,
  video_status TEXT DEFAULT 'none',
  -- Text-specific (nullable)
  content TEXT,
  created_at INTEGER NOT NULL DEFAULT (unixepoch()),
  updated_at INTEGER NOT NULL DEFAULT (unixepoch())
);

-- Generation jobs table
CREATE TABLE IF NOT EXISTS generation_jobs (
  id TEXT PRIMARY KEY,
  element_id TEXT NOT NULL REFERENCES elements(id) ON DELETE CASCADE,
  image_id TEXT NOT NULL REFERENCES images(id),
  prompt TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'queued',
  progress INTEGER NOT NULL DEFAULT 0,
  video_url TEXT,
  error TEXT,
  created_at INTEGER NOT NULL DEFAULT (unixepoch()),
  updated_at INTEGER NOT NULL DEFAULT (unixepoch())
);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_pages_project ON pages(project_id);
CREATE INDEX IF NOT EXISTS idx_elements_page ON elements(page_id);
CREATE INDEX IF NOT EXISTS idx_images_project ON images(project_id);
CREATE INDEX IF NOT EXISTS idx_jobs_element ON generation_jobs(element_id);
CREATE INDEX IF NOT EXISTS idx_jobs_status ON generation_jobs(status);
CREATE INDEX IF NOT EXISTS idx_projects_slug ON projects(slug);
```

---

## 3. Entity Relationship Diagram

```
┌─────────────────┐
│    projects     │
├─────────────────┤
│ id (PK)         │
│ name            │
│ slug (UNIQUE)   │
│ password_hash   │
│ created_at      │
│ updated_at      │
└────────┬────────┘
         │
         │ 1:N
         ▼
┌─────────────────┐         ┌─────────────────┐
│     pages       │         │     images      │
├─────────────────┤         ├─────────────────┤
│ id (PK)         │         │ id (PK)         │
│ project_id (FK) │◄────────│ project_id (FK) │
│ order           │         │ original_filename│
│ template        │         │ storage_path    │
│ title           │         │ mime_type       │
│ subtitle        │         │ width           │
│ created_at      │         │ height          │
│ updated_at      │         │ uploaded_at     │
└────────┬────────┘         └────────┬────────┘
         │                           │
         │ 1:N                       │
         ▼                           │
┌─────────────────┐                  │
│    elements     │                  │
├─────────────────┤                  │
│ id (PK)         │                  │
│ page_id (FK)    │                  │
│ type            │                  │
│ position_*      │                  │
│ image_id (FK)   │◄─────────────────┘
│ crop_*          │
│ animation_prompt│
│ video_url       │
│ video_status    │
│ content         │
│ created_at      │
│ updated_at      │
└────────┬────────┘
         │
         │ 1:N
         ▼
┌─────────────────┐
│ generation_jobs │
├─────────────────┤
│ id (PK)         │
│ element_id (FK) │
│ image_id (FK)   │──────────► images
│ prompt          │
│ status          │
│ progress        │
│ video_url       │
│ error           │
│ created_at      │
│ updated_at      │
└─────────────────┘
```

---

## 4. Type Utilities

```typescript
// packages/shared/src/types/utils.ts

// Make specific properties optional
export type PartialBy<T, K extends keyof T> = Omit<T, K> & Partial<Pick<T, K>>;

// Make specific properties required
export type RequiredBy<T, K extends keyof T> = Omit<T, K> & Required<Pick<T, K>>;

// Extract element type from union
export type ImageElementType = Extract<Element, { type: 'image' }>;
export type TextElementType = Exclude<Element, { type: 'image' }>;

// API response wrapper
export type ApiResponse<T> = {
  data: T;
  meta?: {
    total?: number;
    page?: number;
    limit?: number;
  };
};

// API error response
export type ApiError = {
  error: {
    code: string;
    message: string;
    details?: Array<{
      field: string;
      message: string;
    }>;
  };
};
```

---

*Data Models v1.0*
*Last Updated: December 18, 2024*
