import { Buffer } from "node:buffer";
import { mkdir } from "node:fs/promises";
import { join } from "node:path";
import { fileURLToPath } from "node:url";
import { eq } from "drizzle-orm";
import type { GenerationMetadata } from "@gazette/shared";
import { db, schema } from "../../db";
import { analyzeImage } from "../../lib/gemini-client";
import { downloadVideo, generateVideo } from "../../lib/wan-client";
import type { GenerateVideoJobPayload } from "./types";

const RAW_UPLOAD_DIR = process.env.UPLOAD_DIR || "uploads";
const UPLOAD_DIR = RAW_UPLOAD_DIR.replace(/^\.\//, "").replace(/\/$/, "");
const VIDEO_SUBDIR = "videos";

const DEFAULT_DURATION_SECONDS = 5;
const DEFAULT_RESOLUTION: GenerationMetadata["resolution"] = "720p";

const appRoot = fileURLToPath(new URL("../../..", import.meta.url));
const videoRoot = join(appRoot, UPLOAD_DIR, VIDEO_SUBDIR);

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
  if (envValue === "480p" || envValue === "720p" || envValue === "1080p") {
    return envValue;
  }
  return DEFAULT_RESOLUTION;
};

export type GenerateVideoJobResult = {
  videoUrl: string;
  promptUsed: string;
  metadata: GenerationMetadata;
};

export async function generateVideoJob(
  payload: GenerateVideoJobPayload
): Promise<GenerateVideoJobResult> {
  const element = db
    .select()
    .from(schema.elements)
    .where(eq(schema.elements.id, payload.elementId))
    .get();
  if (!element) {
    throw new Error("Element not found for generation job");
  }

  const image = db.select().from(schema.images).where(eq(schema.images.id, payload.imageId)).get();
  if (!image) {
    throw new Error("Image not found for generation job");
  }

  const normalizedPath = image.storagePath.startsWith("/")
    ? image.storagePath.slice(1)
    : image.storagePath;
  const imagePath = join(appRoot, normalizedPath);
  const imageFile = Bun.file(imagePath);
  if (!(await imageFile.exists())) {
    throw new Error("Image file not found for generation job");
  }

  const imageData = Buffer.from(await imageFile.arrayBuffer());
  const analysis = await analyzeImage({
    imageId: payload.imageId,
    mimeType: image.mimeType,
    imageData,
  });

  const suggestion = analysis.suggestions[0];
  const overridePrompt = payload.promptOverride?.trim();
  const fallbackPrompt =
    element.animationPrompt?.trim() ||
    analysis.sceneDescription ||
    "Subtle, realistic motion in the photo.";

  let promptUsed = "";
  let promptSource: GenerationMetadata["promptSource"] = "fallback";
  let suggestionId: string | null = null;

  if (overridePrompt) {
    promptUsed = overridePrompt;
    promptSource = "override";
  } else if (suggestion?.prompt) {
    promptUsed = suggestion.prompt;
    promptSource = "gemini";
    suggestionId = suggestion.id ?? null;
  } else {
    promptUsed = fallbackPrompt;
  }

  promptUsed = clampPrompt(promptUsed);

  const durationSeconds = getDurationSeconds();
  const resolution = getResolution();

  const mockUrl = process.env.WAN_MOCK_VIDEO_URL;
  const wanResult = mockUrl
    ? { videoUrl: mockUrl }
    : await generateVideo({
        prompt: promptUsed,
        imagePath,
        imageMimeType: image.mimeType,
        promptExtend: true,
        durationSeconds,
        resolution: resolution ?? undefined,
      });

  await mkdir(videoRoot, { recursive: true });
  const videoFilename = `${payload.jobId}.mp4`;
  const filePath = join(videoRoot, videoFilename);
  await downloadVideo(wanResult.videoUrl ?? "", filePath);

  const metadata: GenerationMetadata = {
    promptUsed,
    promptSource,
    suggestionId,
    sceneDescription: analysis.sceneDescription || null,
    durationSeconds,
    resolution,
    geminiModel: process.env.GEMINI_MODEL || null,
    wanModel: process.env.WAN_MODEL || null,
  };

  return {
    videoUrl: `/api/videos/${payload.jobId}/file`,
    promptUsed,
    metadata,
  };
}
