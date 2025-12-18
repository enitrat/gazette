import ky, { HTTPError } from "ky";

import { getAuthToken } from "./auth";

const baseUrl = import.meta.env.VITE_API_BASE_URL ?? "http://localhost:3000/api";

export const api = ky.create({
  prefixUrl: baseUrl.replace(/\/+$/, ""),
  credentials: "include",
  hooks: {
    beforeRequest: [
      (request) => {
        const token = getAuthToken();
        if (token) {
          request.headers.set("Authorization", `Bearer ${token}`);
        }
      },
    ],
  },
});

export type ApiErrorDetail = {
  field?: string;
  message?: string;
};

export type ApiErrorPayload = {
  error?: {
    code?: string;
    message?: string;
    details?: ApiErrorDetail[];
  };
};

export type ParsedApiError = {
  code?: string;
  message: string;
  fieldErrors?: Record<string, string>;
};

export async function parseApiError(error: unknown): Promise<ParsedApiError> {
  const fallbackMessage = "Something went wrong. Please try again.";

  if (error instanceof HTTPError) {
    const statusMessage = `Request failed (${error.response.status})`;

    try {
      const data = (await error.response.json()) as ApiErrorPayload;
      const fieldErrors: Record<string, string> = {};

      if (Array.isArray(data?.error?.details)) {
        for (const detail of data.error.details) {
          if (detail?.field && detail.message) {
            fieldErrors[detail.field] = detail.message;
          }
        }
      }

      return {
        code: data?.error?.code,
        message: data?.error?.message ?? statusMessage,
        fieldErrors: Object.keys(fieldErrors).length > 0 ? fieldErrors : undefined,
      };
    } catch {
      return { message: statusMessage };
    }
  }

  if (error instanceof Error) {
    return { message: error.message || fallbackMessage };
  }

  return { message: fallbackMessage };
}
