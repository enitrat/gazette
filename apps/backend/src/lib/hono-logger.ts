import type { MiddlewareHandler } from "hono";
import { createLogger } from "./logger";

const httpLogger = createLogger("http");

/**
 * Custom Hono middleware that logs HTTP requests using Pino
 * Logs both to console (pretty) and to file (JSON)
 */
export const pinoLogger = (): MiddlewareHandler => {
  return async (c, next) => {
    const start = Date.now();
    const requestId = c.get("requestId") as string | undefined;

    const { method, path } = c.req;
    const url = c.req.url;

    // Log incoming request
    httpLogger.info(
      {
        requestId,
        type: "request",
        method,
        path,
        url,
        userAgent: c.req.header("user-agent"),
      },
      `→ ${method} ${path}`
    );

    await next();

    // Log response
    const duration = Date.now() - start;
    const status = c.res.status;

    const logData = {
      requestId,
      type: "response",
      method,
      path,
      status,
      duration,
    };

    if (status >= 500) {
      httpLogger.error(logData, `← ${method} ${path} ${status} ${duration}ms`);
    } else if (status >= 400) {
      httpLogger.warn(logData, `← ${method} ${path} ${status} ${duration}ms`);
    } else {
      httpLogger.info(logData, `← ${method} ${path} ${status} ${duration}ms`);
    }
  };
};
