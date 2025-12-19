import { Hono } from "hono";
import { mkdir } from "node:fs/promises";
import { join } from "node:path";
import { fileURLToPath } from "node:url";
import { asc, eq, inArray, sql } from "drizzle-orm";
import { AuthErrors, requireAuth } from "../../auth";
import { db } from "../../db";
import { elements, generationJobs, images, pages } from "../../db/schema";
import {
  ELEMENT_TYPES,
  ERROR_CODES,
  JOB_STATUS,
  VIDEO_STATUS,
  validateGenerationRequest,
} from "@gazette/shared";
import { errorResponse } from "../shared/http";
import { downloadVideo, generateVideo } from "../../lib/wan-client";

const RAW_UPLOAD_DIR = process.env.UPLOAD_DIR || "uploads";
const UPLOAD_DIR = RAW_UPLOAD_DIR.replace(/^\.\//, "").replace(/\/$/, "");
const VIDEO_SUBDIR = "videos";
const WAN_PUBLIC_BASE_URL = process.env.WAN_PUBLIC_BASE_URL || "";
const WAN_IMAGE_TOKEN = process.env.WAN_IMAGE_TOKEN || "";

const appRoot = fileURLToPath(new URL("../..", import.meta.url));
const videoRoot = join(appRoot, UPLOAD_DIR, VIDEO_SUBDIR);
await mkdir(videoRoot, { recursive: true });

const toIso = (value: unknown) => {
  if (value instanceof Date) return value.toISOString();
  if (typeof value === "number") {
    const ms = value < 1_000_000_000_000 ? value * 1000 : value;
    return new Date(ms).toISOString();
  }
  return new Date(String(value)).toISOString();
};

const normalizePath = (value: string) => (value.startsWith("/") ? value.slice(1) : value);

const buildPublicImageUrl = (imageId: string) => {
  if (!WAN_PUBLIC_BASE_URL || !WAN_IMAGE_TOKEN) return null;
  const base = WAN_PUBLIC_BASE_URL.replace(/\/$/, "");
  return `${base}/api/images/${imageId}/public?token=${encodeURIComponent(WAN_IMAGE_TOKEN)}`;
};

const ensureJobAccess = async (jobId: string, projectId: string) => {
  const record = db
    .select({
      job: generationJobs,
      projectId: pages.projectId,
      elementId: elements.id,
    })
    .from(generationJobs)
    .innerJoin(elements, eq(generationJobs.elementId, elements.id))
    .innerJoin(pages, eq(elements.pageId, pages.id))
    .where(eq(generationJobs.id, jobId))
    .get();

  if (!record) return null;
  if (record.projectId !== projectId) return "FORBIDDEN" as const;
  return record.job;
};

const updateJob = (jobId: string, values: Partial<typeof generationJobs.$inferInsert>) =>
  db
    .update(generationJobs)
    .set({
      ...values,
      updatedAt: sql`(unixepoch())`,
    })
    .where(eq(generationJobs.id, jobId))
    .run();

const updateElementVideo = (elementId: string, values: Partial<typeof elements.$inferInsert>) =>
  db
    .update(elements)
    .set({
      ...values,
      updatedAt: sql`(unixepoch())`,
    })
    .where(eq(elements.id, elementId))
    .run();

const processGenerationJob = async (jobId: string) => {
  const job = db.select().from(generationJobs).where(eq(generationJobs.id, jobId)).get();
  if (!job) return;

  if (job.status !== JOB_STATUS.QUEUED && job.status !== JOB_STATUS.PROCESSING) {
    return;
  }

  await updateJob(jobId, { status: JOB_STATUS.PROCESSING, progress: 5 });
  await updateElementVideo(job.elementId, { videoStatus: VIDEO_STATUS.PROCESSING });

  try {
    const image = db.select().from(images).where(eq(images.id, job.imageId)).get();
    if (!image) {
      throw new Error("Image not found for generation job");
    }

    const imagePath = join(appRoot, normalizePath(image.storagePath));
    const imageUrl = buildPublicImageUrl(image.id);

    const result = await generateVideo({
      prompt: job.prompt,
      imageUrl: imageUrl ?? undefined,
      imagePath: imageUrl ? undefined : imagePath,
      imageMimeType: image.mimeType,
      promptExtend: true,
      durationSeconds: 5,
      resolution: "720p",
    });

    const videoFilename = `${jobId}.mp4`;
    const filePath = join(videoRoot, videoFilename);

    await downloadVideo(result.videoUrl ?? "", filePath);

    await updateJob(jobId, {
      status: JOB_STATUS.COMPLETE,
      progress: 100,
      videoUrl: `/api/videos/${jobId}/file`,
      error: null,
    });

    await updateElementVideo(job.elementId, {
      videoStatus: VIDEO_STATUS.COMPLETE,
      videoUrl: `/api/videos/${jobId}/file`,
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Video generation failed";
    await updateJob(jobId, {
      status: JOB_STATUS.FAILED,
      progress: 0,
      error: message,
    });

    await updateElementVideo(job.elementId, {
      videoStatus: VIDEO_STATUS.FAILED,
    });
  }
};

export const generationRouter = new Hono();

generationRouter.use("/projects/:id/generate", requireAuth);
generationRouter.use("/generation/:id", requireAuth);
generationRouter.use("/projects/:id/generation/status", requireAuth);
generationRouter.use("/videos/:id/file", requireAuth);

// Start video generation

generationRouter.post("/projects/:id/generate", async (c) => {
  const projectId = c.req.param("id");
  const authProjectId = c.get("projectId");

  if (projectId !== authProjectId) {
    throw AuthErrors.ACCESS_DENIED();
  }

  const body = await c.req.json();
  const validation = validateGenerationRequest(body);

  if (!validation.success) {
    return errorResponse(
      c,
      400,
      ERROR_CODES.VALIDATION_ERROR,
      "Invalid generation payload",
      validation.error.flatten()
    );
  }

  const elementIds = validation.data.elements.map((item) => item.elementId);
  const elementRecords = db
    .select({
      element: elements,
      pageProjectId: pages.projectId,
    })
    .from(elements)
    .innerJoin(pages, eq(elements.pageId, pages.id))
    .where(inArray(elements.id, elementIds))
    .all();

  if (elementRecords.length !== elementIds.length) {
    return errorResponse(c, 404, ERROR_CODES.ELEMENT_NOT_FOUND, "Element not found");
  }

  const invalidElement = elementRecords.find((record) => record.pageProjectId !== projectId);
  if (invalidElement) {
    throw AuthErrors.ACCESS_DENIED();
  }

  const invalidType = elementRecords.find((record) => record.element.type !== ELEMENT_TYPES.IMAGE);
  if (invalidType) {
    return errorResponse(
      c,
      400,
      ERROR_CODES.VALIDATION_ERROR,
      "Only image elements can be generated"
    );
  }

  const elementMap = new Map(elementRecords.map((record) => [record.element.id, record.element]));
  const mismatch = validation.data.elements.find((item) => {
    const element = elementMap.get(item.elementId);
    return !element || !element.imageId || element.imageId !== item.imageId;
  });

  if (mismatch) {
    return errorResponse(c, 400, ERROR_CODES.VALIDATION_ERROR, "Element image mismatch");
  }

  const now = sql`(unixepoch())`;
  const jobs = validation.data.elements.map((item) => {
    const jobId = crypto.randomUUID();
    db.insert(generationJobs)
      .values({
        id: jobId,
        elementId: item.elementId,
        imageId: item.imageId,
        prompt: item.prompt,
        status: JOB_STATUS.QUEUED,
        progress: 0,
        createdAt: now,
        updatedAt: now,
      })
      .run();

    updateElementVideo(item.elementId, {
      videoStatus: VIDEO_STATUS.PENDING,
      animationPrompt: item.prompt,
    });

    queueMicrotask(() => {
      void processGenerationJob(jobId);
    });

    return {
      id: jobId,
      elementId: item.elementId,
      status: JOB_STATUS.QUEUED,
    };
  });

  return c.json(
    {
      projectId,
      jobCount: jobs.length,
      estimatedDuration: jobs.length * 60,
      jobs,
    },
    202
  );
});

// Get single generation job status

generationRouter.get("/generation/:id", async (c) => {
  const jobId = c.req.param("id");
  const projectId = c.get("projectId");

  const jobAccess = await ensureJobAccess(jobId, projectId);
  if (!jobAccess) {
    return errorResponse(c, 404, ERROR_CODES.NOT_FOUND, "Generation job not found");
  }
  if (jobAccess === "FORBIDDEN") {
    throw AuthErrors.ACCESS_DENIED();
  }

  return c.json({
    id: jobAccess.id,
    elementId: jobAccess.elementId,
    imageId: jobAccess.imageId,
    prompt: jobAccess.prompt,
    status: jobAccess.status,
    progress: jobAccess.progress,
    videoUrl: jobAccess.videoUrl ?? null,
    error: jobAccess.error ?? null,
    createdAt: toIso(jobAccess.createdAt),
    updatedAt: toIso(jobAccess.updatedAt),
  });
});

// Get project-wide generation status

generationRouter.get("/projects/:id/generation/status", async (c) => {
  const projectId = c.req.param("id");
  const authProjectId = c.get("projectId");

  if (projectId !== authProjectId) {
    throw AuthErrors.ACCESS_DENIED();
  }

  const jobs = db
    .select({
      id: generationJobs.id,
      elementId: generationJobs.elementId,
      status: generationJobs.status,
      progress: generationJobs.progress,
      videoUrl: generationJobs.videoUrl,
      error: generationJobs.error,
    })
    .from(generationJobs)
    .innerJoin(elements, eq(generationJobs.elementId, elements.id))
    .innerJoin(pages, eq(elements.pageId, pages.id))
    .where(eq(pages.projectId, projectId))
    .orderBy(asc(generationJobs.createdAt))
    .all();

  const summary = jobs.reduce(
    (acc, job) => {
      switch (job.status) {
        case JOB_STATUS.COMPLETE:
          acc.completed += 1;
          break;
        case JOB_STATUS.PROCESSING:
          acc.processing += 1;
          break;
        case JOB_STATUS.QUEUED:
          acc.queued += 1;
          break;
        case JOB_STATUS.FAILED:
          acc.failed += 1;
          break;
        default:
          break;
      }
      return acc;
    },
    { completed: 0, processing: 0, queued: 0, failed: 0 }
  );

  return c.json({
    projectId,
    totalJobs: jobs.length,
    ...summary,
    jobs,
  });
});

// Cancel a queued job

generationRouter.delete("/generation/:id", async (c) => {
  const jobId = c.req.param("id");
  const projectId = c.get("projectId");

  const jobAccess = await ensureJobAccess(jobId, projectId);
  if (!jobAccess) {
    return errorResponse(c, 404, ERROR_CODES.NOT_FOUND, "Generation job not found");
  }
  if (jobAccess === "FORBIDDEN") {
    throw AuthErrors.ACCESS_DENIED();
  }

  if (jobAccess.status !== JOB_STATUS.QUEUED) {
    return errorResponse(c, 400, ERROR_CODES.INVALID_INPUT, "Only queued jobs can be cancelled");
  }

  await updateJob(jobId, {
    status: JOB_STATUS.FAILED,
    progress: 0,
    error: "Job cancelled",
  });

  await updateElementVideo(jobAccess.elementId, { videoStatus: VIDEO_STATUS.FAILED });

  return c.body(null, 204);
});

// Serve generated video files

generationRouter.get("/videos/:id/file", async (c) => {
  const jobId = c.req.param("id");
  const projectId = c.get("projectId");

  const jobAccess = await ensureJobAccess(jobId, projectId);
  if (!jobAccess) {
    return errorResponse(c, 404, ERROR_CODES.NOT_FOUND, "Video not found");
  }
  if (jobAccess === "FORBIDDEN") {
    throw AuthErrors.ACCESS_DENIED();
  }

  const videoPath = join(videoRoot, `${jobId}.mp4`);
  const file = Bun.file(videoPath);
  if (!(await file.exists())) {
    return errorResponse(c, 404, ERROR_CODES.NOT_FOUND, "Video file not found");
  }

  return c.body(file.stream(), 200, {
    "Content-Type": "video/mp4",
  });
});
