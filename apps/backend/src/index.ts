import { Hono } from "hono";
import { cors } from "hono/cors";
import { secureHeaders } from "hono/secure-headers";
import { requestId } from "hono/request-id";
import { HTTPException } from "hono/http-exception";
import { AuthError } from "./auth";
import { projectsRouter } from "./routes/projects";
import { imagesRouter } from "./routes/images";
import { elementsRouter } from "./routes/elements";
import { templatesRouter } from "./routes/templates";
import { generationRouter } from "./routes/generation";
import pagesRouter from "./routes/pages";
import { systemRouter } from "./features/system/router";
import { viewRouter } from "./routes/view";
import { exportRouter } from "./routes/export";
import { pinoLogger } from "./lib/hono-logger";
import { createLogger } from "./lib/logger";

const serverLog = createLogger("server");

// Environment configuration
const PORT = parseInt(process.env.PORT || "3000", 10);
const NODE_ENV = process.env.NODE_ENV || "development";
const CORS_ORIGIN = process.env.CORS_ORIGIN || "http://localhost:5173";

// Create Hono app
export const app = new Hono();

// Middleware
app.use("*", requestId());
app.use("*", pinoLogger());
app.use(
  "*",
  secureHeaders({
    crossOriginResourcePolicy: "cross-origin",
    crossOriginEmbedderPolicy: false,
  })
);
app.use(
  "*",
  cors({
    origin: CORS_ORIGIN.split(","),
    allowMethods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
    allowHeaders: ["Content-Type", "Authorization", "X-Request-Id"],
    exposeHeaders: ["X-Request-Id"],
    maxAge: 86400,
    credentials: true,
  })
);

// API routes
app.route("/api", pagesRouter);
app.route("/api/projects", projectsRouter);
app.route("/api", templatesRouter);
app.route("/api", imagesRouter);
app.route("/api", elementsRouter);
app.route("/api", viewRouter);
app.route("/api", generationRouter);
app.route("/api", exportRouter);
app.route("/", systemRouter);

// 404 handler
app.notFound((c) => {
  return c.json(
    {
      error: {
        code: "NOT_FOUND",
        message: `Route ${c.req.method} ${c.req.path} not found`,
      },
    },
    404
  );
});

// Error handler
app.onError((err, c) => {
  // Handle authentication errors
  if (err instanceof AuthError) {
    return c.json(
      {
        error: {
          code: err.code,
          message: err.message,
        },
      },
      err.status
    );
  }

  // Handle other HTTP exceptions
  if (err instanceof HTTPException) {
    return c.json(
      {
        error: {
          code: "HTTP_ERROR",
          message: err.message,
        },
      },
      err.status
    );
  }

  // Log unexpected errors
  serverLog.error({ err, method: c.req.method, path: c.req.path }, "Unhandled error");

  return c.json(
    {
      error: {
        code: "INTERNAL_ERROR",
        message: NODE_ENV === "production" ? "Internal server error" : err.message,
      },
    },
    500
  );
});

// Start server
serverLog.info(
  { port: PORT, env: NODE_ENV, corsOrigin: CORS_ORIGIN },
  `Server starting on port ${PORT}`
);

export default {
  port: PORT,
  fetch: app.fetch,
};
