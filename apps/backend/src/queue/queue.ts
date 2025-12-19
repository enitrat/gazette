import { Queue } from "bullmq";
import { createRedisConnection } from "./connection";
import type { GenerationJobPayload } from "./jobs/types";

export const GENERATION_QUEUE_NAME = "generation";

export const generationQueue = new Queue<GenerationJobPayload>(GENERATION_QUEUE_NAME, {
  connection: createRedisConnection(),
  defaultJobOptions: {
    attempts: 3,
    backoff: { type: "exponential", delay: 1000 },
    removeOnComplete: { count: 1000 },
    removeOnFail: { count: 5000 },
  },
});
