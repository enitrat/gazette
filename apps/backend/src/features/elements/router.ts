import { Hono } from "hono";
import { and, asc, eq, sql } from "drizzle-orm";
import { requireAuth } from "../../auth/middleware";
import { db } from "../../db";
import { elements, pages, type ElementRecord } from "../../db/schema";
import {
  DEFAULTS,
  ELEMENT_TYPES,
  ERROR_CODES,
  validateCreateElement,
  validateUpdateElement,
} from "@gazette/shared";
import { errorResponse } from "../shared/http";
import { signMediaPath } from "../../lib/signed-urls";

const MAX_PHOTOS_PER_PAGE = 5;

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
    const imageUrl = record.imageId ? signMediaPath(`/api/images/${record.imageId}/file`) : null;

    return {
      id: record.id,
      pageId: record.pageId,
      type: ELEMENT_TYPES.IMAGE,
      position,
      imageId: record.imageId ?? null,
      imageUrl,
      cropData,
      animationPrompt: record.animationPrompt ?? null,
      videoUrl: signMediaPath(record.videoUrl ?? null),
      videoStatus: record.videoStatus ?? "none",
      createdAt: record.createdAt,
      updatedAt: record.updatedAt,
    };
  }

  // Parse style JSON if present
  const style = record.style ? JSON.parse(record.style) : null;

  return {
    id: record.id,
    pageId: record.pageId,
    type: record.type,
    position,
    content: record.content ?? "",
    style,
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
      imageId: validation.data.imageId ?? null,
      cropX: null,
      cropY: null,
      cropZoom: null,
      animationPrompt: null,
      videoUrl: validation.data.videoUrl ?? null,
      videoStatus: validation.data.videoStatus ?? "none",
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
      style: validation.data.style ? JSON.stringify(validation.data.style) : null,
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
    (validation.data.cropData !== undefined ||
      validation.data.animationPrompt !== undefined ||
      validation.data.imageId !== undefined)
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

  if (validation.data.imageId !== undefined) {
    updateValues.imageId = validation.data.imageId;
  }

  if (validation.data.style !== undefined) {
    updateValues.style = validation.data.style ? JSON.stringify(validation.data.style) : null;
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

  // Note: Do not auto-delete uploaded images when their last element is removed.
  // Media library should retain all uploads unless explicitly deleted by the user.

  return c.body(null, 204);
});
