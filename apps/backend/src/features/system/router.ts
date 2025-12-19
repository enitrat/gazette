import { Hono } from "hono";
import { db } from "../../db";

const NODE_ENV = process.env.NODE_ENV || "development";

export const systemRouter = new Hono();

systemRouter.get("/health", async (c) => {
  try {
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

systemRouter.get("/", (c) => {
  return c.json({
    name: "La Gazette de la Vie API",
    version: "0.0.1",
    documentation: "/docs",
  });
});
