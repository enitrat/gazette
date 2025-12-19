import { Buffer } from "node:buffer";
import { join } from "node:path";
import { fileURLToPath } from "node:url";
import { eq } from "drizzle-orm";
import { db, schema } from "../../db";
import { analyzeImage } from "../../lib/gemini-client";
import type { AnalyzeImageJobPayload } from "./types";

const appRoot = fileURLToPath(new URL("../../..", import.meta.url));

export async function analyzeImageJob(payload: AnalyzeImageJobPayload) {
  const image = db.select().from(schema.images).where(eq(schema.images.id, payload.imageId)).get();
  if (!image) {
    throw new Error("Image not found for analysis job");
  }

  const normalizedPath = image.storagePath.startsWith("/")
    ? image.storagePath.slice(1)
    : image.storagePath;
  const imagePath = join(appRoot, normalizedPath);
  const file = Bun.file(imagePath);
  if (!(await file.exists())) {
    throw new Error("Image file not found for analysis job");
  }

  const imageData = Buffer.from(await file.arrayBuffer());
  return analyzeImage({
    imageId: payload.imageId,
    mimeType: image.mimeType,
    imageData,
  });
}
