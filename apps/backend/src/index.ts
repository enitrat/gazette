import { Hono, type Context } from "hono";
import { cors } from "hono/cors";
import { logger } from "hono/logger";
import { secureHeaders } from "hono/secure-headers";
import { requestId } from "hono/request-id";
import { HTTPException } from "hono/http-exception";
import { and, asc, eq, sql } from "drizzle-orm";
import { db } from "./db";
import { AuthError } from "./auth";
import { requireAuth } from "./auth/middleware";
import { elements, pages, type ElementRecord } from "./db/schema";
import { projectsRouter } from "./routes/projects";
import {
  DEFAULTS,
  ELEMENT_TYPES,
  ERROR_CODES,
  validateCreateElement,
  validateUpdateElement,
} from "@gazette/shared";

// Environment configuration
const PORT = parseInt(process.env.PORT || "3000", 10);
const NODE_ENV = process.env.NODE_ENV || "development";
const CORS_ORIGIN = process.env.CORS_ORIGIN || "http://localhost:5173";

// Create Hono app
export const app = new Hono();

// Middleware
app.use("*", requestId());
app.use("*", logger());
app.use("*", secureHeaders());
app.use(
  "*",
  cors({
    origin: CORS_ORIGIN.split(","),
    allowMethods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
    allowHeaders: ["Content-Type", "Authorization", "X-Request-Id"],
    exposeHeaders: ["X-Request-Id"],
    maxAge: 86400,
    credentials: true,
  })
);

// Health check endpoint
app.get("/health", async (c) => {
  try {
    // Test database connection
    const result = db.$client.query("SELECT 1 as ok").get() as { ok: number };
    const dbHealthy = result?.ok === 1;

    return c.json({
      status: dbHealthy ? "healthy" : "unhealthy",
      timestamp: new Date().toISOString(),
      version: "0.0.1",
      environment: NODE_ENV,
      database: dbHealthy ? "connected" : "disconnected",
    });
  } catch (error) {
    return c.json(
      {
        status: "unhealthy",
        timestamp: new Date().toISOString(),
        version: "0.0.1",
        environment: NODE_ENV,
        database: "error",
        error: error instanceof Error ? error.message : "Unknown error",
      },
      503
    );
  }
});

// API root
app.get("/", (c) => {
  return c.json({
    name: "La Gazette de la Vie API",
    version: "0.0.1",
    documentation: "/docs",
  });
});

// API routes
app.route("/api/projects", projectsRouter);

const MAX_PHOTOS_PER_PAGE = 5;

function errorResponse(
  c: Context,
  status: number,
  code: string,
  message: string,
  details?: unknown
) {
  return c.json(
    {
      error: {
        code,
        message,
        details,
      },
    },
    status
  );
}

function serializeElement(record: ElementRecord) {
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
}

async function ensurePageAccess(pageId: string, projectId: string) {
  return db
    .select()
    .from(pages)
    .where(and(eq(pages.id, pageId), eq(pages.projectId, projectId)))
    .get();
}

async function ensureElementAccess(elementId: string, projectId: string) {
  const record = db
    .select({ element: elements })
    .from(elements)
    .innerJoin(pages, eq(elements.pageId, pages.id))
    .where(and(eq(elements.id, elementId), eq(pages.projectId, projectId)))
    .get();

  return record?.element ?? null;
}

app.use("/api/pages/:id/elements", requireAuth);
app.use("/api/elements/:id", requireAuth);

// List elements for a page
app.get("/api/pages/:id/elements", async (c) => {
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
app.post("/api/pages/:id/elements", async (c) => {
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
app.put("/api/elements/:id", async (c) => {
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
app.delete("/api/elements/:id", async (c) => {
  const elementId = c.req.param("id");
  const projectId = c.get("projectId");
  const existing = await ensureElementAccess(elementId, projectId);

  if (!existing) {
    return errorResponse(c, 404, ERROR_CODES.ELEMENT_NOT_FOUND, "Element not found");
  }

  db.delete(elements).where(eq(elements.id, elementId)).run();

  return c.body(null, 204);
});

// 404 handler
app.notFound((c) => {
  return c.json(
    {
      error: {
        code: "NOT_FOUND",
        message: `Route ${c.req.method} ${c.req.path} not found`,
      },
    },
    404
  );
});

// Error handler
app.onError((err, c) => {
  // Handle authentication errors
  if (err instanceof AuthError) {
    return c.json(
      {
        error: {
          code: err.code,
          message: err.message,
        },
      },
      err.status
    );
  }

  // Handle other HTTP exceptions
  if (err instanceof HTTPException) {
    return c.json(
      {
        error: {
          code: "HTTP_ERROR",
          message: err.message,
        },
      },
      err.status
    );
  }

  // Log unexpected errors
  console.error(`[ERROR] ${c.req.method} ${c.req.path}:`, err);

  return c.json(
    {
      error: {
        code: "INTERNAL_ERROR",
        message: NODE_ENV === "production" ? "Internal server error" : err.message,
      },
    },
    500
  );
});

// Start server
if (NODE_ENV === "development") {
  console.warn(`Starting server in ${NODE_ENV} mode...`);
  console.warn(`CORS origin: ${CORS_ORIGIN}`);
}

export default {
  port: PORT,
  fetch: app.fetch,
};
