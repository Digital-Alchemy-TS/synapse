import { sql } from "drizzle-orm";
import { integer, sqliteTable, text } from "drizzle-orm/sqlite-core";

export const sqliteHomeAssistantEntity = sqliteTable("synapse_entity", {
  app_unique_id: text("app_unique_id").notNull(),
  application_name: text("application_name").notNull(),
  base_state: text("base_state").notNull(),
  entity_id: text("entity_id"),
  first_observed: text("first_observed")
    .notNull()
    .default(sql`CURRENT_TIMESTAMP`),
  id: integer("id").primaryKey({ autoIncrement: true }),
  last_modified: text("last_modified").notNull(),
  last_reported: text("last_reported").notNull(),
  state_json: text("state_json").notNull(),
  unique_id: text("unique_id").notNull().unique(),
});

export const sqliteHomeAssistantEntityLocals = sqliteTable("synapse_entity_locals", {
  app_unique_id: text("app_unique_id").notNull(),
  id: integer("id").primaryKey({ autoIncrement: true }),
  key: text("key").notNull(),
  last_modified: text("last_modified")
    .notNull()
    .default(sql`CURRENT_TIMESTAMP`),
  unique_id: text("unique_id").notNull(),
  value_json: text("value_json").notNull(),
});
