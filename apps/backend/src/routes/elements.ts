import { Hono } from "hono";
import { unlink } from "node:fs/promises";
import { join } from "node:path";
import { fileURLToPath } from "node:url";
import { and, asc, eq, sql } from "drizzle-orm";
import { requireAuth } from "../auth/middleware";
import { db } from "../db";
import { elements, images, pages, type ElementRecord } from "../db/schema";
import {
  DEFAULTS,
  ELEMENT_TYPES,
  ERROR_CODES,
  validateCreateElement,
  validateUpdateElement,
} from "@gazette/shared";
import { errorResponse } from "./utils";

const appRoot = fileURLToPath(new URL("..", import.meta.url));
const MAX_PHOTOS_PER_PAGE = 5;

const safeUnlink = async (filePath: string) => {
  try {
    await unlink(filePath);
  } catch (error) {
    if (
      error &&
      typeof error === "object" &&
      "code" in error &&
      (error as { code?: string }).code === "ENOENT"
    ) {
      return;
    }
    throw error;
  }
};

const serializeElement = (record: ElementRecord) => {
  const position = {
    x: record.positionX,
    y: record.positionY,
    width: record.positionWidth,
    height: record.positionHeight,
  };

  if (record.type === ELEMENT_TYPES.IMAGE) {
    const hasCropData = record.cropX !== null || record.cropY !== null || record.cropZoom !== null;
    const cropData = hasCropData
      ? {
          x: record.cropX ?? DEFAULTS.CROP_X,
          y: record.cropY ?? DEFAULTS.CROP_Y,
          zoom: record.cropZoom ?? DEFAULTS.CROP_ZOOM,
        }
      : null;
    const imageUrl = record.imageId ? `/api/images/${record.imageId}/file` : null;

    return {
      id: record.id,
      pageId: record.pageId,
      type: ELEMENT_TYPES.IMAGE,
      position,
      imageId: record.imageId ?? null,
      imageUrl,
      cropData,
      animationPrompt: record.animationPrompt ?? null,
      videoUrl: record.videoUrl ?? null,
      videoStatus: record.videoStatus ?? "none",
      createdAt: record.createdAt,
      updatedAt: record.updatedAt,
    };
  }

  return {
    id: record.id,
    pageId: record.pageId,
    type: record.type,
    position,
    content: record.content ?? "",
    createdAt: record.createdAt,
    updatedAt: record.updatedAt,
  };
};

const ensurePageAccess = async (pageId: string, projectId: string) => {
  return db
    .select()
    .from(pages)
    .where(and(eq(pages.id, pageId), eq(pages.projectId, projectId)))
    .get();
};

const ensureElementAccess = async (elementId: string, projectId: string) => {
  const record = db
    .select({ element: elements })
    .from(elements)
    .innerJoin(pages, eq(elements.pageId, pages.id))
    .where(and(eq(elements.id, elementId), eq(pages.projectId, projectId)))
    .get();

  return record?.element ?? null;
};

export const elementsRouter = new Hono();

elementsRouter.use("/pages/:id/elements", requireAuth);
elementsRouter.use("/elements/:id", requireAuth);

// List elements for a page
elementsRouter.get("/pages/:id/elements", async (c) => {
  const pageId = c.req.param("id");
  const projectId = c.get("projectId");
  const page = await ensurePageAccess(pageId, projectId);

  if (!page) {
    return errorResponse(c, 404, ERROR_CODES.PAGE_NOT_FOUND, "Page not found");
  }

  const pageElements = db
    .select()
    .from(elements)
    .where(eq(elements.pageId, pageId))
    .orderBy(asc(elements.createdAt))
    .all();

  return c.json({
    elements: pageElements.map((element) => serializeElement(element)),
  });
});

// Create element (image or text)
elementsRouter.post("/pages/:id/elements", async (c) => {
  const pageId = c.req.param("id");
  const projectId = c.get("projectId");
  const body = await c.req.json();
  const validation = validateCreateElement(body);

  if (!validation.success) {
    return errorResponse(
      c,
      400,
      ERROR_CODES.VALIDATION_ERROR,
      "Invalid element payload",
      validation.error.flatten()
    );
  }

  if (body?.type === ELEMENT_TYPES.IMAGE && "content" in body) {
    return errorResponse(
      c,
      400,
      ERROR_CODES.VALIDATION_ERROR,
      "Image elements cannot include text content"
    );
  }

  if (
    body?.type !== ELEMENT_TYPES.IMAGE &&
    ("animationPrompt" in body || "cropData" in body || "imageId" in body)
  ) {
    return errorResponse(
      c,
      400,
      ERROR_CODES.VALIDATION_ERROR,
      "Text elements cannot include image-specific fields"
    );
  }

  const page = await ensurePageAccess(pageId, projectId);
  if (!page) {
    return errorResponse(c, 404, ERROR_CODES.PAGE_NOT_FOUND, "Page not found");
  }

  if (validation.data.type === ELEMENT_TYPES.IMAGE) {
    const imageCountResult = db
      .select({ count: sql<number>`count(*)` })
      .from(elements)
      .where(and(eq(elements.pageId, pageId), eq(elements.type, ELEMENT_TYPES.IMAGE)))
      .get();

    const imageCount = imageCountResult?.count ?? 0;
    if (imageCount >= MAX_PHOTOS_PER_PAGE) {
      return errorResponse(
        c,
        400,
        ERROR_CODES.VALIDATION_ERROR,
        `Pages can contain up to ${MAX_PHOTOS_PER_PAGE} photos`
      );
    }
  }

  const elementId = crypto.randomUUID();
  const position = validation.data.position;
  let insertValues: typeof elements.$inferInsert;

  if (validation.data.type === ELEMENT_TYPES.IMAGE) {
    insertValues = {
      id: elementId,
      pageId,
      type: validation.data.type,
      positionX: position.x,
      positionY: position.y,
      positionWidth: position.width,
      positionHeight: position.height,
      imageId: null,
      cropX: null,
      cropY: null,
      cropZoom: null,
      animationPrompt: null,
      videoUrl: null,
      videoStatus: "none",
      content: null,
    };
  } else {
    insertValues = {
      id: elementId,
      pageId,
      type: validation.data.type,
      positionX: position.x,
      positionY: position.y,
      positionWidth: position.width,
      positionHeight: position.height,
      imageId: null,
      cropX: null,
      cropY: null,
      cropZoom: null,
      animationPrompt: null,
      videoUrl: null,
      videoStatus: null,
      content: validation.data.content ?? "",
    };
  }

  db.insert(elements).values(insertValues).run();

  const createdElement = db.select().from(elements).where(eq(elements.id, elementId)).get();

  if (!createdElement) {
    return errorResponse(c, 500, ERROR_CODES.INTERNAL_ERROR, "Failed to create element");
  }

  return c.json(serializeElement(createdElement), 201);
});

