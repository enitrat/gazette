import { Hono } from "hono";
import { cors } from "hono/cors";
import { logger } from "hono/logger";
import { secureHeaders } from "hono/secure-headers";
import { requestId } from "hono/request-id";
import { db } from "./db";

// Environment configuration
const PORT = parseInt(process.env.PORT || "3000", 10);
const NODE_ENV = process.env.NODE_ENV || "development";
const CORS_ORIGIN = process.env.CORS_ORIGIN || "http://localhost:5173";

// Create Hono app
const app = new Hono();

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

// Health check endpoint
app.get("/health", async (c) => {
  try {
    // Test database connection
    const result = db.$client.query("SELECT 1 as ok").get() as { ok: number };
    const dbHealthy = result?.ok === 1;

    return c.json({
      status: dbHealthy ? "healthy" : "unhealthy",
      timestamp: new Date().toISOString(),
      version: "0.0.1",
      environment: NODE_ENV,
      database: dbHealthy ? "connected" : "disconnected",
    });
  } catch (error) {
    return c.json(
      {
        status: "unhealthy",
        timestamp: new Date().toISOString(),
        version: "0.0.1",
        environment: NODE_ENV,
        database: "error",
        error: error instanceof Error ? error.message : "Unknown error",
      },
      503
    );
  }
});

// API root
app.get("/", (c) => {
  return c.json({
    name: "La Gazette de la Vie API",
    version: "0.0.1",
    documentation: "/docs",
  });
});

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
