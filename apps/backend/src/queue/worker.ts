import { type Job, Worker } from "bullmq";
import { eq, sql } from "drizzle-orm";
import { db, schema } from "../db";
import { createRedisConnection } from "./connection";
import { GENERATION_QUEUE_NAME } from "./queue";
import { analyzeImageJob } from "./jobs/analyze-image";
import { generateVideoJob } from "./jobs/generate-video";
import type { GenerationJobPayload } from "./jobs/types";

// Debug: Log environment variables at worker startup
console.log("[Queue Worker] Environment check:");
console.log("  WAN_API_KEY:", process.env.WAN_API_KEY ? `${process.env.WAN_API_KEY.slice(0, 8)}...` : "NOT SET");
console.log("  GEMINI_API_KEY:", process.env.GEMINI_API_KEY ? `${process.env.GEMINI_API_KEY.slice(0, 8)}...` : "NOT SET");
console.log("  REDIS_URL:", process.env.REDIS_URL || "default");

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

const worker = new Worker<GenerationJobPayload>(
  GENERATION_QUEUE_NAME,
  async (job) => {
    console.log(`[Queue Worker] Processing job ${job.id} (type: ${job.data.type})`);
    console.log(`[Queue Worker] WAN_API_KEY at job time:`, process.env.WAN_API_KEY ? "SET" : "NOT SET");

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
  if (!job) return;
  const attempts = job.opts.attempts ?? 1;
  const finalFailure = job.attemptsMade >= attempts;
  const status = finalFailure ? "failed" : "queued";
  const progress = finalFailure ? (typeof job.progress === "number" ? job.progress : 0) : 0;

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
  console.error("[Queue Worker] Error:", error);
});

const shutdown = async () => {
  await worker.close();
  await connection.quit();
};

process.on("SIGINT", shutdown);
process.on("SIGTERM", shutdown);

console.warn(`[Queue Worker] Started. Listening on queue: ${GENERATION_QUEUE_NAME}`);
console.warn(`[Queue Worker] Redis URL: ${process.env.REDIS_URL || "redis://localhost:6379 (default)"}`);

// Log when worker becomes ready to process jobs
worker.on("ready", () => {
  console.log("[Queue Worker] Ready to process jobs");
});

worker.on("active", (job) => {
  console.log(`[Queue Worker] Job ${job.id} is now active`);
});
