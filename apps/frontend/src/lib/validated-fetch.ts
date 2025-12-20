import ky, { type KyInstance } from 'ky';
import { type z } from 'zod';
import { API_BASE_URL } from './constants';
import { useAuthStore } from '../stores/auth-store';

/**
 * Custom error class for API validation failures
 */
export class ApiValidationError extends Error {
  endpoint: string;
  validationErrors: unknown;
  responseData: unknown;

  constructor(endpoint: string, validationErrors: unknown, responseData: unknown) {
    super(`API validation failed for endpoint: ${endpoint}`);
    this.name = 'ApiValidationError';
    this.endpoint = endpoint;
    this.validationErrors = validationErrors;
    this.responseData = responseData;
  }
}

/**
 * Create ky instance with authentication and error handling
 */
const createApiClient = (): KyInstance => {
  return ky.create({
    prefixUrl: API_BASE_URL,
    hooks: {
      beforeRequest: [
        (request) => {
          // Get token from store
          const token = useAuthStore.getState().token;
          if (token) {
            request.headers.set('Authorization', `Bearer ${token}`);
          }
        },
      ],
      afterResponse: [
        async (_request, _options, response) => {
          // Handle 401 errors by logging out
          if (response.status === 401) {
            useAuthStore.getState().logout();
          }
        },
      ],
    },
  });
};

// Export the client instance
export const apiClient = createApiClient();

/**
 * Helper function to handle validation
 * - In DEV: throws ApiValidationError on validation failure
 * - In PROD: logs error but returns data anyway
 */
function handleValidation<T>(
  endpoint: string,
  schema: z.ZodType<T>,
  data: unknown
): T {
  const result = schema.safeParse(data);

  if (!result.success) {
    const isDev = import.meta.env.DEV;
    const errorMessage = `API validation failed for endpoint: ${endpoint}`;
    const validationErrors = result.error.format();

    if (isDev) {
      // In development: fail fast with detailed error
      console.error(errorMessage, {
        endpoint,
        validationErrors,
        responseData: data,
      });
      throw new ApiValidationError(endpoint, validationErrors, data);
    } else {
      // In production: log error but return data anyway
      console.warn(errorMessage, {
        endpoint,
        validationErrors,
        responseData: data,
      });
      return data as T;
    }
  }

  return result.data;
}

/**
 * Validated GET request
 * Fetches data from endpoint and validates response with Zod schema
 */
export async function validatedGet<T>(
  endpoint: string,
  schema: z.ZodType<T>
): Promise<T> {
  const response = await apiClient.get(endpoint).json();
  return handleValidation(endpoint, schema, response);
}

/**
 * Validated POST request
 * Posts data to endpoint and validates response with Zod schema
 */
export async function validatedPost<T>(
  endpoint: string,
  schema: z.ZodType<T>,
  body?: unknown
): Promise<T> {
  const response = await apiClient
    .post(endpoint, body ? { json: body } : undefined)
    .json();
  return handleValidation(endpoint, schema, response);
}

/**
 * Validated PUT request
 * Sends PUT request to endpoint and validates response with Zod schema
 */
export async function validatedPut<T>(
  endpoint: string,
  schema: z.ZodType<T>,
  body: unknown
): Promise<T> {
  const response = await apiClient.put(endpoint, { json: body }).json();
  return handleValidation(endpoint, schema, response);
}

/**
 * Validated PATCH request
 * Sends PATCH request to endpoint and validates response with Zod schema
 */
export async function validatedPatch<T>(
  endpoint: string,
  schema: z.ZodType<T>,
  body: unknown
): Promise<T> {
  const response = await apiClient.patch(endpoint, { json: body }).json();
  return handleValidation(endpoint, schema, response);
}

/**
 * Validated DELETE request
 * Sends DELETE request to endpoint (no schema validation needed)
 */
export async function validatedDelete(endpoint: string): Promise<void> {
  await apiClient.delete(endpoint);
}
