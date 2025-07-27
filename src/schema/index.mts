import { sql } from "drizzle-orm";
import { dirname, join } from "path";
import { fileURLToPath } from "url";

export const MIGRATION_PATH = join(dirname(fileURLToPath(import.meta.url)), "migrations");

export async function pgTables() {
  const { jsonb, pgTable, serial, text, timestamp } = await import("drizzle-orm/pg-core");

  const homeAssistantEntity = pgTable("HomeAssistantEntity", {
    app_unique_id: text("app_unique_id").notNull(),
    application_name: text("application_name").notNull(),
    base_state: text("base_state").notNull(),
    entity_id: text("entity_id").notNull(),
    first_observed: timestamp("first_observed").notNull().defaultNow(),
    id: serial("id").primaryKey(),
    last_modified: text("last_modified").notNull(),
    last_reported: text("last_reported").notNull(),
    state_json: jsonb("state_json").notNull(),
    unique_id: text("unique_id").notNull().unique(),
  });

  const homeAssistantEntityLocals = pgTable("HomeAssistantEntityLocals", {
    app_unique_id: text("app_unique_id").notNull(),
    id: serial("id").primaryKey(),
    key: text("key").notNull(),
    last_modified: timestamp("last_modified").notNull().defaultNow(),
    unique_id: text("unique_id").notNull(),
    value_json: jsonb("value_json").notNull(),
  });

  return {
    homeAssistantEntity,
    homeAssistantEntityLocals,
  };
}

export async function mysqlTables() {
  const { int, mysqlTable, timestamp, varchar } = await import("drizzle-orm/mysql-core");

  const homeAssistantEntity = mysqlTable("HomeAssistantEntity", {
    app_unique_id: varchar("app_unique_id", { length: 255 }).notNull(),
    application_name: varchar("application_name", { length: 255 }).notNull(),
    base_state: varchar("base_state", { length: 1000 }).notNull(),
    entity_id: varchar("entity_id", { length: 255 }).notNull(),
    first_observed: timestamp("first_observed").notNull().defaultNow(),
    id: int("id").primaryKey().autoincrement(),
    last_modified: varchar("last_modified", { length: 255 }).notNull(),
    last_reported: varchar("last_reported", { length: 255 }).notNull(),
    state_json: varchar("state_json", { length: 1000 }).notNull(),
    unique_id: varchar("unique_id", { length: 255 }).notNull().unique(),
  });

  const homeAssistantEntityLocals = mysqlTable("HomeAssistantEntityLocals", {
    app_unique_id: varchar("app_unique_id", { length: 255 }).notNull(),
    id: int("id").primaryKey().autoincrement(),
    key: varchar("key", { length: 255 }).notNull(),
    last_modified: timestamp("last_modified").notNull().defaultNow(),
    unique_id: varchar("unique_id", { length: 255 }).notNull(),
    value_json: varchar("value_json", { length: 1000 }).notNull(),
  });

  return {
    homeAssistantEntity,
    homeAssistantEntityLocals,
  };
}

export async function sqliteTables() {
  const { integer, sqliteTable, text } = await import("drizzle-orm/sqlite-core");

  const homeAssistantEntity = sqliteTable("HomeAssistantEntity", {
    app_unique_id: text("app_unique_id").notNull(),
    application_name: text("application_name").notNull(),
    base_state: text("base_state").notNull(),
    entity_id: text("entity_id").notNull(),
    first_observed: text("first_observed")
      .notNull()
      .default(sql`CURRENT_TIMESTAMP`),
    id: integer("id").primaryKey({ autoIncrement: true }),
    last_modified: text("last_modified").notNull(),
    last_reported: text("last_reported").notNull(),
    state_json: text("state_json").notNull(),
    unique_id: text("unique_id").notNull().unique(),
  });

  const homeAssistantEntityLocals = sqliteTable("HomeAssistantEntityLocals", {
    app_unique_id: text("app_unique_id").notNull(),
    id: integer("id").primaryKey({ autoIncrement: true }),
    key: text("key").notNull(),
    last_modified: text("last_modified")
      .notNull()
      .default(sql`CURRENT_TIMESTAMP`),
    unique_id: text("unique_id").notNull(),
    value_json: text("value_json").notNull(),
  });

  return {
    homeAssistantEntity,
    homeAssistantEntityLocals,
  };
}

export type SynapseDatabase = {
  getDatabase: () => unknown;
  load: <LOCALS extends object = object>(
    unique_id: string,
    defaults: object,
  ) => Promise<HomeAssistantEntityRow<LOCALS>>;
  update: (unique_id: string, content: object, defaults?: object) => Promise<void>;
  updateLocal: (unique_id: string, key: string, content: unknown) => Promise<void>;
  loadLocals: (unique_id: string) => Promise<Map<string, unknown>>;
  deleteLocal: (unique_id: string, key: string) => Promise<void>;
  deleteLocalsByUniqueId: (unique_id: string) => Promise<void>;
};

// Common entity row type that normalizes different database types
export type HomeAssistantEntityRow<LOCALS extends object = object> = {
  unique_id: string;
  entity_id: string;
  app_unique_id: string;
  application_name: string;
  base_state: string;
  first_observed: string;
  id: number;
  last_modified: string;
  last_reported: string;
  state_json: string;
  locals: LOCALS;
};
