import { sqliteTable, text, integer, real } from "drizzle-orm/sqlite-core";
import { sql } from "drizzle-orm";

// Projects table
export const projects = sqliteTable("projects", {
  id: text("id").primaryKey(),
  name: text("name").notNull(),
  slug: text("slug").notNull().unique(),
  passwordHash: text("password_hash").notNull(),
  createdAt: integer("created_at", { mode: "timestamp" })
    .notNull()
    .default(sql`(unixepoch())`),
  updatedAt: integer("updated_at", { mode: "timestamp" })
    .notNull()
    .default(sql`(unixepoch())`),
});

// Pages table
export const pages = sqliteTable("pages", {
  id: text("id").primaryKey(),
  projectId: text("project_id")
    .notNull()
    .references(() => projects.id, { onDelete: "cascade" }),
  order: integer("order").notNull(),
  templateId: text("template_id").notNull().default("full-page"), // 'full-page' | 'two-columns' | 'three-grid' | 'masthead'
  title: text("title").default(""),
  subtitle: text("subtitle").default(""),
  createdAt: integer("created_at", { mode: "timestamp" })
    .notNull()
    .default(sql`(unixepoch())`),
  updatedAt: integer("updated_at", { mode: "timestamp" })
    .notNull()
    .default(sql`(unixepoch())`),
});

// Images table (uploaded files)
export const images = sqliteTable("images", {
  id: text("id").primaryKey(),
  projectId: text("project_id")
    .notNull()
    .references(() => projects.id, { onDelete: "cascade" }),
  originalFilename: text("original_filename").notNull(),
  storagePath: text("storage_path").notNull(),
  mimeType: text("mime_type").notNull(),
  width: integer("width").notNull(),
  height: integer("height").notNull(),
  uploadedAt: integer("uploaded_at", { mode: "timestamp" })
    .notNull()
    .default(sql`(unixepoch())`),
});

// Elements table (polymorphic: image or text)
export const elements = sqliteTable("elements", {
  id: text("id").primaryKey(),
  pageId: text("page_id")
    .notNull()
    .references(() => pages.id, { onDelete: "cascade" }),
  type: text("type").notNull(), // 'image' | 'headline' | 'subheading' | 'caption'

  // Position (all elements)
  positionX: real("position_x").notNull(),
  positionY: real("position_y").notNull(),
  positionWidth: real("position_width").notNull(),
  positionHeight: real("position_height").notNull(),

  // Image-specific fields (nullable for text elements)
  imageId: text("image_id").references(() => images.id),
  cropX: real("crop_x"),
  cropY: real("crop_y"),
  cropZoom: real("crop_zoom"),
  animationPrompt: text("animation_prompt"),
  videoUrl: text("video_url"),
  videoStatus: text("video_status").default("none"), // 'none' | 'pending' | 'processing' | 'complete' | 'failed'

  // Text-specific fields (nullable for image elements)
  content: text("content"),
  style: text("style"), // JSON string for text styling (fontFamily, fontSize, color, etc.)

  createdAt: integer("created_at", { mode: "timestamp" })
    .notNull()
    .default(sql`(unixepoch())`),
  updatedAt: integer("updated_at", { mode: "timestamp" })
    .notNull()
    .default(sql`(unixepoch())`),
});

// Generation jobs table
export const generationJobs = sqliteTable("generation_jobs", {
  id: text("id").primaryKey(),
  elementId: text("element_id")
    .notNull()
    .references(() => elements.id, { onDelete: "cascade" }),
  imageId: text("image_id")
    .notNull()
    .references(() => images.id),
  prompt: text("prompt").notNull(),
  status: text("status").notNull().default("queued"), // 'queued' | 'processing' | 'complete' | 'failed'
  progress: integer("progress").notNull().default(0),
  videoUrl: text("video_url"),
  error: text("error"),
  metadata: text("metadata"),
  createdAt: integer("created_at", { mode: "timestamp" })
    .notNull()
    .default(sql`(unixepoch())`),
  updatedAt: integer("updated_at", { mode: "timestamp" })
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