// Update element
elementsRouter.put("/elements/:id", async (c) => {
  const elementId = c.req.param("id");
  const projectId = c.get("projectId");
  const body = await c.req.json();
  const validation = validateUpdateElement(body);

  if (!validation.success) {
    return errorResponse(
      c,
      400,
      ERROR_CODES.VALIDATION_ERROR,
      "Invalid update payload",
      validation.error.flatten()
    );
  }

  const existing = await ensureElementAccess(elementId, projectId);

  if (!existing) {
    return errorResponse(c, 404, ERROR_CODES.ELEMENT_NOT_FOUND, "Element not found");
  }

  if (existing.type === ELEMENT_TYPES.IMAGE && validation.data.content !== undefined) {
    return errorResponse(
      c,
      400,
      ERROR_CODES.VALIDATION_ERROR,
      "Image elements cannot update text content"
    );
  }

  if (
    existing.type !== ELEMENT_TYPES.IMAGE &&
    (validation.data.cropData !== undefined || validation.data.animationPrompt !== undefined)
  ) {
    return errorResponse(
      c,
      400,
      ERROR_CODES.VALIDATION_ERROR,
      "Text elements cannot update image-specific fields"
    );
  }

  const updateValues: Partial<typeof elements.$inferInsert> = {
    updatedAt: new Date(),
  };

  if (validation.data.position) {
    updateValues.positionX = validation.data.position.x;
    updateValues.positionY = validation.data.position.y;
    updateValues.positionWidth = validation.data.position.width;
    updateValues.positionHeight = validation.data.position.height;
  }

  if (validation.data.content !== undefined) {
    updateValues.content = validation.data.content;
  }

  if (validation.data.cropData !== undefined) {
    if (validation.data.cropData === null) {
      updateValues.cropX = null;
      updateValues.cropY = null;
      updateValues.cropZoom = null;
    } else {
      updateValues.cropX = validation.data.cropData.x;
      updateValues.cropY = validation.data.cropData.y;
      updateValues.cropZoom = validation.data.cropData.zoom ?? DEFAULTS.CROP_ZOOM;
    }
  }

  if (validation.data.animationPrompt !== undefined) {
    updateValues.animationPrompt = validation.data.animationPrompt;
  }

  if (Object.keys(updateValues).length === 1) {
    return errorResponse(c, 400, ERROR_CODES.VALIDATION_ERROR, "No updates provided");
  }

  db.update(elements).set(updateValues).where(eq(elements.id, elementId)).run();

  const updatedElement = db.select().from(elements).where(eq(elements.id, elementId)).get();

  if (!updatedElement) {
    return errorResponse(c, 500, ERROR_CODES.INTERNAL_ERROR, "Failed to update element");
  }

  return c.json(serializeElement(updatedElement));
});

// Delete element
elementsRouter.delete("/elements/:id", async (c) => {
  const elementId = c.req.param("id");
  const projectId = c.get("projectId");
  const existing = await ensureElementAccess(elementId, projectId);

  if (!existing) {
    return errorResponse(c, 404, ERROR_CODES.ELEMENT_NOT_FOUND, "Element not found");
  }

  db.delete(elements).where(eq(elements.id, elementId)).run();

  if (existing.imageId) {
    const usage = db
      .select({ count: sql<number>`count(*)` })
      .from(elements)
      .where(eq(elements.imageId, existing.imageId))
      .get();

    if ((usage?.count ?? 0) === 0) {
      const image = db
        .select()
        .from(images)
        .where(and(eq(images.id, existing.imageId), eq(images.projectId, projectId)))
        .get();
      if (image) {
        db.delete(images).where(eq(images.id, existing.imageId)).run();
        const normalizedPath = image.storagePath.startsWith("/")
          ? image.storagePath.slice(1)
          : image.storagePath;
        await safeUnlink(join(appRoot, normalizedPath));
      }
    }
  }

  return c.body(null, 204);
});
