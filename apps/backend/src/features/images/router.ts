import { Hono } from "hono";
import { Buffer } from "node:buffer";
import { randomUUID } from "node:crypto";
import { mkdir, unlink } from "node:fs/promises";
import { extname, join } from "node:path";
import { fileURLToPath } from "node:url";
import sharp, { type OutputInfo } from "sharp";
import { eq, desc } from "drizzle-orm";
import { AuthErrors } from "../../auth";
import { requireAuth } from "../../auth/middleware";
import { db } from "../../db";
import { images, projects } from "../../db/schema";
import { ERROR_CODES, IMAGE_CONSTRAINTS } from "@gazette/shared";
import { errorResponse } from "../shared/http";
import { analyzeImage } from "../../lib/gemini-client";

const RAW_UPLOAD_DIR = process.env.UPLOAD_DIR || "uploads";
const UPLOAD_DIR = RAW_UPLOAD_DIR.replace(/^\.\//, "").replace(/\/$/, "");
const IMAGE_SUBDIR = "images";
const WAN_IMAGE_TOKEN = process.env.WAN_IMAGE_TOKEN || "";
const MAX_IMAGE_WIDTH = 2048;
const MAX_UPLOAD_BYTES = IMAGE_CONSTRAINTS.MAX_FILE_SIZE;
type SupportedMimeType = (typeof IMAGE_CONSTRAINTS.SUPPORTED_MIME_TYPES)[number];

const ALLOWED_MIME_TYPES = new Set<SupportedMimeType>(IMAGE_CONSTRAINTS.SUPPORTED_MIME_TYPES);
const MIME_BY_EXTENSION: Partial<Record<string, SupportedMimeType>> = {
  ".jpg": "image/jpeg",
  ".jpeg": "image/jpeg",
  ".png": "image/png",
  ".webp": "image/webp",
};
const EXTENSION_BY_MIME: Record<SupportedMimeType, string> = {
  "image/jpeg": ".jpg",
  "image/png": ".png",
  "image/webp": ".webp",
};

const appRoot = fileURLToPath(new URL("../../..", import.meta.url));
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

const isSupportedMimeType = (value: string): value is SupportedMimeType =>
  ALLOWED_MIME_TYPES.has(value as SupportedMimeType);

const normalizeImageType = (name: string, mimeType: string) => {
  const extension = extname(name).toLowerCase();
  const normalizedExtension = MIME_BY_EXTENSION[extension] ? extension : "";
  const normalizedMimeType = isSupportedMimeType(mimeType)
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

const imageResponseHeaders = (mimeType: string) => ({
  "Content-Type": mimeType,
  "Cross-Origin-Resource-Policy": "cross-origin",
});

export const imagesRouter = new Hono();

imagesRouter.use("/projects/:id/images", requireAuth);
imagesRouter.use("/images/:id/analyze", requireAuth);
imagesRouter.use("/images/:id/analyze", requireAuth);

// List all images in a project
imagesRouter.get("/projects/:id/images", async (c) => {
  const projectId = c.req.param("id");
  const authProjectId = c.get("projectId");

  if (projectId !== authProjectId) {
    throw AuthErrors.ACCESS_DENIED();
  }

  const projectImages = db
    .select()
    .from(images)
    .where(eq(images.projectId, projectId))
    .orderBy(desc(images.uploadedAt))
    .all();

  return c.json({
    images: projectImages.map((img) => ({
      id: img.id,
      projectId: img.projectId,
      originalFilename: img.originalFilename,
      storagePath: img.storagePath,
      mimeType: img.mimeType,
      width: img.width,
      height: img.height,
      uploadedAt: img.uploadedAt.toISOString(),
    })),
  });
});

// Upload an image
imagesRouter.post("/projects/:id/images", async (c) => {
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
imagesRouter.get("/images/:id", requireAuth, async (c) => {
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

// Public image file access for WAN (token-protected)
imagesRouter.get("/images/:id/public", async (c) => {
  if (!WAN_IMAGE_TOKEN) {
    return errorResponse(c, 403, ERROR_CODES.UNAUTHORIZED, "Public image access is disabled");
  }

  const token = c.req.query("token");
  if (!token || token !== WAN_IMAGE_TOKEN) {
    return errorResponse(c, 403, ERROR_CODES.UNAUTHORIZED, "Invalid image access token");
  }

  const imageId = c.req.param("id");
  const image = db.select().from(images).where(eq(images.id, imageId)).get();

  if (!image) {
    return errorResponse(c, 404, ERROR_CODES.IMAGE_NOT_FOUND, "Image not found");
  }

  const normalizedPath = image.storagePath.startsWith("/")
    ? image.storagePath.slice(1)
    : image.storagePath;
  const file = Bun.file(join(appRoot, normalizedPath));
  if (!(await file.exists())) {
    return errorResponse(c, 404, ERROR_CODES.IMAGE_NOT_FOUND, "Image file not found");
  }

  return c.body(file.stream(), 200, imageResponseHeaders(image.mimeType));
});

// Get image file (no auth required - image IDs are UUIDs and not guessable)
imagesRouter.get("/images/:id/file", async (c) => {
  const imageId = c.req.param("id");
  const image = db.select().from(images).where(eq(images.id, imageId)).get();

  if (!image) {
    return errorResponse(c, 404, ERROR_CODES.IMAGE_NOT_FOUND, "Image not found");
  }

  const normalizedPath = image.storagePath.startsWith("/")
    ? image.storagePath.slice(1)
    : image.storagePath;
  const file = Bun.file(join(appRoot, normalizedPath));
  if (!(await file.exists())) {
    return errorResponse(c, 404, ERROR_CODES.IMAGE_NOT_FOUND, "Image file not found");
  }

  return c.body(file.stream(), 200, imageResponseHeaders(image.mimeType));
});

// Analyze image for animation suggestions
imagesRouter.post("/images/:id/analyze", async (c) => {
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
  const filePath = join(appRoot, normalizedPath);
  const file = Bun.file(filePath);
  if (!(await file.exists())) {
    return errorResponse(c, 404, ERROR_CODES.IMAGE_NOT_FOUND, "Image file not found");
  }

  const imageData = Buffer.from(await file.arrayBuffer());
  const analysis = await analyzeImage({
    imageId,
    mimeType: image.mimeType,
    imageData,
  });

  return c.json(analysis);
});
