import { Hono } from "hono";
import { z } from "zod";
import { zValidator } from "@hono/zod-validator";
import { eq, inArray, sql } from "drizzle-orm";
import {
  ERROR_CODES,
  JOB_STATUS,
  validateGenerationRequest,
  type GenerationElementInput,
} from "@gazette/shared";
import { requireAuth, requireProjectAuth } from "../../auth/middleware";
import { db, schema } from "../../db";
import { errorResponse } from "../shared/http";
import { generationQueue } from "../../queue/queue";

const router = new Hono();

const projectIdParams = z.object({
  id: z.string().uuid(),
});

const generationIdParams = z.object({
  id: z.string().uuid(),
});

const toIso = (value: Date | number | null | undefined) => {
  if (!value) return null;
  if (value instanceof Date) return value.toISOString();
  const ms = value > 1_000_000_000_000 ? value : value * 1000;
  return new Date(ms).toISOString();
};

const verifyGenerationInputs = async (projectId: string, inputs: GenerationElementInput[]) => {
  const elementIds = inputs.map((input) => input.elementId);
  const records = await db
    .select({
      elementId: schema.elements.id,
      elementType: schema.elements.type,
      elementImageId: schema.elements.imageId,
      pageProjectId: schema.pages.projectId,
    })
    .from(schema.elements)
    .innerJoin(schema.pages, eq(schema.elements.pageId, schema.pages.id))
    .where(inArray(schema.elements.id, elementIds));

  const recordMap = new Map(records.map((record) => [record.elementId, record]));
  for (const input of inputs) {
    const record = recordMap.get(input.elementId);
    if (!record) {
      return {
        ok: false,
        status: 404,
        code: ERROR_CODES.ELEMENT_NOT_FOUND,
        message: "Element not found",
      } as const;
    }
    if (record.pageProjectId !== projectId) {
      return {
        ok: false,
        status: 403,
        code: ERROR_CODES.UNAUTHORIZED,
        message: "Element does not belong to this project",
      } as const;
    }
    if (record.elementType !== "image") {
      return {
        ok: false,
        status: 400,
        code: ERROR_CODES.VALIDATION_ERROR,
        message: "Only image elements can be generated",
      } as const;
    }
    if (!record.elementImageId || record.elementImageId !== input.imageId) {
      return {
        ok: false,
        status: 400,
        code: ERROR_CODES.VALIDATION_ERROR,
        message: "Element image does not match requested image",
      } as const;
    }
  }

  return { ok: true } as const;
};

router.post(
  "/projects/:id/generate",
  requireProjectAuth,
  zValidator("param", projectIdParams),
  async (c) => {
    const projectId = c.req.param("id");
    let body: unknown;
    try {
      body = await c.req.json();
    } catch {
      return errorResponse(c, 400, ERROR_CODES.VALIDATION_ERROR, "Invalid generation payload");
    }
    const validation = validateGenerationRequest(body);
    if (!validation.success) {
      return errorResponse(
        c,
        400,
        ERROR_CODES.VALIDATION_ERROR,
        "Invalid generation payload",
        validation.error.flatten()
      );
    }

    const elements = validation.data.elements;
    const verified = await verifyGenerationInputs(projectId, elements);
    if (!verified.ok) {
      return errorResponse(c, verified.status, verified.code, verified.message);
    }

    const jobs = elements.map((item) => ({
      id: crypto.randomUUID(),
      elementId: item.elementId,
      imageId: item.imageId,
      prompt: item.prompt,
      status: JOB_STATUS.QUEUED,
      progress: 0,
    }));

    await db.transaction(async (tx) => {
      for (const job of jobs) {
        await tx.insert(schema.generationJobs).values({
          id: job.id,
          elementId: job.elementId,
          imageId: job.imageId,
          prompt: job.prompt,
          status: job.status,
          progress: job.progress,
        });

        await tx
          .update(schema.elements)
          .set({
            animationPrompt: job.prompt,
            videoStatus: "pending",
            updatedAt: sql`(unixepoch())`,
          })
          .where(eq(schema.elements.id, job.elementId))
          .run();
      }
    });

    for (const job of jobs) {
      try {
        await generationQueue.add(
          "generate-video",
          {
            type: "generate-video",
            jobId: job.id,
            projectId,
            elementId: job.elementId,
            imageId: job.imageId,
            prompt: job.prompt,
          },
          {
            jobId: job.id,
          }
        );
      } catch (error) {
        const message = error instanceof Error ? error.message : "Queue enqueue failed";
        await db
          .update(schema.generationJobs)
          .set({
            status: JOB_STATUS.FAILED,
            error: message,
            updatedAt: sql`(unixepoch())`,
          })
          .where(eq(schema.generationJobs.id, job.id))
          .run();
      }
    }

    return c.json(
      {
        projectId,
        jobCount: jobs.length,
        estimatedDuration: jobs.length * 60,
        jobs: jobs.map((job) => ({
          id: job.id,
          elementId: job.elementId,
          status: job.status,
        })),
      },
      202
    );
  }
);

