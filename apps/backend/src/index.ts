import { Hono } from "hono";
import { cors } from "hono/cors";
import { logger } from "hono/logger";
import { secureHeaders } from "hono/secure-headers";
import { requestId } from "hono/request-id";
import { HTTPException } from "hono/http-exception";
import { AuthError } from "./auth";
import { projectsRouter } from "./routes/projects";
import { imagesRouter } from "./routes/images";
import { elementsRouter } from "./routes/elements";
import { templatesRouter } from "./routes/templates";
import pagesRouter from "./routes/pages";
import { systemRouter } from "./features/system/router";
import { viewRouter } from "./routes/view";

// Environment configuration
const PORT = parseInt(process.env.PORT || "3000", 10);
const NODE_ENV = process.env.NODE_ENV || "development";
const CORS_ORIGIN = process.env.CORS_ORIGIN || "http://localhost:5173";

// Create Hono app
export const app = new Hono();

// Middleware
app.use("*", requestId());
app.use("*", logger());
app.use("*", secureHeaders());
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
  console.error(`[ERROR] ${c.req.method} ${c.req.path}:`, err);

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
if (NODE_ENV === "development") {
  console.warn(`Starting server in ${NODE_ENV} mode...`);
  console.warn(`CORS origin: ${CORS_ORIGIN}`);
}

export default {
  port: PORT,
  fetch: app.fetch,
};
