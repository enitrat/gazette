import { Database } from "bun:sqlite";
import { drizzle } from "drizzle-orm/bun-sqlite";
import * as schema from "./schema";

const DB_PATH = process.env.DATABASE_URL || "./data/gazette.db";

// Ensure data directory exists
const dataDir = DB_PATH.substring(0, DB_PATH.lastIndexOf("/"));
if (dataDir) {
  await Bun.write(`${dataDir}/.gitkeep`, "");
}

// Create SQLite database with bun:sqlite
const sqlite = new Database(DB_PATH, { create: true });

// Enable WAL mode for better performance
sqlite.exec("PRAGMA journal_mode = WAL;");
sqlite.exec("PRAGMA foreign_keys = ON;");

// Create Drizzle ORM instance
export const db = drizzle(sqlite, { schema });

// Export schema for use in other modules
export { schema };

// Export the raw sqlite connection for migrations
export { sqlite };