router.get("/generation/:id", requireAuth, zValidator("param", generationIdParams), async (c) => {
  const jobId = c.req.param("id");
  const projectId = c.get("projectId");

  const record = await db
    .select({
      job: schema.generationJobs,
      pageProjectId: schema.pages.projectId,
    })
    .from(schema.generationJobs)
    .innerJoin(schema.elements, eq(schema.generationJobs.elementId, schema.elements.id))
    .innerJoin(schema.pages, eq(schema.elements.pageId, schema.pages.id))
    .where(eq(schema.generationJobs.id, jobId))
    .get();

  if (!record) {
    return errorResponse(c, 404, ERROR_CODES.NOT_FOUND, "Generation job not found");
  }
  if (record.pageProjectId !== projectId) {
    return errorResponse(c, 403, ERROR_CODES.UNAUTHORIZED, "Access denied");
  }

  const job = record.job;
  return c.json({
    id: job.id,
    elementId: job.elementId,
    imageId: job.imageId,
    prompt: job.prompt,
    status: job.status,
    progress: job.progress,
    videoUrl: job.videoUrl ?? null,
    error: job.error ?? null,
    createdAt: toIso(job.createdAt),
    updatedAt: toIso(job.updatedAt),
  });
});

router.get(
  "/projects/:id/generation/status",
  requireProjectAuth,
  zValidator("param", projectIdParams),
  async (c) => {
    const projectId = c.req.param("id");

    const records = await db
      .select({
        job: schema.generationJobs,
        projectId: schema.pages.projectId,
      })
      .from(schema.generationJobs)
      .innerJoin(schema.elements, eq(schema.generationJobs.elementId, schema.elements.id))
      .innerJoin(schema.pages, eq(schema.elements.pageId, schema.pages.id))
      .where(eq(schema.pages.projectId, projectId));

    const jobs = records.map((record) => record.job);
    const totals = {
      totalJobs: jobs.length,
      completed: jobs.filter((job) => job.status === JOB_STATUS.COMPLETE).length,
      processing: jobs.filter((job) => job.status === JOB_STATUS.PROCESSING).length,
      queued: jobs.filter((job) => job.status === JOB_STATUS.QUEUED).length,
      failed: jobs.filter((job) => job.status === JOB_STATUS.FAILED).length,
    };

    return c.json({
      projectId,
      ...totals,
      jobs: jobs.map((job) => ({
        id: job.id,
        elementId: job.elementId,
        status: job.status,
        progress: job.progress,
        videoUrl: job.videoUrl ?? null,
        error: job.error ?? null,
      })),
    });
  }
);

router.delete(
  "/generation/:id",
  requireAuth,
  zValidator("param", generationIdParams),
  async (c) => {
    const jobId = c.req.param("id");
    const projectId = c.get("projectId");

    const record = await db
      .select({
        job: schema.generationJobs,
        pageProjectId: schema.pages.projectId,
      })
      .from(schema.generationJobs)
      .innerJoin(schema.elements, eq(schema.generationJobs.elementId, schema.elements.id))
      .innerJoin(schema.pages, eq(schema.elements.pageId, schema.pages.id))
      .where(eq(schema.generationJobs.id, jobId))
      .get();

    if (!record) {
      return errorResponse(c, 404, ERROR_CODES.NOT_FOUND, "Generation job not found");
    }
    if (record.pageProjectId !== projectId) {
      return errorResponse(c, 403, ERROR_CODES.UNAUTHORIZED, "Access denied");
    }
    if (record.job.status !== JOB_STATUS.QUEUED) {
      return errorResponse(
        c,
        400,
        ERROR_CODES.VALIDATION_ERROR,
        "Job already processing or completed"
      );
    }

    await generationQueue.remove(jobId);
    await db
      .update(schema.generationJobs)
      .set({
        status: JOB_STATUS.FAILED,
        error: "Cancelled by user",
        updatedAt: sql`(unixepoch())`,
      })
      .where(eq(schema.generationJobs.id, jobId))
      .run();

    await db
      .update(schema.elements)
      .set({
        videoStatus: "failed",
        updatedAt: sql`(unixepoch())`,
      })
      .where(eq(schema.elements.id, record.job.elementId))
      .run();

    return c.body(null, 204);
  }
);

export const generationRouter = router;
