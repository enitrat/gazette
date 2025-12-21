import { API_BASE_URL } from "./constants";
import {
  PagesListResponseSchema,
  CreatePageResponseSchema,
  UpdatePageResponseSchema,
  ElementsListResponseSchema,
  CreateElementResponseSchema,
  UpdateElementResponseSchema,
  ImagesListResponseSchema,
  VideosListResponseSchema,
  TemplatesListResponseSchema,
  StartPageGenerationResponseSchema,
  GenerationJobResponseSchema,
  GenerationStatusResponseSchema,
  AccessProjectResponseSchema,
  GetProjectResponseSchema,
  ViewAccessResponseSchema,
  ViewProjectResponseSchema,
  type PageListItem,
  type CreatePageResponse,
  type UpdatePageResponse,
  type SerializedElement,
  type SerializedImage,
  type SerializedVideo,
  type GenerationJobResponse,
  type AccessProjectResponse,
  type GetProjectResponse,
  type ViewProjectResponse,
} from "@gazette/shared";
import type { Image, TemplateDefinition } from "@gazette/shared";
import {
  apiClient,
  validatedGet,
  validatedPost,
  validatedPut,
  validatedDelete,
} from "./validated-fetch";

// Re-export types for use in components
export type { PageListItem, SerializedElement, ViewProjectResponse };

// Simplified Project type for frontend use (without passwordHash)
export type FrontendProject = Omit<AccessProjectResponse, "token">;

// Project endpoints
export const projects = {
  create: async (
    name: string,
    password: string
  ): Promise<{ token: string; project: FrontendProject }> => {
    const response = await validatedPost("projects", AccessProjectResponseSchema, {
      name,
      password,
    });
    const { token, ...project } = response;
    return { token, project };
  },

  access: async (
    name: string,
    password: string
  ): Promise<{ token: string; project: FrontendProject }> => {
    const response = await validatedPost("projects/access", AccessProjectResponseSchema, {
      name,
      password,
    });
    const { token, ...project } = response;
    return { token, project };
  },

  get: async (id: string): Promise<GetProjectResponse> => {
    return validatedGet(`projects/${id}`, GetProjectResponseSchema);
  },
};

// Page endpoints
export const pages = {
  list: async (projectId: string): Promise<PageListItem[]> => {
    const response = await validatedGet(`projects/${projectId}/pages`, PagesListResponseSchema);
    return response.pages;
  },

  create: async (projectId: string, templateId?: string): Promise<CreatePageResponse> => {
    return validatedPost(`projects/${projectId}/pages`, CreatePageResponseSchema, { templateId });
  },

  update: async (
    pageId: string,
    data: Partial<UpdatePageResponse>
  ): Promise<UpdatePageResponse> => {
    return validatedPut(`pages/${pageId}`, UpdatePageResponseSchema, data);
  },

  delete: async (pageId: string): Promise<void> => {
    await validatedDelete(`pages/${pageId}`);
  },

  reorder: async (projectId: string, pageIds: string[]): Promise<void> => {
    await apiClient.patch("pages/reorder", { json: { projectId, pageIds } });
  },
};

// Element endpoints
export const elements = {
  list: async (pageId: string): Promise<SerializedElement[]> => {
    const response = await validatedGet(`pages/${pageId}/elements`, ElementsListResponseSchema);
    return response.elements;
  },

  create: async (pageId: string, data: Partial<SerializedElement>): Promise<SerializedElement> => {
    return validatedPost(`pages/${pageId}/elements`, CreateElementResponseSchema, data);
  },

  update: async (
    elementId: string,
    data: Partial<SerializedElement>
  ): Promise<SerializedElement> => {
    return validatedPut(`elements/${elementId}`, UpdateElementResponseSchema, data);
  },

  delete: async (elementId: string): Promise<void> => {
    await validatedDelete(`elements/${elementId}`);
  },
};

