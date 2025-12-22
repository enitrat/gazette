import { Buffer } from "node:buffer";
import { isAbsolute, join } from "node:path";
import { fileURLToPath } from "node:url";
import { eq } from "drizzle-orm";
import { db, schema } from "../../db";
import { analyzeImage } from "../../lib/gemini-client";
import { createLogger } from "../../lib/logger";
import type { SuggestPromptJobPayload } from "./types";

const appRoot = fileURLToPath(new URL("../../..", import.meta.url));
const log = createLogger("suggest-prompt-job");

export async function suggestPromptJob(payload: SuggestPromptJobPayload) {
  const image = db.select().from(schema.images).where(eq(schema.images.id, payload.imageId)).get();

  if (!image) {
    log.warn({ imageId: payload.imageId }, "Image not found for suggest-prompt job");
    return { skipped: true, reason: "image_not_found" };
  }

  // Skip if already has suggestions
  if (image.suggestedPrompts) {
    log.debug({ imageId: payload.imageId }, "Image already has suggested prompts, skipping");
    return { skipped: true, reason: "already_has_prompts" };
  }

  const imagePath = isAbsolute(image.storagePath)
    ? image.storagePath
    : join(appRoot, image.storagePath);
  const file = Bun.file(imagePath);
  if (!(await file.exists())) {
    log.warn(
      { imageId: payload.imageId, imagePath },
      "Image file not found for suggest-prompt job"
    );
    return { skipped: true, reason: "file_not_found" };
  }

  log.info({ imageId: payload.imageId }, "Analyzing image for prompt suggestions");

  const imageData = Buffer.from(await file.arrayBuffer());
  const analysis = await analyzeImage({
    imageId: payload.imageId,
    mimeType: image.mimeType,
    imageData,
  });

  // Store all suggestions as JSON array (without the id field, just description and prompt)
  const suggestions = analysis.suggestions.map(({ description, prompt }) => ({
    description,
    prompt,
  }));

  if (suggestions.length > 0) {
    db.update(schema.images)
      .set({ suggestedPrompts: JSON.stringify(suggestions) })
      .where(eq(schema.images.id, payload.imageId))
      .run();

    log.info(
      { imageId: payload.imageId, suggestionCount: suggestions.length },
      "Stored suggested prompts for image"
    );
  } else {
    log.info({ imageId: payload.imageId }, "No prompt suggestions generated");
  }

  return {
    imageId: payload.imageId,
    suggestions,
    sceneDescription: analysis.sceneDescription,
    suggestionCount: suggestions.length,
  };
}
