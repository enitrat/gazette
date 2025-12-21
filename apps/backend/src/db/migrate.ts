import { Database } from "bun:sqlite";
import { readdir } from "node:fs/promises";
import { join } from "node:path";
import { createLogger } from "../lib/logger";

const log = createLogger("db-migrate");

const DB_PATH = process.env.DATABASE_URL || "./data/gazette.db";
const MIGRATIONS_DIR = join(import.meta.dir, "migrations");

async function migrate() {
  log.info({ dbPath: DB_PATH, migrationsDir: MIGRATIONS_DIR }, "Starting database migration");

  // Ensure data directory exists
  const dataDir = DB_PATH.substring(0, DB_PATH.lastIndexOf("/"));
  if (dataDir) {
    await Bun.write(`${dataDir}/.gitkeep`, "");
  }

  // Open database
  const db = new Database(DB_PATH, { create: true });

  // Enable foreign keys
  db.exec("PRAGMA foreign_keys = ON;");

  // Create migrations table if it doesn't exist
  db.exec(`
    CREATE TABLE IF NOT EXISTS _migrations (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL UNIQUE,
      applied_at INTEGER NOT NULL DEFAULT (unixepoch())
    );
  `);

  // Get list of applied migrations
  const appliedMigrations = new Set(
    db
      .query<{ name: string }, []>("SELECT name FROM _migrations")
      .all()
      .map((row) => row.name)
  );

  log.info({ count: appliedMigrations.size }, "Applied migrations");

  // Read migration files
  const files = await readdir(MIGRATIONS_DIR);
  const sqlFiles = files.filter((f) => f.endsWith(".sql")).sort();

  log.info({ count: sqlFiles.length }, "Found migration files");

  let appliedCount = 0;

  for (const file of sqlFiles) {
    if (appliedMigrations.has(file)) {
      log.debug({ file }, "Skipping already applied migration");
      continue;
    }

    log.info({ file }, "Applying migration");

    // Read and execute migration
    const sqlPath = join(MIGRATIONS_DIR, file);
    const sql = await Bun.file(sqlPath).text();

    try {
      db.exec(sql);

      // Record migration
      db.run("INSERT INTO _migrations (name) VALUES (?)", [file]);
      appliedCount++;

      log.info({ file }, "Migration applied successfully");
    } catch (error) {
      log.error({ file, err: error }, "Migration failed");
      db.close();
      process.exit(1);
    }
  }

  db.close();

  log.info({ appliedCount }, "Migration complete");
}

// Run if executed directly
migrate().catch((error) => {
  log.fatal({ err: error }, "Migration failed");
  process.exit(1);
});
