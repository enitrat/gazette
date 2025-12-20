import { Buffer } from "node:buffer";

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

const DEFAULT_BASE_URL = "https://api.evolink.ai/v1";
const DEFAULT_FILES_BASE_URL = "https://files-api.evolink.ai/api/v1";
const DEFAULT_MODEL = "wan2.6-image-to-video";
const DEFAULT_POLL_INTERVAL_MS = 15000;
const DEFAULT_MAX_POLL_MS = 12 * 60 * 1000;

const getEnvNumber = (value: string | undefined, fallback: number) => {
  if (!value) return fallback;
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : fallback;
};

const getBaseUrl = () => DEFAULT_BASE_URL;
const getFilesBaseUrl = () => DEFAULT_FILES_BASE_URL;
const getModel = () => DEFAULT_MODEL;

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
  const normalized = typeof value === "string" ? value.toLowerCase() : "";
  switch (normalized) {
    case "pending":
      return "PENDING";
    case "processing":
      return "RUNNING";
    case "completed":
      return "SUCCEEDED";
    case "failed":
      return "FAILED";
    case "canceled":
    case "cancelled":
      return "CANCELED";
    default:
      return "UNKNOWN";
  }
};

const uploadBase64Image = async (base64Data: string) => {
  const apiKey = getApiKey();
  const filesBaseUrl = getFilesBaseUrl();

  const response = await fetch(`${filesBaseUrl}/files/upload/base64`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      base64_data: base64Data,
    }),
  });

  const data = await parseJson(response);
  const success =
    typeof data === "object" &&
    data !== null &&
    "success" in data &&
    Boolean((data as { success?: boolean }).success);
  if (!response.ok || !success) {
    const message =
      (data &&
        typeof data === "object" &&
        ("msg" in data || "message" in data) &&
        ((data as { msg?: string }).msg || (data as { message?: string }).message)) ||
      `WAN file upload failed (${response.status})`;
    throw new Error(message);
  }

  const fileUrl =
    (data as { data?: { file_url?: string; fileUrl?: string } }).data?.file_url ||
    (data as { data?: { file_url?: string; fileUrl?: string } }).data?.fileUrl;

  if (!fileUrl) {
    throw new Error("WAN file upload response missing file_url");
  }

  console.log("File uploaded to: ", fileUrl);

  return fileUrl;
};

export const createWanTask = async (request: WanVideoRequest) => {
  const apiKey = getApiKey();
  const baseUrl = getBaseUrl();
  const model = getModel();

  const imageSource =
    request.imageUrl ||
    request.imageDataUrl ||
    (request.imagePath ? await toDataUrl(request.imagePath, request.imageMimeType) : undefined);

  if (!imageSource) {
    throw new Error("WAN request missing image input");
  }

  const imageUrl = request.imageUrl ? request.imageUrl : await uploadBase64Image(imageSource);
  const body: Record<string, unknown> = {
    model,
    prompt: request.prompt,
    image_urls: [imageUrl],
  };

  if (request.durationSeconds !== undefined) {
    if (![5, 10, 15].includes(request.durationSeconds)) {
      throw new Error("WAN durationSeconds must be 5, 10, or 15");
    }
    body.duration = request.durationSeconds;
  }

  if (request.resolution) {
    body.quality = request.resolution === "1080p" ? "1080p" : "720p";
  }

  if (request.promptExtend !== undefined) {
    body.prompt_extend = request.promptExtend;
  }

  const response = await fetch(`${baseUrl}/videos/generations`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify(body),
  });

  const data = await parseJson(response);
  if (!response.ok) {
    const message =
      (data &&
        typeof data === "object" &&
        ("message" in data || "msg" in data) &&
        ((data as { message?: string }).message || (data as { msg?: string }).msg)) ||
      `WAN task creation failed (${response.status})`;
    throw new Error(message);
  }

  const taskId = (data as { id?: string }).id;

  if (!taskId) {
    throw new Error("WAN task creation response missing id");
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

  const results = (data as { results?: unknown }).results;
  const firstResult = Array.isArray(results) ? results[0] : undefined;
  const videoUrl =
    typeof firstResult === "string"
      ? firstResult
      : (firstResult as { url?: string; video_url?: string } | undefined)?.video_url ||
        (firstResult as { url?: string } | undefined)?.url;

  return {
    taskId,
    status: toTaskStatus((data as { status?: string }).status),
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
