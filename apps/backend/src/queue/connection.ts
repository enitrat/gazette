import { Redis } from "ioredis";

const DEFAULT_REDIS_URL = "redis://localhost:6379";

export const getRedisUrl = () => process.env.REDIS_URL || DEFAULT_REDIS_URL;

export const createRedisConnection = () =>
  new Redis(getRedisUrl(), {
    maxRetriesPerRequest: null,
  });
