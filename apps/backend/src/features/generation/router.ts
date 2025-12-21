import { Hono } from "hono";
import { mkdir, stat } from "node:fs/promises";
import { join } from "node:path";
import { fileURLToPath } from "node:url";
import { Buffer } from "node:buffer";
import { and, asc, desc, eq, inArray, sql } from "drizzle-orm";
import { AuthErrors, requireAuth } from "../../auth";
import { db } from "../../db";
import { elements, generationJobs, pages, videos } from "../../db/schema";
import {
  ELEMENT_TYPES,
  ERROR_CODES,
  JOB_STATUS,
  VALIDATION,
  VIDEO_STATUS,
  validateGenerationRequest,
} from "@gazette/shared";
import { errorResponse } from "../shared/http";
import { generationQueue } from "../../queue/queue";
import type { GenerationJobPayload } from "../../queue/jobs/types";
import { getWanTaskStatus, downloadVideo } from "../../lib/wan-client";
import { isSignedRequestValid, signMediaPath, SIGNED_URL_TTL_SECONDS } from "../../lib/signed-urls";

const RAW_UPLOAD_DIR = process.env.UPLOAD_DIR || "uploads";
const UPLOAD_DIR = RAW_UPLOAD_DIR.replace(/^\.\//, "").replace(/\/$/, "");
const VIDEO_SUBDIR = "videos";

const appRoot = fileURLToPath(new URL("../../..", import.meta.url));
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

const parseMetadata = (value: unknown) => {
  if (!value || typeof value !== "string") return null;
  try {
    return JSON.parse(value);
  } catch {
    return null;
  }
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

const enqueueGenerationJob = async (payload: GenerationJobPayload) => {
  await generationQueue.add("generate-video", payload, {
    jobId: payload.jobId,
  });
};

const buildJobResponse = (job: typeof generationJobs.$inferSelect) => ({
  id: job.id,
  elementId: job.elementId,
  imageId: job.imageId,
  prompt: job.prompt,
  status: job.status,
  progress: job.progress,
  videoUrl: signMediaPath(job.videoUrl ?? null),
  error: job.error ?? null,
  metadata: parseMetadata(job.metadata),
  createdAt: toIso(job.createdAt),
  updatedAt: toIso(job.updatedAt),
});

export const generationRouter = new Hono();

generationRouter.use("/projects/:id/generate", requireAuth);
generationRouter.use("/generation/:id", requireAuth);
generationRouter.use("/generation/:id/retry", requireAuth);
generationRouter.use("/jobs/:id", requireAuth);
generationRouter.use("/pages/:id/generate", requireAuth);
generationRouter.use("/projects/:id/generation/status", requireAuth);
generationRouter.use("/projects/:id/videos", requireAuth);
// Note: /videos/:id/file does NOT require auth (like /images/:id/file)
// because <video> elements can't send Authorization headers.
// Security is maintained by unpredictable UUID-based file names.

// Start video generation (page)

generationRouter.post("/pages/:id/generate", async (c) => {
  const pageId = c.req.param("id");
  const authProjectId = c.get("projectId");

  const page = db.select().from(pages).where(eq(pages.id, pageId)).get();
  if (!page) {
    return errorResponse(c, 404, ERROR_CODES.PAGE_NOT_FOUND, "Page not found");
  }
  if (page.projectId !== authProjectId) {
    throw AuthErrors.ACCESS_DENIED();
  }

  const pageElements = db
    .select()
    .from(elements)
    .where(and(eq(elements.pageId, pageId), eq(elements.type, ELEMENT_TYPES.IMAGE)))
    .all();

  const imageElements = pageElements.filter((element) => element.imageId);
  if (!imageElements.length) {
    return errorResponse(c, 400, ERROR_CODES.INVALID_INPUT, "No image elements to generate");
  }

  if (imageElements.length > VALIDATION.MAX_GENERATION_ELEMENTS) {
    return errorResponse(
      c,
      400,
      ERROR_CODES.GENERATION_LIMIT_EXCEEDED,
      "Too many elements to generate"
    );
  }

  const now = sql`(unixepoch())`;
  const jobs = [];

  for (const element of imageElements) {
    const jobId = crypto.randomUUID();
    db.insert(generationJobs)
      .values({
        id: jobId,
        elementId: element.id,
        imageId: element.imageId as string,
        prompt: element.animationPrompt ?? "",
        status: JOB_STATUS.QUEUED,
        progress: 0,
        metadata: null,
        createdAt: now,
        updatedAt: now,
      })
      .run();

    await updateElementVideo(element.id, {
      videoStatus: VIDEO_STATUS.PENDING,
      videoUrl: null,
    });

    try {
      await enqueueGenerationJob({
        type: "generate-video",
        jobId,
        projectId: authProjectId,
        elementId: element.id,
        imageId: element.imageId as string,
        promptOverride: element.animationPrompt ?? null,
      });
    } catch (error) {
      const message = error instanceof Error ? error.message : "Failed to enqueue generation job";
      await updateJob(jobId, {
        status: JOB_STATUS.FAILED,
        progress: 0,
        error: message,
      });
      await updateElementVideo(element.id, { videoStatus: VIDEO_STATUS.FAILED });
    }

    jobs.push({
      id: jobId,
      elementId: element.id,
      status: JOB_STATUS.QUEUED,
    });
  }

  return c.json(
    {
      pageId,
      jobCount: jobs.length,
      estimatedDuration: jobs.length * 60,
      jobs,
    },
    202
  );
});

// Start video generation (explicit prompts)

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
  const jobs = [];

  for (const item of validation.data.elements) {
    const jobId = crypto.randomUUID();
    db.insert(generationJobs)
      .values({
        id: jobId,
        elementId: item.elementId,
        imageId: item.imageId,
        prompt: item.prompt,
        status: JOB_STATUS.QUEUED,
        progress: 0,
        metadata: null,
        createdAt: now,
        updatedAt: now,
      })
      .run();

    await updateElementVideo(item.elementId, {
      videoStatus: VIDEO_STATUS.PENDING,
      animationPrompt: item.prompt,
      videoUrl: null,
    });

    try {
      await enqueueGenerationJob({
        type: "generate-video",
        jobId,
        projectId,
        elementId: item.elementId,
        imageId: item.imageId,
        promptOverride: item.prompt,
      });
    } catch (error) {
      const message = error instanceof Error ? error.message : "Failed to enqueue generation job";
      await updateJob(jobId, {
        status: JOB_STATUS.FAILED,
        progress: 0,
        error: message,
      });
      await updateElementVideo(item.elementId, { videoStatus: VIDEO_STATUS.FAILED });
    }

    jobs.push({
      id: jobId,
      elementId: item.elementId,
      status: JOB_STATUS.QUEUED,
    });
  }

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

  return c.json(buildJobResponse(jobAccess));
});

