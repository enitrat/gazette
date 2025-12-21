import { Buffer } from "node:buffer";
import { createLogger } from "./logger";

const log = createLogger("wan-client");

export type WanTaskStatus = "PENDING" | "RUNNING" | "SUCCEEDED" | "FAILED" | "CANCELED" | "UNKNOWN";

export type WanVideoRequest = {
  prompt: string;
  imageUrl?: string;
  imageDataUrl?: string;
  imagePath?: string;
  imageMimeType?: string;
  imageUrls?: string[];
  negativePrompt?: string;
  durationSeconds?: number;
  resolution?: "720p" | "1080p";
  aspectRatio?: "16:9" | "9:16" | "1:1";
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
const DEFAULT_WAN_MODEL = "wan2.6-image-to-video";
const DEFAULT_KLING_MODEL = "kling-o1-image-to-video";
const DEFAULT_POLL_INTERVAL_MS = 15000;
const DEFAULT_MAX_POLL_MS = 30 * 60 * 1000;

type VideoProvider = "wan" | "kling";

type ProviderConfig = {
  provider: VideoProvider;
  baseUrl: string;
  filesBaseUrl: string;
  defaultModel: string;
  maxImageUrls: number;
  durationOptions: number[];
  supportsQuality: boolean;
  supportsAspectRatio: boolean;
  aspectRatioOptions?: Array<"16:9" | "9:16" | "1:1">;
};

const getEnvNumber = (value: string | undefined, fallback: number) => {
  if (!value) return fallback;
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : fallback;
};

const getProvider = (): VideoProvider => {
  if (!process.env.WAN_PROVIDER && !process.env.VIDEO_PROVIDER) {
    throw new Error("WAN_PROVIDER or VIDEO_PROVIDER is not configured");
  }
  const raw = (process.env.WAN_PROVIDER || process.env.VIDEO_PROVIDER)!.trim().toLowerCase();
  if (raw === "wan" || raw === "kling") {
    return raw;
  }
  throw new Error(`WAN_PROVIDER must be 'wan' or 'kling' (received '${raw}')`);
};

const getConfig = (): ProviderConfig => {
  const provider = getProvider();
  log.info({ provider }, "Getting ImgToVideo provider config");
  if (provider === "kling") {
    return {
      provider,
      baseUrl: DEFAULT_BASE_URL,
      filesBaseUrl: DEFAULT_FILES_BASE_URL,
      defaultModel: DEFAULT_KLING_MODEL,
      maxImageUrls: 2,
      durationOptions: [5, 10],
      supportsQuality: false,
      supportsAspectRatio: true,
      aspectRatioOptions: ["16:9", "9:16", "1:1"],
    };
  }

  return {
    provider,
    baseUrl: DEFAULT_BASE_URL,
    filesBaseUrl: DEFAULT_FILES_BASE_URL,
    defaultModel: DEFAULT_WAN_MODEL,
    maxImageUrls: 1,
    durationOptions: [5, 10, 15],
    supportsQuality: true,
    supportsAspectRatio: false,
  };
};

const getModel = (config: ProviderConfig) => {
  const envModel = config.provider === "kling" ? process.env.KLING_MODEL : process.env.WAN_MODEL;
  return envModel?.trim() || config.defaultModel;
};

const getApiKey = () => {
  const apiKey = process.env.WAN_API_KEY?.trim();
  if (!apiKey) {
    throw new Error("WAN_API_KEY is not configured");
  }
  // Log API key info for debugging (only first/last few chars)
  if (apiKey.length > 8) {
    log.debug(
      {
        keyLength: apiKey.length,
        keyPrefix: apiKey.slice(0, 4),
        keySuffix: apiKey.slice(-4),
      },
      "Using WAN API key"
    );
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
  const { filesBaseUrl } = getConfig();

  log.info({ filesBaseUrl }, "Uploading image to WAN files API");
  const startTime = Date.now();

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
    log.error({ status: response.status, response: data }, "WAN file upload failed");
    throw new Error(message);
  }

  const fileUrl =
    (data as { data?: { file_url?: string; fileUrl?: string } }).data?.file_url ||
    (data as { data?: { file_url?: string; fileUrl?: string } }).data?.fileUrl;

  if (!fileUrl) {
    log.error({ response: data }, "WAN file upload response missing file_url");
    throw new Error("WAN file upload response missing file_url");
  }

  const duration = Date.now() - startTime;
  log.info({ fileUrl, durationMs: duration }, "Image uploaded to WAN successfully");

  return fileUrl;
};

export const createWanTask = async (request: WanVideoRequest) => {
  const apiKey = getApiKey();
  const config = getConfig();
  const model = getModel(config);
  const baseUrl = config.baseUrl;

  log.info(
    {
      provider: config.provider,
      model,
      prompt: request.prompt.substring(0, 100),
      durationSeconds: request.durationSeconds,
      resolution: request.resolution,
      hasImageUrl: !!request.imageUrl,
      hasImageDataUrl: !!request.imageDataUrl,
      hasImagePath: !!request.imagePath,
      imageUrlsCount: request.imageUrls?.length ?? 0,
    },
    "Creating WAN video generation task"
  );

  let imageUrls = request.imageUrls?.filter(Boolean) ?? [];

  if (imageUrls.length === 0) {
    const imageSource =
      request.imageUrl ||
      request.imageDataUrl ||
      (request.imagePath ? await toDataUrl(request.imagePath, request.imageMimeType) : undefined);

    if (!imageSource) {
      log.error("WAN request missing image input");
      throw new Error("WAN request missing image input");
    }

    const imageUrl = request.imageUrl ? request.imageUrl : await uploadBase64Image(imageSource);
    imageUrls = [imageUrl];
  }

  if (config.provider === "kling" && imageUrls.length === 1) {
    imageUrls = [imageUrls[0], imageUrls[0]];
  }

  if (imageUrls.length > config.maxImageUrls) {
    throw new Error(`WAN request supports up to ${config.maxImageUrls} image URL(s)`);
  }

  const body: Record<string, unknown> = {
    model,
    prompt: request.prompt,
    image_urls: imageUrls,
  };

  if (request.durationSeconds !== undefined) {
    if (!config.durationOptions.includes(request.durationSeconds)) {
      throw new Error(`WAN durationSeconds must be ${config.durationOptions.join(", ")}`);
    }
    body.duration = request.durationSeconds;
  }

  if (config.supportsQuality && request.resolution) {
    body.quality = request.resolution;
  }

  if (config.supportsAspectRatio) {
    const aspectRatio = request.aspectRatio ?? "16:9";
    if (!config.aspectRatioOptions?.includes(aspectRatio)) {
      throw new Error(`WAN aspectRatio must be ${config.aspectRatioOptions?.join(", ")}`);
    }
    body.aspect_ratio = aspectRatio;
  }

  if (request.promptExtend !== undefined) {
    body.prompt_extend = request.promptExtend;
  }

  log.debug(
    { baseUrl, model, provider: config.provider },
    "Sending video generation request to WAN API"
  );

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
    log.error({ status: response.status, response: data }, "WAN task creation failed");
    throw new Error(message);
  }

  const taskId = (data as { id?: string }).id;

  if (!taskId) {
    log.error({ response: data }, "WAN task creation response missing id");
    throw new Error("WAN task creation response missing id");
  }

  log.info({ taskId }, "WAN video generation task created successfully");

  return { taskId, raw: data };
};

