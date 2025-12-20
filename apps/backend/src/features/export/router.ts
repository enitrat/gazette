import { Hono } from "hono";
import { z } from "zod";
import { zValidator } from "@hono/zod-validator";
import { requireProjectAuth } from "../../auth/middleware";
import { ERROR_CODES } from "@gazette/shared";
import { errorResponse } from "../shared/http";
import { buildHtmlExportZip, buildVideoExportZip, buildPdfExport, buildVideoSlideshowExport } from "../../services/export.service";

const router = new Hono();

const projectIdParams = z.object({
  id: z.string().uuid(),
});

const handleValidationError = (result: unknown) => {
  if (
    typeof result === "object" &&
    result !== null &&
    "success" in result &&
    !(result as { success: boolean }).success
  ) {
    return {
      error: {
        code: ERROR_CODES.VALIDATION_ERROR,
        message: "Invalid input",
        details: (result as { error?: { flatten?: () => unknown } }).error?.flatten?.(),
      },
    };
  }
  return null;
};

const streamBuffer = (buffer: Uint8Array) =>
  new ReadableStream<Uint8Array>({
    start(controller) {
      const chunkSize = 64 * 1024;
      for (let offset = 0; offset < buffer.length; offset += chunkSize) {
        controller.enqueue(buffer.slice(offset, offset + chunkSize));
      }
      controller.close();
    },
  });

router.get(
  "/projects/:id/export/html",
  requireProjectAuth,
  zValidator("param", projectIdParams, (result, c) => {
    const payload = handleValidationError(result);
    if (payload) {
      return c.json(payload, 400);
    }
  }),
  async (c) => {
    const projectId = c.req.param("id");

    const result = await buildHtmlExportZip(projectId);
    if (!result) {
      return errorResponse(c, 404, ERROR_CODES.PROJECT_NOT_FOUND, "Project not found");
    }

    const encoded = encodeURIComponent(result.filename);
    return c.body(streamBuffer(result.buffer), 200, {
      "Content-Type": "application/zip",
      "Content-Disposition": `attachment; filename="${result.filename}"; filename*=UTF-8''${encoded}`,
      "Cache-Control": "no-store",
    });
  }
);

router.get(
  "/projects/:id/export/videos",
  requireProjectAuth,
  zValidator("param", projectIdParams, (result, c) => {
    const payload = handleValidationError(result);
    if (payload) {
      return c.json(payload, 400);
    }
  }),
  async (c) => {
    const projectId = c.req.param("id");

    const result = await buildVideoExportZip(projectId);
    if (!result) {
      return errorResponse(c, 404, ERROR_CODES.PROJECT_NOT_FOUND, "Project not found");
    }

    const encoded = encodeURIComponent(result.filename);
    return c.body(streamBuffer(result.buffer), 200, {
      "Content-Type": "application/zip",
      "Content-Disposition": `attachment; filename="${result.filename}"; filename*=UTF-8''${encoded}`,
      "Cache-Control": "no-store",
    });
  }
);

router.get(
  "/projects/:id/export/pdf",
  requireProjectAuth,
  zValidator("param", projectIdParams, (result, c) => {
    const payload = handleValidationError(result);
    if (payload) {
      return c.json(payload, 400);
    }
  }),
  async (c) => {
    const projectId = c.req.param("id");

    const result = await buildPdfExport(projectId);
    if (!result) {
      return errorResponse(c, 404, ERROR_CODES.PROJECT_NOT_FOUND, "Project not found");
    }

    const encoded = encodeURIComponent(result.filename);
    return c.body(streamBuffer(result.buffer), 200, {
      "Content-Type": "application/pdf",
      "Content-Disposition": `attachment; filename="${result.filename}"; filename*=UTF-8''${encoded}`,
      "Cache-Control": "no-store",
    });
  }
);

router.get(
  "/projects/:id/export/slideshow",
  requireProjectAuth,
  zValidator("param", projectIdParams, (result, c) => {
    const payload = handleValidationError(result);
    if (payload) {
      return c.json(payload, 400);
    }
  }),
  async (c) => {
    const projectId = c.req.param("id");

    const result = await buildVideoSlideshowExport(projectId);
    if (!result) {
      return errorResponse(c, 404, ERROR_CODES.PROJECT_NOT_FOUND, "Project not found");
    }

    const encoded = encodeURIComponent(result.filename);
    return c.body(streamBuffer(result.buffer), 200, {
      "Content-Type": "video/mp4",
      "Content-Disposition": `attachment; filename="${result.filename}"; filename*=UTF-8''${encoded}`,
      "Cache-Control": "no-store",
    });
  }
);

export { router as exportRouter };
