import { HTTPException } from "hono/http-exception";

export class AuthError extends HTTPException {
  constructor(
    status: 401 | 403,
    public code: string,
    message: string
  ) {
    super(status, { message });
    this.name = "AuthError";
  }
}

export class UnauthorizedError extends AuthError {
  constructor(code: string, message: string) {
    super(401, code, message);
    this.name = "UnauthorizedError";
  }
}

export class ForbiddenError extends AuthError {
  constructor(code: string, message: string) {
    super(403, code, message);
    this.name = "ForbiddenError";
  }
}

// Specific auth error types
export const AuthErrors = {
  MISSING_TOKEN: () => new UnauthorizedError("MISSING_TOKEN", "Authentication token is required"),

  INVALID_TOKEN: () => new UnauthorizedError("INVALID_TOKEN", "Authentication token is invalid"),

  EXPIRED_TOKEN: () => new UnauthorizedError("EXPIRED_TOKEN", "Authentication token has expired"),

  INVALID_CREDENTIALS: () =>
    new UnauthorizedError("INVALID_CREDENTIALS", "Invalid name or password"),

  PROJECT_NOT_FOUND: () => new UnauthorizedError("PROJECT_NOT_FOUND", "Project not found"),

  ACCESS_DENIED: () =>
    new ForbiddenError("ACCESS_DENIED", "You do not have access to this project"),
} as const;
