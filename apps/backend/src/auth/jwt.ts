import { sign, verify, decode } from "hono/jwt";
import type { JWTPayload } from "hono/utils/jwt/types";

// JWT configuration from environment
const JWT_SECRET = process.env.JWT_SECRET || "dev-secret-change-in-production";
const JWT_EXPIRES_IN = parseInt(process.env.JWT_EXPIRES_IN || "86400", 10); // Default: 24 hours
const VIEW_JWT_EXPIRES_IN = parseInt(process.env.VIEW_JWT_EXPIRES_IN || "3600", 10); // Default: 1 hour

if (process.env.NODE_ENV === "production" && !process.env.JWT_SECRET) {
  throw new Error("JWT_SECRET environment variable must be set in production");
}

export type ProjectTokenRole = "editor" | "viewer";

export interface ProjectTokenPayload extends JWTPayload {
  project_id: string;
  slug: string;
  role?: ProjectTokenRole;
  iat: number;
  exp: number;
}

/**
 * Sign a JWT token for project access
 */
export async function signProjectToken(projectId: string, slug: string): Promise<string> {
  return signToken(projectId, slug, "editor", JWT_EXPIRES_IN);
}

/**
 * Sign a JWT token for viewer access
 */
export async function signViewToken(projectId: string, slug: string): Promise<string> {
  return signToken(projectId, slug, "viewer", VIEW_JWT_EXPIRES_IN);
}

function signToken(
  projectId: string,
  slug: string,
  role: ProjectTokenRole,
  expiresIn: number
): Promise<string> {
  const now = Math.floor(Date.now() / 1000);
  const payload: ProjectTokenPayload = {
    project_id: projectId,
    slug,
    role,
    iat: now,
    exp: now + expiresIn,
  };

  return sign(payload, JWT_SECRET);
}

/**
 * Verify and decode a JWT token
 * @throws {JwtTokenInvalid} if token is invalid
 * @throws {JwtTokenExpired} if token has expired
 */
export async function verifyProjectToken(token: string): Promise<ProjectTokenPayload> {
  const payload = await verify(token, JWT_SECRET);
  return payload as ProjectTokenPayload;
}

/**
 * Decode a JWT token without verification (use for inspection only)
 */
export function decodeToken(token: string): {
  header: { alg: string; typ: string };
  payload: ProjectTokenPayload;
} | null {
  try {
    const decoded = decode(token);
    return {
      header: decoded.header as { alg: string; typ: string },
      payload: decoded.payload as ProjectTokenPayload,
    };
  } catch {
    return null;
  }
}

/**
 * Extract bearer token from Authorization header
 */
export function extractBearerToken(authHeader: string | undefined): string | null {
  if (!authHeader) return null;

  const parts = authHeader.split(" ");
  if (parts.length !== 2 || parts[0].toLowerCase() !== "bearer") {
    return null;
  }

  return parts[1];
}

export { JWT_SECRET, JWT_EXPIRES_IN };
export { VIEW_JWT_EXPIRES_IN };
