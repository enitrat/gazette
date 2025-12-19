import { GoogleGenAI } from "@google/genai";
import { VALIDATION } from "@gazette/shared";
import type { AnimationSuggestion, ImageAnalysisResult } from "@gazette/shared";
import { randomUUID } from "node:crypto";

const DEFAULT_MODEL = "gemini-3-flash-preview";
const MAX_RETRIES = 3;
const BASE_DELAY_MS = 350;

let cachedClient: GoogleGenAI | null = null;
let cachedKey: string | null = null;

const getClient = () => {
  const apiKey = process.env.GEMINI_API_KEY?.trim();
  if (!apiKey) {
    return null;
  }

  if (!cachedClient || cachedKey !== apiKey) {
    cachedClient = new GoogleGenAI({ apiKey });
    cachedKey = apiKey;
  }

  return cachedClient;
};

const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

const clampText = (value: unknown, maxLength: number, fallback = "") => {
  if (typeof value !== "string") {
    return fallback;
  }
  const trimmed = value.trim().replace(/\s+/g, " ");
  if (!trimmed) {
    return fallback;
  }
  return trimmed.length > maxLength ? trimmed.slice(0, maxLength) : trimmed;
};

const extractJson = (value: string) => {
  const trimmed = value.trim();
  let jsonText = trimmed;

  if (trimmed.startsWith("```")) {
    jsonText = trimmed
      .replace(/^```(?:json)?/i, "")
      .replace(/```$/, "")
      .trim();
  }

  const firstBrace = jsonText.indexOf("{");
  const lastBrace = jsonText.lastIndexOf("}");
  if (firstBrace !== -1 && lastBrace !== -1 && lastBrace > firstBrace) {
    jsonText = jsonText.slice(firstBrace, lastBrace + 1);
  }

  return JSON.parse(jsonText);
};

const dedupeSuggestions = (suggestions: Array<Omit<AnimationSuggestion, "id">>) => {
  const seen = new Set<string>();
  return suggestions.filter((suggestion) => {
    const key = `${suggestion.description.toLowerCase()}::${suggestion.prompt.toLowerCase()}`;
    if (seen.has(key)) {
      return false;
    }
    seen.add(key);
    return true;
  });
};

const normalizeSuggestions = (
  value: unknown,
  maxCount: number
): Array<Omit<AnimationSuggestion, "id">> => {
  const raw = Array.isArray(value) ? value : [];
  const cleaned = raw
    .map((entry) => {
      if (!entry || typeof entry !== "object") {
        return null;
      }
      const description = clampText(
        "description" in entry ? (entry as { description?: unknown }).description : "",
        VALIDATION.SUGGESTION_DESCRIPTION_MAX
      );
      const prompt = clampText(
        "prompt" in entry ? (entry as { prompt?: unknown }).prompt : "",
        VALIDATION.ANIMATION_PROMPT_MAX
      );
      if (!description || !prompt) {
        return null;
      }
      return { description, prompt };
    })
    .filter((entry): entry is Omit<AnimationSuggestion, "id"> => Boolean(entry));

  return dedupeSuggestions(cleaned).slice(0, maxCount);
};

const buildPrompt = () =>
  [
    "You are an animation director for vintage family photos.",
    "Analyze the image and return JSON only.",
    "Schema:",
    "{",
    '  "sceneDescription": string,',
    '  "suggestions": [',
    '    { "description": string, "prompt": string }',
    "  ]",
    "}",
    "Rules:",
    "- Provide 3 to 5 suggestions.",
    "- Description <= 100 chars. Prompt <= 500 chars.",
    "- Subtle, realistic motion. No camera moves. No new objects.",
  ].join("\n");

const toAnalysisResult = (imageId: string, raw: unknown, maxCount: number): ImageAnalysisResult => {
  const sceneDescription = clampText(
    raw && typeof raw === "object" && "sceneDescription" in raw
      ? (raw as { sceneDescription?: unknown }).sceneDescription
      : "",
    VALIDATION.SCENE_DESCRIPTION_MAX,
    ""
  );

  const suggestions = normalizeSuggestions(
    raw && typeof raw === "object" && "suggestions" in raw
      ? (raw as { suggestions?: unknown }).suggestions
      : [],
    maxCount
  );

  const withIds = suggestions.map((suggestion, index) => ({
    id: `sug-${index + 1}`,
    ...suggestion,
  }));

  return {
    imageId,
    sceneDescription,
    suggestions: withIds,
  };
};

export async function analyzeImage(params: {
  imageId: string;
  mimeType: string;
  imageData: Buffer;
}): Promise<ImageAnalysisResult> {
  const client = getClient();
  const maxCount = VALIDATION.MAX_ANIMATION_SUGGESTIONS;

  if (!client) {
    return toAnalysisResult(params.imageId, { sceneDescription: "", suggestions: [] }, maxCount);
  }

  const model = process.env.GEMINI_MODEL?.trim() || DEFAULT_MODEL;
  const prompt = buildPrompt();
  const imageBase64 = params.imageData.toString("base64");

  let lastError: unknown = null;

  for (let attempt = 0; attempt < MAX_RETRIES; attempt += 1) {
    try {
      const response = await client.models.generateContent({
        model,
        contents: [
          {
            role: "user",
            parts: [
              { text: prompt },
              {
                inlineData: {
                  mimeType: params.mimeType,
                  data: imageBase64,
                },
              },
            ],
          },
        ],
      });

      const text = response.text ?? "";
      const parsed = extractJson(text);
      return toAnalysisResult(params.imageId, parsed, maxCount);
    } catch (error) {
      lastError = error;
      const delay = BASE_DELAY_MS * Math.pow(2, attempt);
      await sleep(delay + Math.floor(Math.random() * 120));
    }
  }

  console.warn("Gemini analysis failed, returning empty suggestions.", {
    imageId: params.imageId,
    error: lastError instanceof Error ? lastError.message : lastError,
    traceId: randomUUID(),
  });

  return toAnalysisResult(params.imageId, { sceneDescription: "", suggestions: [] }, maxCount);
}
