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
  prompt: string;
};

export type GenerationJobPayload =
  | ({ type: "analyze-image" } & AnalyzeImageJobPayload)
  | ({ type: "generate-video" } & GenerateVideoJobPayload);
