import { Buffer } from "node:buffer";
import { randomUUID } from "node:crypto";

export type WanTaskStatus = "PENDING" | "RUNNING" | "SUCCEEDED" | "FAILED" | "CANCELED" | "UNKNOWN";

export type WanVideoRequest = {
  prompt: string;
  imageUrl?: string;
  imageDataUrl?: string;
  imagePath?: string;
  imageMimeType?: string;
  negativePrompt?: string;
  durationSeconds?: number;
  resolution?: "480p" | "720p" | "1080p";
  seed?: number;
  promptExtend?: boolean;
};

export type WanTaskResult = {
  taskId: string;
  status: WanTaskStatus;
  videoUrl?: string;
  raw?: unknown;
};

const DEFAULT_BASE_URL = "https://dashscope-intl.aliyuncs.com/api/v1";
const DEFAULT_MODEL = "wan2.6-i2v";
const DEFAULT_POLL_INTERVAL_MS = 15000;
const DEFAULT_MAX_POLL_MS = 12 * 60 * 1000;

const getEnvNumber = (value: string | undefined, fallback: number) => {
  if (!value) return fallback;
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : fallback;
};

const getBaseUrl = () => process.env.WAN_BASE_URL || DEFAULT_BASE_URL;
const getModel = () => process.env.WAN_MODEL || DEFAULT_MODEL;

const getApiKey = () => {
  const apiKey = process.env.WAN_API_KEY;
  if (!apiKey) {
    throw new Error("WAN_API_KEY is not configured");
  }
  return apiKey;
};

const toDataUrl = async (path: string, mimeType?: string) => {
  const file = Bun.file(path);
  if (!(await file.exists())) {
    throw new Error("Image file not found for WAN request");
  }
  const buffer = Buffer.from(await file.arrayBuffer());
  const safeMime = mimeType || "image/jpeg";
  return `data:${safeMime};base64,${buffer.toString("base64")}`;
};

const parseJson = async (response: Response) => {
  const text = await response.text();
  if (!text) return {};
  try {
    return JSON.parse(text);
  } catch {
    return { raw: text };
  }
};

const toTaskStatus = (value: unknown): WanTaskStatus => {
  switch (value) {
    case "PENDING":
    case "RUNNING":
    case "SUCCEEDED":
    case "FAILED":
    case "CANCELED":
    case "UNKNOWN":
      return value;
    default:
      return "UNKNOWN";
  }
};

export const createWanTask = async (request: WanVideoRequest) => {
  const apiKey = getApiKey();
  const baseUrl = getBaseUrl();
  const model = getModel();

  const imageSource =
    request.imageDataUrl ||
    request.imageUrl ||
    (request.imagePath ? await toDataUrl(request.imagePath, request.imageMimeType) : undefined);

  if (!imageSource) {
    throw new Error("WAN request missing image input");
  }

  const body = {
    model,
    input: {
      prompt: request.prompt,
      img_url: imageSource,
      negative_prompt: request.negativePrompt,
    },
    parameters: {
      duration: request.durationSeconds,
      resolution: request.resolution,
      seed: request.seed,
      prompt_extend: request.promptExtend,
    },
  };

  const response = await fetch(`${baseUrl}/services/aigc/video-generation/video-synthesis`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
      "X-DashScope-Async": "enable",
      "X-Request-Id": randomUUID(),
    },
    body: JSON.stringify(body),
  });

  const data = await parseJson(response);
  if (!response.ok) {
    const message =
      (data &&
        typeof data === "object" &&
        "message" in data &&
        (data as { message?: string }).message) ||
      `WAN task creation failed (${response.status})`;
    throw new Error(message);
  }

  const taskId =
    (data as { output?: { task_id?: string; taskId?: string } }).output?.task_id ||
    (data as { output?: { task_id?: string; taskId?: string } }).output?.taskId ||
    (data as { task_id?: string }).task_id;

  if (!taskId) {
    throw new Error("WAN task creation response missing task_id");
  }

  return { taskId, raw: data };
};

export const getWanTaskStatus = async (taskId: string): Promise<WanTaskResult> => {
  const apiKey = getApiKey();
  const baseUrl = getBaseUrl();

  const response = await fetch(`${baseUrl}/tasks/${taskId}`, {
    headers: {
      Authorization: `Bearer ${apiKey}`,
    },
  });

  const data = await parseJson(response);
  if (!response.ok) {
    const message =
      (data &&
        typeof data === "object" &&
        "message" in data &&
        (data as { message?: string }).message) ||
      `WAN task status failed (${response.status})`;
    throw new Error(message);
  }

  const output = (
    data as { output?: { video_url?: string; videoUrl?: string; videos?: unknown[] } }
  ).output;
  const videoUrl =
    output?.video_url ||
    output?.videoUrl ||
    (Array.isArray(output?.videos) && output?.videos.length
      ? (output.videos[0] as { video_url?: string; url?: string }).video_url ||
        (output.videos[0] as { url?: string }).url
      : undefined);

  return {
    taskId,
    status: toTaskStatus((data as { task_status?: string }).task_status),
    videoUrl,
    raw: data,
  };
};

export const generateVideo = async (request: WanVideoRequest) => {
  const pollIntervalMs = getEnvNumber(process.env.WAN_POLL_INTERVAL_MS, DEFAULT_POLL_INTERVAL_MS);
  const maxPollMs = getEnvNumber(process.env.WAN_MAX_POLL_MS, DEFAULT_MAX_POLL_MS);

  const { taskId } = await createWanTask(request);
  const startTime = Date.now();

  let lastStatus: WanTaskResult | null = null;
  while (Date.now() - startTime < maxPollMs) {
    lastStatus = await getWanTaskStatus(taskId);

    if (lastStatus.status === "SUCCEEDED") {
      if (!lastStatus.videoUrl) {
        throw new Error("WAN task completed without a video URL");
      }
      return lastStatus;
    }

    if (lastStatus.status === "FAILED" || lastStatus.status === "CANCELED") {
      throw new Error(`WAN task ${lastStatus.status.toLowerCase()}`);
    }

    await new Promise((resolve) => setTimeout(resolve, pollIntervalMs));
  }

  throw new Error("WAN task polling exceeded time limit");
};

export const downloadVideo = async (videoUrl: string, outputPath: string) => {
  const response = await fetch(videoUrl);
  if (!response.ok) {
    throw new Error(`Failed to download video (${response.status})`);
  }

  const buffer = Buffer.from(await response.arrayBuffer());
  await Bun.write(outputPath, buffer);

  return {
    bytes: buffer.length,
  };
};