// Get single generation job status (alias)

generationRouter.get("/jobs/:id", async (c) => {
  const jobId = c.req.param("id");
  const projectId = c.get("projectId");

  const jobAccess = await ensureJobAccess(jobId, projectId);
  if (!jobAccess) {
    return errorResponse(c, 404, ERROR_CODES.NOT_FOUND, "Generation job not found");
  }
  if (jobAccess === "FORBIDDEN") {
    throw AuthErrors.ACCESS_DENIED();
  }

  return c.json(buildJobResponse(jobAccess));
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
      imageId: generationJobs.imageId,
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
    jobs: jobs.map((job) => ({
      ...job,
      videoUrl: signMediaPath(job.videoUrl ?? null),
    })),
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

// Retry a failed job

generationRouter.post("/generation/:id/retry", async (c) => {
  const jobId = c.req.param("id");
  const projectId = c.get("projectId");

  const jobAccess = await ensureJobAccess(jobId, projectId);
  if (!jobAccess) {
    return errorResponse(c, 404, ERROR_CODES.NOT_FOUND, "Generation job not found");
  }
  if (jobAccess === "FORBIDDEN") {
    throw AuthErrors.ACCESS_DENIED();
  }

  if (jobAccess.status !== JOB_STATUS.FAILED) {
    return errorResponse(c, 400, ERROR_CODES.INVALID_INPUT, "Only failed jobs can be retried");
  }

  // If we have a WAN task ID, check if the external task actually succeeded
  // (it may have been marked failed locally due to timeout but succeeded externally)
  if (jobAccess.wanTaskId) {
    try {
      const externalStatus = await getWanTaskStatus(jobAccess.wanTaskId);

      if (externalStatus.status === "SUCCEEDED" && externalStatus.videoUrl) {
        // The task actually succeeded! Recover the video instead of retrying
        const videoFilename = `${jobId}.mp4`;
        const filePath = join(videoRoot, videoFilename);

        await downloadVideo(externalStatus.videoUrl, filePath);

        // Update the job as complete
        updateJob(jobId, {
          status: JOB_STATUS.COMPLETE,
          progress: 100,
          videoUrl: `/api/videos/${jobId}/file`,
          error: null,
        });

        // Update the element
        await updateElementVideo(jobAccess.elementId, {
          videoStatus: VIDEO_STATUS.COMPLETE,
          videoUrl: `/api/videos/${jobId}/file`,
        });

        // Create video record if it doesn't exist
        const existingVideo = db
          .select()
          .from(videos)
          .where(eq(videos.generationJobId, jobId))
          .get();
        if (!existingVideo) {
          db.insert(videos)
            .values({
              id: crypto.randomUUID(),
              projectId,
              generationJobId: jobId,
              sourceImageId: jobAccess.imageId,
              filename: `generated-${jobId}.mp4`,
              storagePath: `${UPLOAD_DIR}/${VIDEO_SUBDIR}/${videoFilename}`,
              mimeType: "video/mp4",
            })
            .run();
        }

        return c.json(
          {
            id: jobId,
            elementId: jobAccess.elementId,
            status: JOB_STATUS.COMPLETE,
            recovered: true,
            message: "Video recovered from external API - generation had actually succeeded",
          },
          200
        );
      }

      // If still pending/running externally, don't create a duplicate
      if (externalStatus.status === "PENDING" || externalStatus.status === "RUNNING") {
        return c.json(
          {
            id: jobId,
            elementId: jobAccess.elementId,
            status: JOB_STATUS.PROCESSING,
            message: "External task is still processing - please wait",
          },
          200
        );
      }
    } catch {
      // External check failed - proceed with creating a new job
    }
  }

  const now = sql`(unixepoch())`;
  const newJobId = crypto.randomUUID();

  // Create a new job based on the failed one
  db.insert(generationJobs)
    .values({
      id: newJobId,
      elementId: jobAccess.elementId,
      imageId: jobAccess.imageId,
      prompt: jobAccess.prompt,
      status: JOB_STATUS.QUEUED,
      progress: 0,
      metadata: null,
      createdAt: now,
      updatedAt: now,
    })
    .run();

  await updateElementVideo(jobAccess.elementId, {
    videoStatus: VIDEO_STATUS.PENDING,
    videoUrl: null,
  });

  try {
    await enqueueGenerationJob({
      type: "generate-video",
      jobId: newJobId,
      projectId,
      elementId: jobAccess.elementId,
      imageId: jobAccess.imageId,
      promptOverride: jobAccess.prompt || null,
    });

    // Delete the old failed job now that the new one is queued
    db.delete(generationJobs).where(eq(generationJobs.id, jobId)).run();
  } catch (error) {
    const message = error instanceof Error ? error.message : "Failed to enqueue generation job";
    await updateJob(newJobId, {
      status: JOB_STATUS.FAILED,
      progress: 0,
      error: message,
    });
    await updateElementVideo(jobAccess.elementId, { videoStatus: VIDEO_STATUS.FAILED });
  }

  return c.json(
    {
      id: newJobId,
      elementId: jobAccess.elementId,
      status: JOB_STATUS.QUEUED,
      retriedFrom: jobId,
    },
    201
  );
});

// Serve video files (no auth - UUID provides security through obscurity)
// Handles both generated videos (by job ID) and uploaded videos (by video ID)

generationRouter.get("/videos/:id/file", async (c) => {
  const exp = c.req.query("exp");
  const sig = c.req.query("sig");
  if (!isSignedRequestValid(c.req.path, exp, sig)) {
    return errorResponse(c, 403, ERROR_CODES.UNAUTHORIZED, "Invalid or expired video URL");
  }

  const id = c.req.param("id");

  // Validate ID format (UUID) to prevent path traversal
  const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
  if (!uuidRegex.test(id)) {
    return errorResponse(c, 400, ERROR_CODES.INVALID_INPUT, "Invalid video ID format");
  }

  // First try as job ID (generated video - stored as {jobId}.mp4)
  const generatedVideoPath = join(videoRoot, `${id}.mp4`);
  const generatedFile = Bun.file(generatedVideoPath);
  if (await generatedFile.exists()) {
    return c.body(generatedFile.stream(), 200, {
      "Content-Type": "video/mp4",
      "Cache-Control": `private, max-age=${SIGNED_URL_TTL_SECONDS}`,
    });
  }

  // Then try as video ID (uploaded video - look up in database)
  const video = db.select().from(videos).where(eq(videos.id, id)).get();
  if (video) {
    const normalizedPath = video.storagePath.startsWith("/")
      ? video.storagePath.slice(1)
      : video.storagePath;
    const uploadedFilePath = join(appRoot, normalizedPath);
    const uploadedFile = Bun.file(uploadedFilePath);

    if (await uploadedFile.exists()) {
      return c.body(uploadedFile.stream(), 200, {
        "Content-Type": video.mimeType,
        "Cache-Control": `private, max-age=${SIGNED_URL_TTL_SECONDS}`,
      });
    }
  }

  return errorResponse(c, 404, ERROR_CODES.NOT_FOUND, "Video file not found");
});

// List all videos in a project (for media library)

generationRouter.get("/projects/:id/videos", async (c) => {
  const projectId = c.req.param("id");
  const authProjectId = c.get("projectId");

  if (projectId !== authProjectId) {
    throw AuthErrors.ACCESS_DENIED();
  }

  const projectVideos = db
    .select()
    .from(videos)
    .where(eq(videos.projectId, projectId))
    .orderBy(desc(videos.createdAt))
    .all();

  return c.json({
    videos: projectVideos.map((video) => ({
      id: video.id,
      projectId: video.projectId,
      generationJobId: video.generationJobId,
      sourceImageId: video.sourceImageId,
      filename: video.filename,
      storagePath: video.storagePath,
      mimeType: video.mimeType,
      width: video.width,
      height: video.height,
      durationSeconds: video.durationSeconds,
      fileSize: video.fileSize,
      createdAt:
        video.createdAt instanceof Date
          ? video.createdAt.toISOString()
          : new Date((video.createdAt as number) * 1000).toISOString(),
      // URL for playback - uses video ID for uploaded videos, or job ID for generated ones
      url: signMediaPath(`/api/videos/${video.generationJobId || video.id}/file`),
    })),
  });
});

// Upload a video file

const MAX_VIDEO_UPLOAD_BYTES = 100 * 1024 * 1024; // 100MB
const ALLOWED_VIDEO_MIME_TYPES = new Set(["video/mp4", "video/webm", "video/quicktime"]);

generationRouter.post("/projects/:id/videos", async (c) => {
  const projectId = c.req.param("id");
  const authProjectId = c.get("projectId");

  if (projectId !== authProjectId) {
    throw AuthErrors.ACCESS_DENIED();
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

  const body = await c.req.parseBody();
  const file = body.video || body.file || body.upload;

  if (!file || !(file instanceof File)) {
    return errorResponse(c, 400, ERROR_CODES.VALIDATION_ERROR, "No video file provided");
  }

  if (file.size > MAX_VIDEO_UPLOAD_BYTES) {
    return errorResponse(c, 413, ERROR_CODES.VALIDATION_ERROR, "File too large (max 100MB)");
  }

  // Check mime type
  const mimeType = file.type || "video/mp4";
  if (!ALLOWED_VIDEO_MIME_TYPES.has(mimeType)) {
    return errorResponse(
      c,
      400,
      ERROR_CODES.VALIDATION_ERROR,
      "Invalid file type (only MP4, WebM, MOV allowed)"
    );
  }

  const videoId = crypto.randomUUID();
  const originalFilename = file.name || "upload.mp4";
  const extension =
    mimeType === "video/webm" ? ".webm" : mimeType === "video/quicktime" ? ".mov" : ".mp4";
  const filename = `${videoId}${extension}`;
  const storagePath = `${UPLOAD_DIR}/${VIDEO_SUBDIR}/${filename}`;
  const filePath = join(videoRoot, filename);

  // Write the file
  const buffer = Buffer.from(await file.arrayBuffer());
  await Bun.write(filePath, buffer);

  // Get file size
  let fileSize: number | null = null;
  try {
    const stats = await stat(filePath);
    fileSize = stats.size;
  } catch {
    // Ignore - fileSize will be null
  }

  // Insert video record
  db.insert(videos)
    .values({
      id: videoId,
      projectId,
      generationJobId: null,
      sourceImageId: null,
      filename: originalFilename,
      storagePath,
      mimeType,
      fileSize,
    })
    .run();

  return c.json(
    {
      id: videoId,
      projectId,
      filename: originalFilename,
      mimeType,
      fileSize,
      url: signMediaPath(`/api/videos/${videoId}/file`),
      createdAt: new Date().toISOString(),
    },
    201
  );
});
