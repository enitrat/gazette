import { GoogleGenAI } from "@google/genai";
import { VALIDATION } from "@gazette/shared";
import type { AnimationSuggestion, ImageAnalysisResult } from "@gazette/shared";
import { randomUUID } from "node:crypto";
import { createLogger } from "./logger";

const log = createLogger("gemini-client");

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
    "You are an animation director bringing vintage family photographs to life as 5-second video clips.",
    "Analyze the image and describe what this scene would look like in motion.",
    "",
    "Schema:",
    "{",
    '  "sceneDescription": string,  // Brief description of the scene',
    '  "suggestions": [',
    '    { "description": string, "prompt": string }  // 2-3 animation options',
    "  ]",
    "}",
    "",
    "CRITICAL RULES:",
    "- Description: max 100 chars (short label for UI)",
    "- Prompt: max 500 chars (detailed animation instructions)",
    "- The video must loop: ending frame = starting frame",
    "- No camera movement. No new objects. Stay within the original frame.",
    "",
    "ANIMATION STYLE - FOCUS ON VISIBLE, SCENE-LEVEL MOVEMENTS:",
    "- Think about what the WHOLE SCENE would look like as a video, not just micro-details",
    "- Prioritize NOTICEABLE actions: waving, talking, gesturing, moving around",
    "- Avoid subtle micro-movements (blinking, breathing, slight tilts) - these are too subtle to perceive",
    "- Characters should DO something: wave at camera, turn to talk to each other, adjust posture, laugh together",
    "- Include environmental motion when relevant: wind in hair/clothes, swaying plants, moving shadows",
    "- The animation should be immediately obvious to a viewer, not require close inspection",
    "",
    "PROMPT STRUCTURE:",
    "1. Describe the overall scene atmosphere and mood",
    "2. Specify the main visible action(s) happening",
    "3. Add secondary movements for other elements/people",
    "4. Mention any environmental motion (wind, light, etc.)",
    "",
    "Examples:",
    `{
      "sceneDescription": "A family of four sitting on a porch, posing for a photo.",
      "suggestions": [
        { "description": "Family waves at camera", "prompt": "The scene comes alive as the entire family waves enthusiastically at the camera. The father raises his arm high, the mother waves with both hands, and the children bounce excitedly. Their clothes rustle with movement, and warm sunlight dapples across the porch." },
        { "description": "Lively family conversation", "prompt": "The family breaks into animated conversation. The parents turn toward each other laughing, the children tug at their parents' sleeves wanting attention. Everyone is in motion - gesturing, leaning in, shoulders moving as they laugh together." }
      ]
    }`,
    `{
      "sceneDescription": "A couple standing in front of their house, dressed formally.",
      "suggestions": [
        { "description": "Couple waves and embraces", "prompt": "The couple waves warmly at the camera, then the man wraps his arm around the woman's waist pulling her closer. She leans into him, both smiling broadly. A gentle breeze moves her dress and his jacket. They look at each other briefly before turning back to camera." },
        { "description": "Playful moment together", "prompt": "The woman playfully adjusts the man's tie while he pretends to protest, both laughing. He catches her hands and they share a warm look before turning to face the camera together, still chuckling. Wind rustles the nearby bushes." }
      ]
    }`,
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

  log.warn(
    {
      imageId: params.imageId,
      err: lastError instanceof Error ? lastError.message : lastError,
      traceId: randomUUID(),
    },
    "Gemini analysis failed, returning empty suggestions"
  );

  return toAnalysisResult(params.imageId, { sceneDescription: "", suggestions: [] }, maxCount);
}
