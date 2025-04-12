import { is, TServiceParams } from "@digital-alchemy/core";
import { BetterSQLite3Database } from "drizzle-orm/better-sqlite3";
import { migrate as betterSqliteMigrate } from "drizzle-orm/better-sqlite3/migrator";
import { BunSQLiteDatabase } from "drizzle-orm/bun-sqlite";
import { migrate as bunSqliteMigrate } from "drizzle-orm/bun-sqlite/migrator";

import { betterSqlite, bunSqlite } from "../index.mts";

const isBun = !is.empty(process.versions.bun);
type DrizzleServiceReturn = {
  db: BunSQLiteDatabase | BetterSQLite3Database;
  initBunSqlite: () => void;
  initBetterSqlite: () => void;
};

export function DrizzleService({
  lifecycle,
  config,
  logger,
  synapse,
}: TServiceParams): DrizzleServiceReturn {
  // pick driver based on runtime & run migrations
  lifecycle.onPostConfig(() => {
    if (isBun) {
      synapse.drizzle.initBunSqlite();
      return;
    }
    synapse.drizzle.initBetterSqlite();
  });

  function initBunSqlite() {
    logger.trace({ db: config.synapse.SQLITE_DB }, "using {bun:sqlite}");
    const db = bunSqlite(config.synapse.SQLITE_DB);
    logger.trace({ name: "bun" }, "running migrations");
    bunSqliteMigrate(db, { migrationsFolder: config.synapse.DRIZZLE_MIGRATIONS });
    logger.trace({ name: "bun" }, "complete");
    synapse.drizzle.db = db;
  }

  function initBetterSqlite() {
    logger.trace({ db: config.synapse.SQLITE_DB }, "using {better-sqlite3}");
    const db = betterSqlite(config.synapse.SQLITE_DB);
    logger.trace({ name: "better-sqlite" }, "running migrations");
    betterSqliteMigrate(db, { migrationsFolder: config.synapse.DRIZZLE_MIGRATIONS });
    logger.trace({ name: "better-sqlite" }, "complete");
    synapse.drizzle.db = db;
  }

  return {
    db: undefined,
    initBetterSqlite,
    initBunSqlite,
  };
}
