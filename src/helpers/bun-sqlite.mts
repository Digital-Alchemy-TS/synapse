import { Database } from "bun:sqlite";
import { drizzle } from "drizzle-orm/bun-sqlite";

export function bunSqlite(db: string) {
  const sqlite = new Database(db);
  return drizzle({ client: sqlite });
}
