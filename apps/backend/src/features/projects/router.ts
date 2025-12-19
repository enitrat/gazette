import { Hono } from "hono";
import { validateAccessProject, validateCreateProject } from "@gazette/shared";
import { requireProjectAuth, signProjectToken } from "../../auth";
import { db, schema } from "../../db";
import {
  getProjectById,
  getProjectByName,
  getProjectBySlug,
  slugifyProjectName,
} from "../../projects";

function toIsoTimestamp(value: Date | number | null | undefined): string | null {
  if (!value) return null;
  if (value instanceof Date) return value.toISOString();
  if (typeof value === "number") {
    const millis = value > 1_000_000_000_000 ? value : value * 1000;
    return new Date(millis).toISOString();
  }
  return new Date(value).toISOString();
}

async function readJsonBody<T>(c: { req: { json: () => Promise<T> } }): Promise<T | null> {
  try {
    return await c.req.json();
  } catch {
    return null;
  }
}

export const projectsRouter = new Hono();

projectsRouter.get("/:id", requireProjectAuth, async (c) => {
  const projectId = c.req.param("id");
  const project = await getProjectById(projectId);

  if (!project) {
    return c.json(
      {
        error: {
          code: "PROJECT_NOT_FOUND",
          message: "Project not found",
        },
      },
      404
    );
  }

  return c.json({
    id: project.id,
    name: project.name,
    slug: project.slug,
    createdAt: toIsoTimestamp(project.createdAt),
    updatedAt: toIsoTimestamp(project.updatedAt),
  });
});

projectsRouter.post("/", async (c) => {
  const body = await readJsonBody(c);
  const parsed = validateCreateProject(body);
  if (!parsed.success) {
    return c.json(
      {
        error: {
          code: "VALIDATION_ERROR",
          message: parsed.error.issues[0]?.message ?? "Invalid project data",
        },
      },
      400
    );
  }

  const name = parsed.data.name.trim();
  const password = parsed.data.password;
  const existingByName = await getProjectByName(name);
  if (existingByName) {
    return c.json(
      {
        error: {
          code: "PROJECT_EXISTS",
          message: "Project name already exists",
        },
      },
      409
    );
  }

  const slug = slugifyProjectName(name);
  const existingBySlug = await getProjectBySlug(slug);
  if (existingBySlug) {
    return c.json(
      {
        error: {
          code: "PROJECT_EXISTS",
          message: "Project name already exists",
        },
      },
      409
    );
  }

  const passwordHash = await Bun.password.hash(password, { algorithm: "argon2id" });
  const id = crypto.randomUUID();
  await db.insert(schema.projects).values({
    id,
    name,
    slug,
    passwordHash,
  });

  const project = await getProjectById(id);
  if (!project) {
    return c.json(
      {
        error: {
          code: "PROJECT_CREATE_FAILED",
          message: "Failed to create project",
        },
      },
      500
    );
  }

  const token = await signProjectToken(project.id, project.slug);

  return c.json(
    {
      id: project.id,
      name: project.name,
      slug: project.slug,
      token,
      createdAt: toIsoTimestamp(project.createdAt),
    },
    201
  );
});

projectsRouter.post("/access", async (c) => {
  const body = await readJsonBody(c);
  const parsed = validateAccessProject(body);
  if (!parsed.success) {
    return c.json(
      {
        error: {
          code: "VALIDATION_ERROR",
          message: parsed.error.issues[0]?.message ?? "Invalid project data",
        },
      },
      400
    );
  }

  const projectName = parsed.data.name.trim();
  const project = await getProjectByName(projectName);
  if (!project) {
    return c.json(
      {
        error: {
          code: "PROJECT_NOT_FOUND",
          message: "Project not found",
        },
      },
      404
    );
  }

  const valid = await Bun.password.verify(parsed.data.password, project.passwordHash);
  if (!valid) {
    return c.json(
      {
        error: {
          code: "INVALID_CREDENTIALS",
          message: "Invalid password",
        },
      },
      401
    );
  }

  const token = await signProjectToken(project.id, project.slug);
  return c.json({
    id: project.id,
    name: project.name,
    slug: project.slug,
    token,
    createdAt: toIsoTimestamp(project.createdAt),
    updatedAt: toIsoTimestamp(project.updatedAt),
  });
});
