import { type Job, Worker } from "bullmq";
import { stat } from "node:fs/promises";
import { isAbsolute, join } from "node:path";
import { fileURLToPath } from "node:url";
import { eq, sql } from "drizzle-orm";
import { db, schema } from "../db";
import { createRedisConnection } from "./connection";
import { GENERATION_QUEUE_NAME } from "./queue";
import { analyzeImageJob } from "./jobs/analyze-image";
import { generateVideoJob } from "./jobs/generate-video";
import { recoverPendingWanTasks } from "./jobs/recover-wan-tasks";
import type { GenerationJobPayload } from "./jobs/types";
import { createLogger } from "../lib/logger";

const RAW_UPLOAD_DIR = process.env.UPLOAD_DIR || "uploads";
const UPLOAD_DIR = RAW_UPLOAD_DIR.replace(/^\.\//, "").replace(/\/$/, "");
const VIDEO_SUBDIR = "videos";
const appRoot = fileURLToPath(new URL("../..", import.meta.url));
const videoRoot = isAbsolute(UPLOAD_DIR)
  ? join(UPLOAD_DIR, VIDEO_SUBDIR)
  : join(appRoot, UPLOAD_DIR, VIDEO_SUBDIR);

const log = createLogger("queue-worker");

// Debug: Log environment variables at worker startup
log.info(
  {
    wanApiKey: process.env.WAN_API_KEY ? `${process.env.WAN_API_KEY.slice(0, 8)}...` : "NOT SET",
    geminiApiKey: process.env.GEMINI_API_KEY
      ? `${process.env.GEMINI_API_KEY.slice(0, 8)}...`
      : "NOT SET",
    redisUrl: process.env.REDIS_URL || "default",
  },
  "Environment check"
);

const connection = createRedisConnection();

const updateJobStatus = async (
  jobId: string,
  updates: Partial<{
    status: string;
    progress: number;
    videoUrl: string | null;
    error: string | null;
    prompt: string;
    metadata: string | null;
  }>
) => {
  await db
    .update(schema.generationJobs)
    .set({
      ...updates,
      updatedAt: sql`(unixepoch())`,
    })
    .where(eq(schema.generationJobs.id, jobId))
    .run();
};

const updateElementVideoStatus = async (
  elementId: string,
  updates: Partial<{ videoStatus: string; videoUrl: string | null; animationPrompt: string | null }>
) => {
  await db
    .update(schema.elements)
    .set({
      ...updates,
      updatedAt: sql`(unixepoch())`,
    })
    .where(eq(schema.elements.id, elementId))
    .run();
};

const createVideoRecord = async (params: {
  jobId: string;
  projectId: string;
  imageId: string;
  durationSeconds?: number;
}) => {
  const existing = db
    .select({ id: schema.videos.id })
    .from(schema.videos)
    .where(eq(schema.videos.generationJobId, params.jobId))
    .get();
  if (existing?.id) {
    log.info({ jobId: params.jobId, videoId: existing.id }, "Video record already exists");
    return existing.id;
  }

  const videoId = crypto.randomUUID();
  const filename = `${params.jobId}.mp4`;
  const storagePath = `${UPLOAD_DIR}/${VIDEO_SUBDIR}/${filename}`;
  const filePath = join(videoRoot, filename);

  // Get file size
  let fileSize: number | null = null;
  try {
    const stats = await stat(filePath);
    fileSize = stats.size;
  } catch {
    log.warn({ filePath }, "Could not get video file size");
  }

  db.insert(schema.videos)
    .values({
      id: videoId,
      projectId: params.projectId,
      generationJobId: params.jobId,
      sourceImageId: params.imageId,
      filename,
      storagePath,
      mimeType: "video/mp4",
      durationSeconds: params.durationSeconds ?? null,
      fileSize,
    })
    .run();

  log.info({ videoId, jobId: params.jobId }, "Created video record in media library");
  return videoId;
};

const worker = new Worker<GenerationJobPayload>(
  GENERATION_QUEUE_NAME,
  async (job) => {
    log.info(
      { jobId: job.id, type: job.data.type, wanApiKeySet: !!process.env.WAN_API_KEY },
      `Processing job ${job.id}`
    );

    await updateJobStatus(job.data.jobId, {
      status: "processing",
      progress: 10,
      error: null,
    });

    const jobType: string = job.data.type;

    if (jobType === "generate-video") {
      const payload = job.data as Extract<GenerationJobPayload, { type: "generate-video" }>;
      await updateElementVideoStatus(job.data.elementId, { videoStatus: "processing" });
      await job.updateProgress(25);
      const result = await generateVideoJob(payload);
      await updateJobStatus(job.data.jobId, {
        status: "complete",
        progress: 100,
        videoUrl: result.videoUrl,
        prompt: result.promptUsed,
        metadata: JSON.stringify(result.metadata),
        error: null,
      });
      await updateElementVideoStatus(job.data.elementId, {
        videoStatus: "complete",
        videoUrl: result.videoUrl,
        animationPrompt: result.promptUsed,
      });

      // Create video record in media library
      await createVideoRecord({
        jobId: payload.jobId,
        projectId: payload.projectId,
        imageId: payload.imageId,
        durationSeconds: result.metadata.durationSeconds ?? undefined,
      });

      return result;
    }

    if (jobType === "analyze-image") {
      const payload = job.data as Extract<GenerationJobPayload, { type: "analyze-image" }>;
      await analyzeImageJob(payload);
      await updateJobStatus(job.data.jobId, {
        status: "complete",
        progress: 100,
        error: null,
      });
      return { ok: true };
    }

    throw new Error(`Unknown job type: ${jobType}`);
  },
  {
    connection,
    concurrency: Number(process.env.GENERATION_WORKER_CONCURRENCY || "2"),
  }
);

worker.on("failed", async (job: Job<GenerationJobPayload> | undefined, error: Error) => {
  if (!job) {
    log.error({ err: error }, "Job failed but job reference is undefined");
    return;
  }

  const attempts = job.opts.attempts ?? 1;
  const finalFailure = job.attemptsMade >= attempts;
  const status = finalFailure ? "failed" : "queued";
  const progress = finalFailure ? (typeof job.progress === "number" ? job.progress : 0) : 0;

  // Log the failure with full error details
  log.error(
    {
      jobId: job.id,
      dbJobId: job.data.jobId,
      type: job.data.type,
      attemptsMade: job.attemptsMade,
      maxAttempts: attempts,
      finalFailure,
      err: error,
      errorMessage: error.message,
      errorStack: error.stack,
    },
    `Job failed: ${error.message}`
  );

  await updateJobStatus(job.data.jobId, {
    status,
    progress,
    error: finalFailure ? error.message : null,
  });

  if (job.data.type === "generate-video") {
    await updateElementVideoStatus(job.data.elementId, {
      videoStatus: finalFailure ? "failed" : "pending",
    });
  }
});

worker.on("error", (error: Error) => {
  log.error({ err: error }, "Worker error");
});

const shutdown = async () => {
  await worker.close();
  await connection.quit();
};

process.on("SIGINT", shutdown);
process.on("SIGTERM", shutdown);

log.info(
  {
    queue: GENERATION_QUEUE_NAME,
    redisUrl: process.env.REDIS_URL || "redis://localhost:6379 (default)",
  },
  "Worker started"
);

worker.on("ready", async () => {
  log.info("Ready to process jobs");

  // Recover any pending WAN tasks from previous worker crashes/restarts
  try {
    await recoverPendingWanTasks();
  } catch (error) {
    log.error({ err: error }, "Failed to recover pending WAN tasks on startup");
  }
});

worker.on("active", (job) => {
  log.debug({ jobId: job.id }, "Job is now active");
});
