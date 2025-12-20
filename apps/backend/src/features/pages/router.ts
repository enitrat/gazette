import type { Context } from "hono";
import { Hono } from "hono";
import { z } from "zod";
import { zValidator } from "@hono/zod-validator";
import { and, eq, gt, gte, lt, lte, ne, sql } from "drizzle-orm";
import { db, schema } from "../../db";
import { AuthErrors, requireAuth, requireProjectAuth } from "../../auth";
import { CreatePageSchema, UpdatePageSchema, ERROR_CODES } from "@gazette/shared";
import { initializeTemplateElements } from "../templates/definitions";

const router = new Hono();

const projectIdParams = z.object({
  id: z.string().uuid(),
});

const pageIdParams = z.object({
  id: z.string().uuid(),
});

const reorderPagesSchema = z.object({
  projectId: z.string().uuid().optional(),
  pageIds: z
    .array(z.string().uuid())
    .min(1)
    .refine((ids) => new Set(ids).size === ids.length, {
      message: "pageIds must be unique",
    }),
});

const handleValidationError = (result: unknown, c: Context) => {
  if (
    typeof result === "object" &&
    result !== null &&
    "success" in result &&
    !(result as { success: boolean }).success
  ) {
    const error = (result as { error?: unknown }).error;
    const details =
      error &&
      typeof error === "object" &&
      "flatten" in error &&
      typeof (error as { flatten?: () => unknown }).flatten === "function"
        ? (error as { flatten: () => unknown }).flatten()
        : undefined;
    return c.json(
      {
        error: {
          code: ERROR_CODES.VALIDATION_ERROR,
          message: "Invalid input",
          details,
        },
      },
      400
    );
  }
  return undefined;
};

const notFound = (c: Context, code: string, message: string) =>
  c.json({ error: { code, message } }, 404);

const badRequest = (c: Context, code: string, message: string) =>
  c.json({ error: { code, message } }, 400);

const toIso = (value: unknown) => {
  if (value instanceof Date) {
    return value.toISOString();
  }
  if (typeof value === "number") {
    const ms = value < 1_000_000_000_000 ? value * 1000 : value;
    return new Date(ms).toISOString();
  }
  return new Date(String(value)).toISOString();
};

router.get(
  "/projects/:id/pages",
  requireProjectAuth,
  zValidator("param", projectIdParams, handleValidationError),
  async (c) => {
    const projectId = c.req.param("id");

    const pages = await db
      .select({
        id: schema.pages.id,
        order: schema.pages.order,
        templateId: schema.pages.templateId,
        title: schema.pages.title,
        subtitle: schema.pages.subtitle,
        elementCount:
          sql<number>`(SELECT COUNT(*) FROM ${schema.elements} WHERE ${schema.elements.pageId} = ${schema.pages.id})`.as(
            "elementCount"
          ),
      })
      .from(schema.pages)
      .where(eq(schema.pages.projectId, projectId))
      .orderBy(schema.pages.order);

    return c.json({ pages });
  }
);

