#!/usr/bin/env tsx

import { drizzle } from "drizzle-orm/better-sqlite3";
import { migrate } from "drizzle-orm/better-sqlite3/migrator";
import Database from "better-sqlite3";
import { join } from "path";
import { cwd } from "process";

async function generateMigration() {
  console.log("Generating initial migration...");

  const dbPath = join(cwd(), "synapse_storage.db");
  const sqlite = new Database(dbPath);
  const db = drizzle(sqlite);

  try {
    await migrate(db, { migrationsFolder: "./migrations" });
    console.log("Migration completed successfully!");
  } catch (error) {
    console.error("Migration failed:", error);
  } finally {
    sqlite.close();
  }
}

generateMigration().catch(console.error);
