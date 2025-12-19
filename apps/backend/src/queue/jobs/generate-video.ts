import type { GenerateVideoJobPayload } from "./types";

const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

export async function generateVideoJob(_payload: GenerateVideoJobPayload) {
  const mockUrl = process.env.WAN_MOCK_VIDEO_URL;
  if (mockUrl) {
    await sleep(1500);
    return { videoUrl: mockUrl };
  }

  throw new Error("WAN client not configured (set WAN_MOCK_VIDEO_URL for dev)");
}
