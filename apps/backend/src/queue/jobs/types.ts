export type GenerationJobType = "analyze-image" | "generate-video";

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

export type GenerationJobPayload =
  | ({ type: "analyze-image" } & AnalyzeImageJobPayload)
  | ({ type: "generate-video" } & GenerateVideoJobPayload);
