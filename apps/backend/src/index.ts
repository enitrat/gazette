import { Hono, type Context } from "hono";
import { cors } from "hono/cors";
import { logger } from "hono/logger";
import { secureHeaders } from "hono/secure-headers";
import { requestId } from "hono/request-id";
import { HTTPException } from "hono/http-exception";
import { Buffer } from "node:buffer";
import { randomUUID } from "node:crypto";
import { mkdir, unlink } from "node:fs/promises";
import { extname, join } from "node:path";
import { fileURLToPath } from "node:url";
import sharp, { type OutputInfo } from "sharp";
import { and, asc, eq, sql } from "drizzle-orm";
import { db } from "./db";
import { AuthError, AuthErrors } from "./auth";
import { requireAuth } from "./auth/middleware";
import { elements, images, pages, projects, type ElementRecord } from "./db/schema";
import { projectsRouter } from "./routes/projects";
import {
  DEFAULTS,
  ELEMENT_TYPES,
  ERROR_CODES,
  IMAGE_CONSTRAINTS,
  validateCreateElement,
  validateUpdateElement,
} from "@gazette/shared";

// Environment configuration
const PORT = parseInt(process.env.PORT || "3000", 10);
const NODE_ENV = process.env.NODE_ENV || "development";
const CORS_ORIGIN = process.env.CORS_ORIGIN || "http://localhost:5173";
const RAW_UPLOAD_DIR = process.env.UPLOAD_DIR || "uploads";
const UPLOAD_DIR = RAW_UPLOAD_DIR.replace(/^\.\//, "").replace(/\/$/, "");
const IMAGE_SUBDIR = "images";
const MAX_IMAGE_WIDTH = 2048;
const MAX_UPLOAD_BYTES = IMAGE_CONSTRAINTS.MAX_FILE_SIZE;
const ALLOWED_MIME_TYPES = new Set(IMAGE_CONSTRAINTS.SUPPORTED_MIME_TYPES);
const MIME_BY_EXTENSION: Record<string, string> = {
  ".jpg": "image/jpeg",
  ".jpeg": "image/jpeg",
  ".png": "image/png",
  ".webp": "image/webp",
};
const EXTENSION_BY_MIME: Record<string, string> = {
  "image/jpeg": ".jpg",
  "image/png": ".png",
  "image/webp": ".webp",
};

const appRoot = fileURLToPath(new URL("..", import.meta.url));
const uploadRoot = join(appRoot, UPLOAD_DIR, IMAGE_SUBDIR);
await mkdir(uploadRoot, { recursive: true });

type BodyValue = string | File;
type ParsedBody = Record<string, BodyValue | BodyValue[]>;

const firstBodyValue = (value: BodyValue | BodyValue[] | undefined): BodyValue | undefined =>
  Array.isArray(value) ? value[0] : value;

const getBodyFile = (body: ParsedBody, keys: string[]): File | undefined => {
  for (const key of keys) {
    const value = firstBodyValue(body[key]);
    if (value instanceof File) {
      return value;
    }
  }
  return undefined;
};

const normalizeImageType = (name: string, mimeType: string) => {
  const extension = extname(name).toLowerCase();
  const normalizedExtension = MIME_BY_EXTENSION[extension] ? extension : "";
  const normalizedMimeType = ALLOWED_MIME_TYPES.has(mimeType)
    ? mimeType
    : MIME_BY_EXTENSION[extension];
  if (!normalizedMimeType) {
    return null;
  }
  const outputExtension = EXTENSION_BY_MIME[normalizedMimeType] || normalizedExtension;
  return { extension: outputExtension, mimeType: normalizedMimeType };
};

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
app.use("/api/projects/:id/images", requireAuth);
app.use("/api/images/:id", requireAuth);
app.use("/api/images/:id/file", requireAuth);

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

// Upload an image
app.post("/api/projects/:id/images", async (c) => {
  const projectId = c.req.param("id");
  const authProjectId = c.get("projectId");

  if (projectId !== authProjectId) {
    throw AuthErrors.ACCESS_DENIED();
  }

  const project = db
    .select({ id: projects.id })
    .from(projects)
    .where(eq(projects.id, projectId))
    .get();
  if (!project) {
    return errorResponse(c, 404, ERROR_CODES.PROJECT_NOT_FOUND, "Project not found");
  }

  const contentType = c.req.header("content-type") ?? "";
  if (!contentType.includes("multipart/form-data")) {
    return errorResponse(
      c,
      415,
      ERROR_CODES.INVALID_INPUT,
      "Content-Type must be multipart/form-data"
    );
  }

  const body = (await c.req.parseBody()) as ParsedBody;
  const file = getBodyFile(body, ["file", "image", "upload"]);
  if (!file) {
    return errorResponse(c, 400, ERROR_CODES.VALIDATION_ERROR, "No file provided");
  }

  if (file.size > MAX_UPLOAD_BYTES) {
    return errorResponse(c, 413, ERROR_CODES.VALIDATION_ERROR, "File too large (max 10MB)");
  }

  const originalFilename = file.name || "upload";
  const normalizedType = normalizeImageType(originalFilename, file.type);
  if (!normalizedType) {
    return errorResponse(
      c,
      400,
      ERROR_CODES.VALIDATION_ERROR,
      "Invalid file type (only JPG, PNG, WebP allowed)"
    );
  }

  const buffer = Buffer.from(await file.arrayBuffer());
  let transformer = sharp(buffer, { failOnError: true }).rotate();

  transformer = transformer.resize({
    width: MAX_IMAGE_WIDTH,
    withoutEnlargement: true,
  });

  switch (normalizedType.extension) {
    case ".jpg":
      transformer = transformer.jpeg({ quality: 82, mozjpeg: true });
      break;
    case ".png":
      transformer = transformer.png({ compressionLevel: 9 });
      break;
    case ".webp":
      transformer = transformer.webp({ quality: 82 });
      break;
    default:
      break;
  }

  let output: { data: Buffer; info: OutputInfo };
  try {
    output = await transformer.toBuffer({ resolveWithObject: true });
  } catch {
    return errorResponse(c, 400, ERROR_CODES.VALIDATION_ERROR, "Unable to process image file");
  }

  const { data, info } = output;
  if (!info.width || !info.height) {
    return errorResponse(c, 422, ERROR_CODES.VALIDATION_ERROR, "Unable to read image dimensions");
  }

  const uploadedAt = new Date();
  const imageId = randomUUID();
  const filename = `${imageId}${normalizedType.extension}`;
  const storagePath = `${UPLOAD_DIR}/${IMAGE_SUBDIR}/${filename}`;
  const filePath = join(uploadRoot, filename);

  await Bun.write(filePath, data);

  try {
    db.insert(images)
      .values({
        id: imageId,
        projectId,
        originalFilename,
        storagePath,
        mimeType: normalizedType.mimeType,
        width: info.width,
        height: info.height,
        uploadedAt,
      })
      .run();
  } catch (error) {
    await safeUnlink(filePath);
    throw error;
  }

  return c.json(
    {
      id: imageId,
      originalFilename,
      mimeType: normalizedType.mimeType,
      width: info.width,
      height: info.height,
      url: `/api/images/${imageId}/file`,
      uploadedAt: uploadedAt.toISOString(),
    },
    201
  );
});

// Get image metadata
app.get("/api/images/:id", async (c) => {
  const imageId = c.req.param("id");
  const projectId = c.get("projectId");
  const image = db.select().from(images).where(eq(images.id, imageId)).get();

  if (!image) {
    return errorResponse(c, 404, ERROR_CODES.IMAGE_NOT_FOUND, "Image not found");
  }

  if (image.projectId !== projectId) {
    throw AuthErrors.ACCESS_DENIED();
  }

  return c.json({
    id: imageId,
    projectId: image.projectId,
    originalFilename: image.originalFilename,
    mimeType: image.mimeType,
    width: image.width,
    height: image.height,
    url: `/api/images/${imageId}/file`,
    uploadedAt: image.uploadedAt.toISOString(),
  });
});

// Get image file
app.get("/api/images/:id/file", async (c) => {
  const imageId = c.req.param("id");
  const projectId = c.get("projectId");
  const image = db.select().from(images).where(eq(images.id, imageId)).get();

  if (!image) {
    return errorResponse(c, 404, ERROR_CODES.IMAGE_NOT_FOUND, "Image not found");
  }

  if (image.projectId !== projectId) {
    throw AuthErrors.ACCESS_DENIED();
  }

  const normalizedPath = image.storagePath.startsWith("/")
    ? image.storagePath.slice(1)
    : image.storagePath;
  const file = Bun.file(join(appRoot, normalizedPath));
  if (!(await file.exists())) {
    return errorResponse(c, 404, ERROR_CODES.IMAGE_NOT_FOUND, "Image file not found");
  }

  return c.body(file, 200, {
    "Content-Type": image.mimeType,
  });
});

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
