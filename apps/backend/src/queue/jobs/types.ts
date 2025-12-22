export type GenerationJobType = "analyze-image" | "generate-video" | "suggest-prompt";

export type AnalyzeImageJobPayload = {
  jobId: string;
  projectId: string;
  elementId: string;
  imageId: string;
};

export type GenerateVideoJobPayload = {
  jobId: string;
  projectId: string;
  elementId: string;
  imageId: string;
  promptOverride?: string | null;
};

// New job type for generating suggested prompts on image upload (no element required)
export type SuggestPromptJobPayload = {
  imageId: string;
};

export type GenerationJobPayload =
  | ({ type: "analyze-image" } & AnalyzeImageJobPayload)
  | ({ type: "generate-video" } & GenerateVideoJobPayload)
  | ({ type: "suggest-prompt" } & SuggestPromptJobPayload);