export const getWanTaskStatus = async (taskId: string): Promise<WanTaskResult> => {
  const apiKey = getApiKey();
  const { baseUrl } = getConfig();

  log.debug({ taskId }, "Polling WAN task status");

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
    log.error({ taskId, status: response.status, response: data }, "Failed to get WAN task status");
    throw new Error(message);
  }

  const results = (data as { results?: unknown }).results;
  const firstResult = Array.isArray(results) ? results[0] : undefined;
  const videoUrl =
    typeof firstResult === "string"
      ? firstResult
      : (firstResult as { url?: string; video_url?: string } | undefined)?.video_url ||
        (firstResult as { url?: string } | undefined)?.url;

  const status = toTaskStatus((data as { status?: string }).status);
  log.debug({ taskId, status, hasVideoUrl: !!videoUrl }, "WAN task status received");

  return {
    taskId,
    status,
    videoUrl,
    raw: data,
  };
};

/**
 * Poll a WAN task until it completes (succeeds or fails).
 * Use this to resume polling for a task that was created earlier.
 */
export const pollWanTaskUntilComplete = async (
  taskId: string,
  options?: { maxPollMs?: number; pollIntervalMs?: number }
): Promise<WanTaskResult> => {
  const pollIntervalMs =
    options?.pollIntervalMs ??
    getEnvNumber(process.env.WAN_POLL_INTERVAL_MS, DEFAULT_POLL_INTERVAL_MS);
  const maxPollMs =
    options?.maxPollMs ?? getEnvNumber(process.env.WAN_MAX_POLL_MS, DEFAULT_MAX_POLL_MS);

  log.info({ taskId, pollIntervalMs, maxPollMs }, "Starting/resuming polling for WAN task");

  const startTime = Date.now();
  let lastStatus: WanTaskResult | null = null;
  let pollCount = 0;

  while (Date.now() - startTime < maxPollMs) {
    pollCount++;
    lastStatus = await getWanTaskStatus(taskId);

    const elapsedMs = Date.now() - startTime;
    log.info({ taskId, status: lastStatus.status, pollCount, elapsedMs }, "Poll status update");

    if (lastStatus.status === "SUCCEEDED") {
      if (!lastStatus.videoUrl) {
        log.error({ taskId }, "WAN task completed without a video URL");
        throw new Error("WAN task completed without a video URL");
      }
      log.info(
        { taskId, videoUrl: lastStatus.videoUrl, totalDurationMs: elapsedMs, pollCount },
        "Video generation completed successfully"
      );
      return lastStatus;
    }

    if (lastStatus.status === "FAILED" || lastStatus.status === "CANCELED") {
      log.error(
        { taskId, status: lastStatus.status, elapsedMs },
        "Video generation task failed or was canceled"
      );
      throw new Error(`WAN task ${lastStatus.status.toLowerCase()}`);
    }

    await new Promise((resolve) => setTimeout(resolve, pollIntervalMs));
  }

  log.error({ taskId, maxPollMs, pollCount }, "WAN task polling exceeded time limit");
  throw new Error("WAN task polling exceeded time limit");
};

export type GenerateVideoResult = WanTaskResult & {
  taskId: string;
};

/**
 * Create a WAN video generation task and poll until completion.
 * Returns both the taskId (for tracking) and the result.
 */
export const generateVideo = async (request: WanVideoRequest): Promise<GenerateVideoResult> => {
  log.info("Starting video generation with polling");

  const { taskId } = await createWanTask(request);
  log.info({ taskId }, "Video generation task created, starting polling loop");

  const result = await pollWanTaskUntilComplete(taskId);
  return { ...result, taskId };
};

export const downloadVideo = async (videoUrl: string, outputPath: string) => {
  log.info({ videoUrl, outputPath }, "Downloading video");
  const startTime = Date.now();

  const response = await fetch(videoUrl);
  if (!response.ok) {
    log.error({ videoUrl, status: response.status }, "Failed to download video");
    throw new Error(`Failed to download video (${response.status})`);
  }

  const buffer = Buffer.from(await response.arrayBuffer());
  await Bun.write(outputPath, buffer);

  const durationMs = Date.now() - startTime;
  log.info({ outputPath, bytes: buffer.length, durationMs }, "Video downloaded successfully");

  return {
    bytes: buffer.length,
  };
};
