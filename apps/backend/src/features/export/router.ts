import { Hono } from "hono";
import { z } from "zod";
import { zValidator } from "@hono/zod-validator";
import { requireProjectAuth } from "../../auth/middleware";
import { ERROR_CODES } from "@gazette/shared";
import { errorResponse } from "../shared/http";
import { buildHtmlExportZip } from "../../services/export.service";

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
    const body = new Uint8Array(result.buffer.byteLength);
    body.set(result.buffer);
    return c.body(body, 200, {
      "Content-Type": "application/zip",
      "Content-Disposition": `attachment; filename="${result.filename}"; filename*=UTF-8''${encoded}`,
      "Cache-Control": "no-store",
    });
  }
);

export { router as exportRouter };
