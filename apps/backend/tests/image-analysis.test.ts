import { beforeAll, describe, expect, it } from "bun:test";
import { Buffer } from "node:buffer";

let fetchHandler: typeof fetch;

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

async function uploadImage(projectId: string, token: string) {
  const pngBase64 =
    "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/woAAn8B9p0U4wAAAABJRU5ErkJggg==";
  const file = new File([Buffer.from(pngBase64, "base64")], "test.png", {
    type: "image/png",
  });
  const form = new FormData();
  form.append("file", file);

  const res = await fetchHandler(
    new Request(`http://localhost/api/projects/${projectId}/images`, {
      method: "POST",
      headers: { Authorization: `Bearer ${token}` },
      body: form,
    })
  );

  const data = await res.json();
  return { res, data };
}

describe("image analysis endpoint", () => {
  beforeAll(async () => {
    process.env.DATABASE_URL = ":memory:";
    process.env.JWT_SECRET = "test-secret";
    process.env.UPLOAD_DIR = "./test-uploads";
    process.env.GEMINI_API_KEY = "";

    await seedDatabase();

    const appModule = await import("../src/index.ts");
    fetchHandler = appModule.default.fetch;

    await import("../src/db");
  });

  it("returns empty suggestions when Gemini is not configured", async () => {
    const { data: project } = await createProject("Analysis Project", "secret123");
    const { res: uploadRes, data: uploadData } = await uploadImage(project.id, project.token);
    expect(uploadRes.status).toBe(201);

    const res = await fetchHandler(
      new Request(`http://localhost/api/images/${uploadData.id}/analyze`, {
        method: "POST",
        headers: { Authorization: `Bearer ${project.token}` },
      })
    );

    expect(res.status).toBe(200);
    const data = await res.json();
    expect(data.imageId).toBe(uploadData.id);
    expect(typeof data.sceneDescription).toBe("string");
    expect(Array.isArray(data.suggestions)).toBe(true);
    expect(data.suggestions.length).toBe(0);
  });
});
