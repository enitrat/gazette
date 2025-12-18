import type { Element } from '../schemas/element';

// Make specific properties optional
export type PartialBy<T, K extends keyof T> = Omit<T, K> & Partial<Pick<T, K>>;

// Make specific properties required
export type RequiredBy<T, K extends keyof T> = Omit<T, K> & Required<Pick<T, K>>;

// Extract element type from union
export type ImageElementType = Extract<Element, { type: 'image' }>;
export type TextElementType = Exclude<Element, { type: 'image' }>;

// API response wrapper
export type ApiResponse<T> = {
  data: T;
  meta?: {
    total?: number;
    page?: number;
    limit?: number;
  };
};

// API error response
export type ApiError = {
  error: {
    code: string;
    message: string;
    details?: Array<{
      field: string;
      message: string;
    }>;
  };
};

// Utility type for creating partial updates
export type UpdateInput<T> = Partial<Omit<T, 'id' | 'createdAt' | 'updatedAt'>>;

// Result type for validation functions
export type ValidationResult<T> =
  | { success: true; data: T }
  | { success: false; error: { issues: Array<{ path: (string | number)[]; message: string }> } };

// Pagination parameters
export type PaginationParams = {
  page?: number;
  limit?: number;
  offset?: number;
};

// Paginated response
export type PaginatedResponse<T> = ApiResponse<T[]> & {
  meta: {
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  };
};
