import { eq } from "drizzle-orm";
import { db, schema } from "../db";
import type { ProjectRecord } from "../db/schema";

export function slugifyProjectName(name: string): string {
  const base = name
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
  if (base.length > 0) return base;
  return `project-${crypto.randomUUID().slice(0, 8)}`;
}

export async function getProjectById(id: string): Promise<ProjectRecord | undefined> {
  return db.select().from(schema.projects).where(eq(schema.projects.id, id)).get();
}

export async function getProjectByName(name: string): Promise<ProjectRecord | undefined> {
  return db.select().from(schema.projects).where(eq(schema.projects.name, name)).get();
}

export async function getProjectBySlug(slug: string): Promise<ProjectRecord | undefined> {
  return db.select().from(schema.projects).where(eq(schema.projects.slug, slug)).get();
}
