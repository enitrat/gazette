import type { Context } from "hono";
import { Hono } from "hono";
import { z } from "zod";
import { zValidator } from "@hono/zod-validator";
import { and, eq, inArray } from "drizzle-orm";
import { DEFAULTS, ELEMENT_TYPES, ERROR_CODES, VALIDATION } from "@gazette/shared";
import { db, schema } from "../../db";
import { getProjectById, getProjectBySlug } from "../../projects";
import { requireViewAuth } from "../../auth";
import { signViewToken, VIEW_JWT_EXPIRES_IN } from "../../auth/jwt";
import { errorResponse } from "../shared/http";
import { join } from "node:path";
import { fileURLToPath } from "node:url";

const appRoot = fileURLToPath(new URL("../../..", import.meta.url));

const router = new Hono();

const accessSchema = z.object({
  password: z
    .string()
    .min(VALIDATION.PASSWORD_MIN, "Password must be at least 4 characters")
    .max(VALIDATION.PASSWORD_MAX, "Password must be 50 characters or less"),
});

const handleValidationError = (result: unknown, c: Context) => {
  if (
    typeof result === "object" &&
    result !== null &&
    "success" in result &&
    !(result as { success: boolean }).success
  ) {
    const error = (result as { error?: unknown }).error;
    const details =
      error &&
      typeof error === "object" &&
      "flatten" in error &&
      typeof (error as { flatten?: () => unknown }).flatten === "function"
        ? (error as { flatten: () => unknown }).flatten()
        : undefined;
    return c.json(
      {
        error: {
          code: ERROR_CODES.VALIDATION_ERROR,
          message: "Invalid input",
          details,
        },
      },
      400
    );
  }
  return undefined;
};

const toIsoTimestamp = (value: Date | number | null | undefined): string | null => {
  if (!value) return null;
  if (value instanceof Date) return value.toISOString();
  const millis = value > 1_000_000_000_000 ? value : value * 1000;
  return new Date(millis).toISOString();
};

const getPublicBaseUrl = (): string => {
  const raw = process.env.PUBLIC_APP_URL || process.env.APP_URL || process.env.CORS_ORIGIN || "";
  const first = raw.split(",")[0]?.trim() ?? "";
  return first.replace(/\/$/, "");
};

const buildShareUrl = (slug: string) => {
  const base = getPublicBaseUrl();
  if (!base) {
    return `/view/${slug}`;
  }
  return `${base}/view/${slug}`;
};

const serializeElement = (record: typeof schema.elements.$inferSelect, slug: string) => {
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
    const imageUrl = record.imageId ? `/api/view/${slug}/images/${record.imageId}` : null;

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
    };
  }

  // Parse style JSON if present
  let style = null;
  if (record.style) {
    try {
      style = JSON.parse(record.style);
    } catch {
      // Ignore invalid JSON
    }
  }

  return {
    id: record.id,
    pageId: record.pageId,
    type: record.type,
    position,
    content: record.content ?? "",
    style,
  };
};

const buildViewResponse = async (projectId: string) => {
  const project = await getProjectById(projectId);
  if (!project) {
    return null;
  }

  const pages = await db
    .select({
      id: schema.pages.id,
      order: schema.pages.order,
      templateId: schema.pages.templateId,
      title: schema.pages.title,
      subtitle: schema.pages.subtitle,
    })
    .from(schema.pages)
    .where(eq(schema.pages.projectId, projectId))
    .orderBy(schema.pages.order);

  const pageIds = pages.map((page) => page.id);
  const elements =
    pageIds.length > 0
      ? await db
          .select()
          .from(schema.elements)
          .where(inArray(schema.elements.pageId, pageIds))
          .orderBy(schema.elements.createdAt)
      : [];

  const elementsByPage = new Map<string, ReturnType<typeof serializeElement>[]>();
  for (const element of elements) {
    const list = elementsByPage.get(element.pageId) ?? [];
    list.push(serializeElement(element, project.slug));
    elementsByPage.set(element.pageId, list);
  }

  return {
    project: {
      id: project.id,
      name: project.name,
      slug: project.slug,
      shareUrl: buildShareUrl(project.slug),
      createdAt: toIsoTimestamp(project.createdAt),
    },
    pages: pages.map((page) => ({
      ...page,
      title: page.title ?? "",
      subtitle: page.subtitle ?? "",
      elements: elementsByPage.get(page.id) ?? [],
    })),
  };
};

router.post(
  "/view/:slug/access",
  zValidator("json", accessSchema, handleValidationError),
  async (c) => {
    const slug = c.req.param("slug");
    const { password } = c.req.valid("json");

    const project = await getProjectBySlug(slug);
    if (!project) {
      return errorResponse(c, 404, ERROR_CODES.PROJECT_NOT_FOUND, "Project not found");
    }

    const valid = await Bun.password.verify(password, project.passwordHash);
    if (!valid) {
      return errorResponse(c, 401, ERROR_CODES.INVALID_CREDENTIALS, "Invalid password");
    }

    const viewToken = await signViewToken(project.id, project.slug);
    return c.json({
      viewToken,
      expiresIn: VIEW_JWT_EXPIRES_IN,
    });
  }
);

router.get("/view/:slug", requireViewAuth, async (c) => {
  const projectId = c.get("projectId");
  const payload = await buildViewResponse(projectId);
  if (!payload) {
    return errorResponse(c, 404, ERROR_CODES.PROJECT_NOT_FOUND, "Project not found");
  }

  return c.json(payload);
});

router.get("/projects/:id/view", requireViewAuth, async (c) => {
  const projectId = c.req.param("id");
  const payload = await buildViewResponse(projectId);
  if (!payload) {
    return errorResponse(c, 404, ERROR_CODES.PROJECT_NOT_FOUND, "Project not found");
  }

  return c.json(payload);
});

// Public image endpoint - validates via slug instead of JWT
// This allows <img src> to work without Authorization header
router.get("/view/:slug/images/:id", async (c) => {
  const slug = c.req.param("slug");
  const imageId = c.req.param("id");

  // Validate the project exists with this slug
  const project = await getProjectBySlug(slug);
  if (!project) {
    return errorResponse(c, 404, ERROR_CODES.PROJECT_NOT_FOUND, "Project not found");
  }

  // Validate the image belongs to this project
  const image = await db
    .select()
    .from(schema.images)
    .where(and(eq(schema.images.id, imageId), eq(schema.images.projectId, project.id)))
    .get();

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

  return c.body(file.stream(), 200, {
    "Content-Type": image.mimeType,
    "Cache-Control": "public, max-age=31536000", // Cache for 1 year since images don't change
  });
});

export { router as viewRouter };
