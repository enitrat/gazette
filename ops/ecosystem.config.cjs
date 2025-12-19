/* eslint-env node */
/* eslint-disable @typescript-eslint/no-require-imports */
const path = require("path");

const appRoot = path.resolve(__dirname, "..");
const backendDir = path.join(appRoot, "apps", "backend");

const sharedEnv = {
  NODE_ENV: "production",
  PORT: process.env.PORT || "3000",
  CORS_ORIGIN: process.env.CORS_ORIGIN || "https://gazette.example.com",
  DATABASE_URL: process.env.DATABASE_URL || "/var/lib/gazette/gazette.db",
  REDIS_URL: process.env.REDIS_URL || "redis://127.0.0.1:6379",
  UPLOAD_DIR: process.env.UPLOAD_DIR || "/var/lib/gazette/uploads",
  APP_URL: process.env.APP_URL || "https://gazette.example.com",
  PUBLIC_APP_URL: process.env.PUBLIC_APP_URL || "https://gazette.example.com",
  JWT_SECRET: process.env.JWT_SECRET,
  WAN_API_KEY: process.env.WAN_API_KEY,
  WAN_API_URL: process.env.WAN_API_URL,
  GEMINI_API_KEY: process.env.GEMINI_API_KEY,
};

module.exports = {
  apps: [
    {
      name: "gazette-api",
      cwd: backendDir,
      script: "bun",
      args: "run dist/index.js",
      instances: 1,
      autorestart: true,
      watch: false,
      max_memory_restart: "600M",
      env: sharedEnv,
    },
    {
      name: "gazette-worker",
      cwd: backendDir,
      script: "bun",
      args: "run dist/queue/worker.js",
      instances: 1,
      autorestart: true,
      watch: false,
      max_memory_restart: "600M",
      env: sharedEnv,
    },
  ],
};
