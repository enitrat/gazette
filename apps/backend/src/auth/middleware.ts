import type { Context, Next } from "hono";
import { createMiddleware } from "hono/factory";
import { extractBearerToken, verifyProjectToken, type ProjectTokenPayload } from "./jwt";
import { AuthErrors } from "./errors";
import { getProjectById } from "../projects";

// Extend Hono's context to include auth info
declare module "hono" {
  interface ContextVariableMap {
    auth: ProjectTokenPayload;
    projectId: string;
  }
}

/**
 * JWT authentication middleware
 * Validates the JWT token and attaches auth info to context
 */
export const requireAuth = createMiddleware(async (c: Context, next: Next) => {
  const authHeader = c.req.header("Authorization");
  const token = extractBearerToken(authHeader);

  if (!token) {
    throw AuthErrors.MISSING_TOKEN();
  }

  try {
    const payload = await verifyProjectToken(token);
    c.set("auth", payload);
    c.set("projectId", payload.project_id);
    await next();
  } catch (error: unknown) {
    // Handle specific JWT errors from Hono
    if (error && typeof error === "object" && "name" in error) {
      const name = (error as { name: string }).name;
      if (name === "JwtTokenExpired") {
        throw AuthErrors.EXPIRED_TOKEN();
      }
      if (name === "JwtTokenInvalid" || name === "JwtTokenSignatureMismatched") {
        throw AuthErrors.INVALID_TOKEN();
      }
    }
    throw AuthErrors.INVALID_TOKEN();
  }
});

/**
 * Project access validation middleware
 * Ensures the authenticated user has access to the requested project
 * Must be used after requireAuth middleware
 */
export const requireProjectAccess = createMiddleware(async (c: Context, next: Next) => {
  const auth = c.get("auth");
  if (!auth) {
    throw AuthErrors.MISSING_TOKEN();
  }

  // Get project ID from URL params
  const projectId = c.req.param("projectId") || c.req.param("id");
  if (!projectId) {
    // No project ID in URL, skip validation
    await next();
    return;
  }

  // Verify the token's project_id matches the requested project
  if (auth.project_id !== projectId) {
    throw AuthErrors.ACCESS_DENIED();
  }

  // Optionally verify the project still exists
  const project = await getProjectById(projectId);

  if (!project) {
    throw AuthErrors.PROJECT_NOT_FOUND();
  }

  await next();
});

/**
 * Combined auth middleware for project routes
 * Validates JWT and ensures project access in one step
 */
export const requireProjectAuth = createMiddleware(async (c: Context, next: Next) => {
  const authHeader = c.req.header("Authorization");
  const token = extractBearerToken(authHeader);

  if (!token) {
    throw AuthErrors.MISSING_TOKEN();
  }

  let payload: ProjectTokenPayload;
  try {
    payload = await verifyProjectToken(token);
  } catch (error: unknown) {
    if (error && typeof error === "object" && "name" in error) {
      const name = (error as { name: string }).name;
      if (name === "JwtTokenExpired") {
        throw AuthErrors.EXPIRED_TOKEN();
      }
    }
    throw AuthErrors.INVALID_TOKEN();
  }

  // Get project ID from URL params
  const projectId = c.req.param("projectId") || c.req.param("id");

  // If projectId is in URL, validate access
  if (projectId && payload.project_id !== projectId) {
    throw AuthErrors.ACCESS_DENIED();
  }

  // Verify project exists
  const targetProjectId = projectId || payload.project_id;
  const project = await getProjectById(targetProjectId);

  if (!project) {
    throw AuthErrors.PROJECT_NOT_FOUND();
  }

  c.set("auth", payload);
  c.set("projectId", payload.project_id);
  await next();
});
