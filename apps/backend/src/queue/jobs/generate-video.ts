import { mkdir } from "node:fs/promises";
import { isAbsolute, join } from "node:path";
import { fileURLToPath } from "node:url";
import { eq, sql } from "drizzle-orm";
import type { GenerationMetadata } from "@gazette/shared";
import { db, schema } from "../../db";
import { createWanTask, pollWanTaskUntilComplete, downloadVideo } from "../../lib/wan-client";
import { createLogger } from "../../lib/logger";
import type { GenerateVideoJobPayload } from "./types";

const log = createLogger("generate-video-job");

const RAW_UPLOAD_DIR = process.env.UPLOAD_DIR || "uploads";
const UPLOAD_DIR = RAW_UPLOAD_DIR.replace(/^\.\//, "").replace(/\/$/, "");
const VIDEO_SUBDIR = "videos";

const DEFAULT_DURATION_SECONDS = 5;
const DEFAULT_RESOLUTION: GenerationMetadata["resolution"] = "720p";

const appRoot = fileURLToPath(new URL("../../..", import.meta.url));
const videoRoot = isAbsolute(UPLOAD_DIR)
  ? join(UPLOAD_DIR, VIDEO_SUBDIR)
  : join(appRoot, UPLOAD_DIR, VIDEO_SUBDIR);

const clampPrompt = (value: string, maxLength = 500) => {
  const trimmed = value.trim().replace(/\s+/g, " ");
  return trimmed.length > maxLength ? trimmed.slice(0, maxLength) : trimmed;
};

const getDurationSeconds = () => {
  const envValue = process.env.WAN_VIDEO_DURATION_SECONDS;
  if (!envValue) return DEFAULT_DURATION_SECONDS;
  const parsed = Number(envValue);
  if (!Number.isFinite(parsed) || parsed <= 0) {
    return DEFAULT_DURATION_SECONDS;
  }
  return Math.round(parsed);
};

const getResolution = (): GenerationMetadata["resolution"] => {
  const envValue = process.env.WAN_VIDEO_RESOLUTION;
  // WAN 2.6 only supports 720p and 1080p (not 480p)
  if (envValue === "720p" || envValue === "1080p") {
    return envValue;
  }
  return DEFAULT_RESOLUTION;
};

/**
 * Store the WAN task ID in the database immediately after task creation.
 * This allows recovery if the worker crashes during polling.
 */
const storeWanTaskId = (jobId: string, wanTaskId: string) => {
  db.update(schema.generationJobs)
    .set({
      wanTaskId,
      updatedAt: sql`(unixepoch())`,
    })
    .where(eq(schema.generationJobs.id, jobId))
    .run();
  log.info({ jobId, wanTaskId }, "Stored WAN task ID for recovery");
};

export type GenerateVideoJobResult = {
  videoUrl: string;
  promptUsed: string;
  metadata: GenerationMetadata;
};

export async function generateVideoJob(
  payload: GenerateVideoJobPayload
): Promise<GenerateVideoJobResult> {
  log.info({ payload }, "Starting video generation job");

  const element = db
    .select()
    .from(schema.elements)
    .where(eq(schema.elements.id, payload.elementId))
    .get();
  if (!element) {
    log.error({ elementId: payload.elementId }, "Element not found for generation job");
    throw new Error("Element not found for generation job");
  }

  const image = db.select().from(schema.images).where(eq(schema.images.id, payload.imageId)).get();
  if (!image) {
    log.error({ imageId: payload.imageId }, "Image not found for generation job");
    throw new Error("Image not found for generation job");
  }

  const imagePath = isAbsolute(image.storagePath)
    ? image.storagePath
    : join(appRoot, image.storagePath);
  const imageFile = Bun.file(imagePath);
  if (!(await imageFile.exists())) {
    log.error({ imagePath }, "Image file not found for generation job");
    throw new Error("Image file not found for generation job");
  }

  log.info({ imagePath, mimeType: image.mimeType }, "Loading image for analysis");

  const overridePrompt = payload.promptOverride?.trim();
  if (!overridePrompt) {
    log.error({ imageId: payload.imageId }, "No prompt override provided for generation job");
    throw new Error("No prompt override provided for generation job");
  }

  const promptUsed = clampPrompt(overridePrompt);
  const promptSource: GenerationMetadata["promptSource"] = "override";

  const durationSeconds = getDurationSeconds();
  const resolution = getResolution();

  log.info(
    {
      promptUsed: promptUsed,
      promptSource,
      durationSeconds,
      resolution,
    },
    "Prepared prompt for video generation"
  );

  const mockUrl = process.env.WAN_MOCK_VIDEO_URL;

  let wanResult: { videoUrl?: string; taskId?: string };
  if (mockUrl) {
    log.info({ mockUrl }, "Using mock video URL (WAN_MOCK_VIDEO_URL is set)");
    wanResult = { videoUrl: mockUrl, taskId: "mock-task-id" };
  } else {
    log.info("Calling WAN API to generate video");
    try {
      // Step 1: Create the WAN task
      const { taskId } = await createWanTask({
        prompt: promptUsed,
        imagePath,
        imageMimeType: image.mimeType,
        promptExtend: true,
        durationSeconds,
        resolution: resolution === "480p" ? "720p" : (resolution ?? undefined),
      });

      // Step 2: IMMEDIATELY store the task ID for recovery
      storeWanTaskId(payload.jobId, taskId);

      // Step 3: Poll until completion (can now be recovered if worker crashes)
      const pollResult = await pollWanTaskUntilComplete(taskId);
      wanResult = { videoUrl: pollResult.videoUrl, taskId };

      log.info({ videoUrl: wanResult.videoUrl, taskId }, "WAN video generation complete");
    } catch (error) {
      log.error(
        {
          err: error,
          errorMessage: error instanceof Error ? error.message : String(error),
          prompt: promptUsed.substring(0, 100),
          imagePath,
        },
        "WAN video generation failed"
      );
      throw error;
    }
  }

  await mkdir(videoRoot, { recursive: true });
  const videoFilename = `${payload.jobId}.mp4`;
  const filePath = join(videoRoot, videoFilename);

  log.info({ videoUrl: wanResult.videoUrl, filePath }, "Downloading video file");
  await downloadVideo(wanResult.videoUrl ?? "", filePath);
  log.info({ filePath }, "Video downloaded successfully");

  const provider = (process.env.WAN_PROVIDER || process.env.VIDEO_PROVIDER || "wan")
    .trim()
    .toLowerCase();
  const modelUsed =
    provider === "kling"
      ? process.env.KLING_MODEL || "kling-o1-image-to-video"
      : process.env.WAN_MODEL || "wan2.6-image-to-video";

  const metadata: GenerationMetadata = {
    promptUsed,
    promptSource,
    suggestionId: null,
    sceneDescription: null,
    durationSeconds,
    resolution,
    geminiModel: process.env.GEMINI_MODEL || null,
    wanModel: modelUsed || null,
  };

  log.info({ jobId: payload.jobId, metadata }, "Video generation job completed successfully");

  return {
    videoUrl: `/api/videos/${payload.jobId}/file`,
    promptUsed,
    metadata,
  };
}