// Image endpoints
export const images = {
  list: async (projectId: string): Promise<SerializedImage[]> => {
    const response = await validatedGet(`projects/${projectId}/images`, ImagesListResponseSchema);
    return response.images;
  },

  upload: async (projectId: string, file: File): Promise<Image> => {
    const formData = new FormData();
    formData.append("image", file);
    return apiClient.post(`projects/${projectId}/images`, { body: formData }).json();
  },

  get: async (imageId: string): Promise<Image> => {
    return apiClient.get(`images/${imageId}`).json();
  },

  getUrl: (imageId: string): string => {
    return `${API_BASE_URL}/images/${imageId}/file`;
  },
};

// Video endpoints
export const videos = {
  list: async (projectId: string): Promise<SerializedVideo[]> => {
    const response = await validatedGet(`projects/${projectId}/videos`, VideosListResponseSchema);
    return response.videos;
  },

  upload: async (
    projectId: string,
    file: File
  ): Promise<{ id: string; url: string; filename: string }> => {
    const formData = new FormData();
    formData.append("video", file);
    return apiClient.post(`projects/${projectId}/videos`, { body: formData }).json();
  },

  getUrl: (videoUrl: string): string => {
    // videoUrl from backend is like "/api/videos/:id/file"
    // We need to prepend the base URL (without /api since videoUrl includes it)
    const baseWithoutApi = API_BASE_URL.replace(/\/api$/, "");
    return `${baseWithoutApi}${videoUrl}`;
  },

  getDownloadUrl: (videoId: string): string => {
    const baseWithoutApi = API_BASE_URL.replace(/\/api$/, "");
    return `${baseWithoutApi}/api/videos/${videoId}/file`;
  },
};

// Generation endpoints
export const generation = {
  generatePage: async (pageId: string) => {
    return validatedPost(`pages/${pageId}/generate`, StartPageGenerationResponseSchema, undefined);
  },

  getStatus: async (jobId: string): Promise<GenerationJobResponse> => {
    return validatedGet(`generation/${jobId}`, GenerationJobResponseSchema);
  },

  getProjectStatus: async (projectId: string) => {
    const response = await validatedGet(
      `projects/${projectId}/generation/status`,
      GenerationStatusResponseSchema
    );
    return response.jobs;
  },

  retryJob: async (
    jobId: string
  ): Promise<{ id: string; elementId: string; status: string; retriedFrom: string }> => {
    return apiClient.post(`generation/${jobId}/retry`).json();
  },
};

// Template endpoints
export const templates = {
  list: async (): Promise<TemplateDefinition[]> => {
    const response = await validatedGet("templates", TemplatesListResponseSchema);
    return response.templates;
  },
};

// Viewer endpoints
export const viewer = {
  access: async (slug: string, password?: string) => {
    return validatedPost(`view/${slug}/access`, ViewAccessResponseSchema, { password });
  },

  get: async (slug: string): Promise<ViewProjectResponse> => {
    return validatedGet(`view/${slug}`, ViewProjectResponseSchema);
  },
};

// Export endpoints - use longer timeouts for exports that involve rendering
export const exports = {
  html: async (projectId: string): Promise<Blob> => {
    return apiClient.get(`projects/${projectId}/export/html`, { timeout: 120000 }).blob();
  },

  videos: async (projectId: string): Promise<Blob> => {
    return apiClient.get(`projects/${projectId}/export/videos`, { timeout: 60000 }).blob();
  },

  pdf: async (projectId: string): Promise<Blob> => {
    // PDF generation with Puppeteer can take time
    return apiClient.get(`projects/${projectId}/export/pdf`, { timeout: 120000 }).blob();
  },

  slideshow: async (projectId: string): Promise<Blob> => {
    // Video slideshow generation can take several minutes
    return apiClient.get(`projects/${projectId}/export/slideshow`, { timeout: 300000 }).blob();
  },
};

// Re-export everything as default for convenience
export default {
  projects,
  pages,
  elements,
  images,
  videos,
  generation,
  templates,
  viewer,
  exports,
};