router.post(
  "/projects/:id/pages",
  requireProjectAuth,
  zValidator("param", projectIdParams, handleValidationError),
  zValidator("json", CreatePageSchema, handleValidationError),
  async (c) => {
    const projectId = c.req.param("id");
    const { templateId, afterPageId } = c.req.valid("json");

    try {
      const created = await db.transaction(async (tx) => {
        const existingPages = await tx
          .select({ id: schema.pages.id, order: schema.pages.order })
          .from(schema.pages)
          .where(eq(schema.pages.projectId, projectId))
          .orderBy(schema.pages.order);

        let insertOrder = existingPages.length;
        if (afterPageId) {
          const target = existingPages.find((page) => page.id === afterPageId);
          if (!target) {
            return { error: "AFTER_PAGE_NOT_FOUND" as const };
          }
          insertOrder = target.order + 1;
        }

        if (afterPageId) {
          await tx
            .update(schema.pages)
            .set({
              order: sql`${schema.pages.order} + 1`,
              updatedAt: sql`(unixepoch())`,
            })
            .where(
              and(eq(schema.pages.projectId, projectId), gte(schema.pages.order, insertOrder))
            );
        }

        const id = crypto.randomUUID();
        await tx.insert(schema.pages).values({
          id,
          projectId,
          order: insertOrder,
          templateId,
          title: "",
          subtitle: "",
        });

        // Initialize template elements for the new page
        await initializeTemplateElements(id, templateId, tx);

        const inserted = await tx
          .select({
            id: schema.pages.id,
            projectId: schema.pages.projectId,
            order: schema.pages.order,
            templateId: schema.pages.templateId,
            title: schema.pages.title,
            subtitle: schema.pages.subtitle,
            createdAt: schema.pages.createdAt,
          })
          .from(schema.pages)
          .where(eq(schema.pages.id, id))
          .get();

        return { page: inserted };
      });

      if ("error" in created) {
        return notFound(
          c,
          ERROR_CODES.PAGE_NOT_FOUND,
          "afterPageId does not exist in this project"
        );
      }

      const page = created.page;
      if (!page) {
        return badRequest(c, ERROR_CODES.INVALID_INPUT, "Failed to create page");
      }

      return c.json(
        {
          ...page,
          createdAt: toIso(page.createdAt),
        },
        201
      );
    } catch (_error) {
      return c.json(
        {
          error: {
            code: ERROR_CODES.INTERNAL_ERROR,
            message: "Failed to create page",
          },
        },
        500
      );
    }
  }
);

router.put(
  "/pages/:id",
  requireAuth,
  zValidator("param", pageIdParams, handleValidationError),
  zValidator("json", UpdatePageSchema, handleValidationError),
  async (c) => {
    const pageId = c.req.param("id");
    const updates = c.req.valid("json");
    const projectId = c.get("projectId");

    if (Object.keys(updates).length === 0) {
      return badRequest(c, ERROR_CODES.INVALID_INPUT, "No fields provided for update");
    }

    const page = await db
      .select({
        id: schema.pages.id,
        projectId: schema.pages.projectId,
        order: schema.pages.order,
      })
      .from(schema.pages)
      .where(eq(schema.pages.id, pageId))
      .get();

    if (!page) {
      return notFound(c, ERROR_CODES.PAGE_NOT_FOUND, "Page not found");
    }

    if (page.projectId !== projectId) {
      throw AuthErrors.ACCESS_DENIED();
    }

    if (updates.order !== undefined && updates.order !== page.order) {
      const countRow = await db
        .select({ count: sql<number>`count(*)`.as("count") })
        .from(schema.pages)
        .where(eq(schema.pages.projectId, projectId))
        .get();
      const totalPages = countRow?.count ?? 0;
      const maxOrder = Math.max(totalPages - 1, 0);
      if (updates.order < 0 || updates.order > maxOrder) {
        return badRequest(c, ERROR_CODES.INVALID_INPUT, `Order must be between 0 and ${maxOrder}`);
      }
    }

    await db.transaction(async (tx) => {
      if (updates.order !== undefined && updates.order !== page.order) {
        if (updates.order > page.order) {
          await tx
            .update(schema.pages)
            .set({
              order: sql`${schema.pages.order} - 1`,
              updatedAt: sql`(unixepoch())`,
            })
            .where(
              and(
                eq(schema.pages.projectId, projectId),
                gt(schema.pages.order, page.order),
                lte(schema.pages.order, updates.order),
                ne(schema.pages.id, pageId)
              )
            );
        } else {
          await tx
            .update(schema.pages)
            .set({
              order: sql`${schema.pages.order} + 1`,
              updatedAt: sql`(unixepoch())`,
            })
            .where(
              and(
                eq(schema.pages.projectId, projectId),
                gte(schema.pages.order, updates.order),
                lt(schema.pages.order, page.order),
                ne(schema.pages.id, pageId)
              )
            );
        }
      }

      const updateData: Record<string, unknown> = {
        updatedAt: sql`(unixepoch())`,
      };
      if (updates.title !== undefined) updateData.title = updates.title;
      if (updates.subtitle !== undefined) updateData.subtitle = updates.subtitle;
      if (updates.templateId !== undefined) updateData.templateId = updates.templateId;
      if (updates.order !== undefined) updateData.order = updates.order;

      await tx.update(schema.pages).set(updateData).where(eq(schema.pages.id, pageId));
    });

    const updatedPage = await db
      .select({
        id: schema.pages.id,
        projectId: schema.pages.projectId,
        order: schema.pages.order,
        templateId: schema.pages.templateId,
        title: schema.pages.title,
        subtitle: schema.pages.subtitle,
        updatedAt: schema.pages.updatedAt,
      })
      .from(schema.pages)
      .where(eq(schema.pages.id, pageId))
      .get();

    if (!updatedPage) {
      return notFound(c, ERROR_CODES.PAGE_NOT_FOUND, "Page not found");
    }

    return c.json({
      ...updatedPage,
      updatedAt: toIso(updatedPage.updatedAt),
    });
  }
);

