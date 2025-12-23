import { beforeAll, describe, expect, it } from "bun:test";
import { eq } from "drizzle-orm";
import { projects } from "../src/db/schema";
import type { DatabaseClient } from "../src/db";

let fetchHandler: typeof fetch;
let db: DatabaseClient;
let decodeToken: (
  token: string
) => { header: { alg: string; typ: string }; payload: { project_id: string } } | null;

async function seedDatabase() {
  const migrationUrl = new URL("../src/db/migrations/0001_initial.sql", import.meta.url);
  const migrationSql = await Bun.file(migrationUrl).text();
  const { sqlite } = await import("../src/db");
  sqlite.exec(migrationSql);
}

async function createProject(name: string, password: string) {
  const res = await fetchHandler(
    new Request("http://localhost/api/projects", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name, password }),
    })
  );
  const data = await res.json();
  return { res, data };
}

describe("project authentication endpoints", () => {
  beforeAll(async () => {
    process.env.DATABASE_URL = ":memory:";
    process.env.JWT_SECRET = "test-secret";
    await seedDatabase();

    const appModule = await import("../src/index.ts");
    fetchHandler = appModule.app.fetch;

    const dbModule = await import("../src/db");
    db = dbModule.db;

    const authModule = await import("../src/auth/jwt");
    decodeToken = authModule.decodeToken;
  });

  it("creates a project and hashes the password", async () => {
    const { res, data } = await createProject("Test Project", "secret123");
    expect(res.status).toBe(201);
    expect(data.id).toBeTruthy();
    expect(data.slug).toBe("test-project");
    expect(data.token).toBeTruthy();

    const decoded = decodeToken(data.token);
    expect(decoded?.payload.project_id).toBe(data.id);

    const record = await db.select().from(projects).where(eq(projects.id, data.id)).get();
    expect(record).toBeTruthy();
    expect(record?.passwordHash).not.toBe("secret123");
    const matches = await Bun.password.verify("secret123", record!.passwordHash);
    expect(matches).toBe(true);
  });

  it("authenticates a project by name", async () => {
    const { data: created } = await createProject("Auth Project", "passw0rd");
    const res = await fetchHandler(
      new Request("http://localhost/api/projects/access", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: created.name, password: "passw0rd" }),
      })
    );
    expect(res.status).toBe(200);
    const data = await res.json();
    expect(data.id).toBe(created.id);
    expect(data.token).toBeTruthy();
    const decoded = decodeToken(data.token);
    expect(decoded?.payload.project_id).toBe(created.id);
  });

  it("rejects invalid passwords", async () => {
    const { data: created } = await createProject("Reject Project", "goodpass");
    const res = await fetchHandler(
      new Request("http://localhost/api/projects/access", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: created.name, password: "badpass" }),
      })
    );
    expect(res.status).toBe(401);
    const data = await res.json();
    expect(data?.error?.code).toBe("INVALID_CREDENTIALS");
  });

  it("rejects duplicate project names", async () => {
    await createProject("Duplicate Project", "dup-pass");
    const { res } = await createProject("Duplicate Project", "dup-pass");
    expect(res.status).toBe(409);
  });
});
