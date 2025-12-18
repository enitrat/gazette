import { Database } from "bun:sqlite";
import { readdir } from "node:fs/promises";
import { join } from "node:path";

const DB_PATH = process.env.DATABASE_URL || "./data/gazette.db";
const MIGRATIONS_DIR = join(import.meta.dir, "migrations");

async function migrate() {
  console.warn("Starting database migration...");
  console.warn(`Database path: ${DB_PATH}`);
  console.warn(`Migrations directory: ${MIGRATIONS_DIR}`);

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

  console.warn(`Applied migrations: ${appliedMigrations.size}`);

  // Read migration files
  const files = await readdir(MIGRATIONS_DIR);
  const sqlFiles = files.filter((f) => f.endsWith(".sql")).sort();

  console.warn(`Found ${sqlFiles.length} migration files`);

  let appliedCount = 0;

  for (const file of sqlFiles) {
    if (appliedMigrations.has(file)) {
      console.warn(`  [SKIP] ${file} (already applied)`);
      continue;
    }

    console.warn(`  [APPLY] ${file}`);

    // Read and execute migration
    const sqlPath = join(MIGRATIONS_DIR, file);
    const sql = await Bun.file(sqlPath).text();

    try {
      db.exec(sql);

      // Record migration
      db.run("INSERT INTO _migrations (name) VALUES (?)", [file]);
      appliedCount++;

      console.warn(`  [OK] ${file}`);
    } catch (error) {
      console.error(`  [ERROR] ${file}: ${error}`);
      db.close();
      process.exit(1);
    }
  }

  db.close();

  console.warn(`\nMigration complete. Applied ${appliedCount} new migrations.`);
}

// Run if executed directly
migrate().catch((error) => {
  console.error("Migration failed:", error);
  process.exit(1);
});