router.delete(
  "/pages/:id",
  requireAuth,
  zValidator("param", pageIdParams, handleValidationError),
  async (c) => {
    const pageId = c.req.param("id");
    const projectId = c.get("projectId");

    const page = await db
      .select({
        id: schema.pages.id,
        projectId: schema.pages.projectId,
        order: schema.pages.order,
      })
      .from(schema.pages)
      .where(eq(schema.pages.id, pageId))
      .get();

    if (!page) {
      return notFound(c, ERROR_CODES.PAGE_NOT_FOUND, "Page not found");
    }

    if (page.projectId !== projectId) {
      throw AuthErrors.ACCESS_DENIED();
    }

    const countRow = await db
      .select({ count: sql<number>`count(*)`.as("count") })
      .from(schema.pages)
      .where(eq(schema.pages.projectId, projectId))
      .get();
    const totalPages = countRow?.count ?? 0;

    if (totalPages <= 1) {
      return badRequest(c, ERROR_CODES.INVALID_INPUT, "Cannot delete the only page");
    }

    await db.transaction(async (tx) => {
      await tx.delete(schema.pages).where(eq(schema.pages.id, pageId));
      await tx
        .update(schema.pages)
        .set({
          order: sql`${schema.pages.order} - 1`,
          updatedAt: sql`(unixepoch())`,
        })
        .where(and(eq(schema.pages.projectId, projectId), gt(schema.pages.order, page.order)));
    });

    return c.body(null, 204);
  }
);

router.patch(
  "/pages/reorder",
  requireAuth,
  zValidator("json", reorderPagesSchema, handleValidationError),
  async (c) => {
    const { projectId: bodyProjectId, pageIds } = c.req.valid("json");
    const projectId = c.get("projectId");
    const targetProjectId = bodyProjectId ?? projectId;

    if (bodyProjectId && bodyProjectId !== projectId) {
      throw AuthErrors.ACCESS_DENIED();
    }

    const pagesInProject = await db
      .select({ id: schema.pages.id })
      .from(schema.pages)
      .where(eq(schema.pages.projectId, targetProjectId));

    if (pagesInProject.length !== pageIds.length) {
      return badRequest(
        c,
        ERROR_CODES.INVALID_INPUT,
        "pageIds must include all pages in the project"
      );
    }

    const projectPageIds = new Set(pagesInProject.map((page) => page.id));
    const allMatch = pageIds.every((id) => projectPageIds.has(id));
    if (!allMatch) {
      return badRequest(c, ERROR_CODES.INVALID_INPUT, "pageIds must belong to the project");
    }

    await db.transaction(async (tx) => {
      for (const [index, id] of pageIds.entries()) {
        await tx
          .update(schema.pages)
          .set({ order: index, updatedAt: sql`(unixepoch())` })
          .where(eq(schema.pages.id, id));
      }
    });

    return c.json({
      pages: pageIds.map((id, index) => ({ id, order: index })),
    });
  }
);

export default router;
