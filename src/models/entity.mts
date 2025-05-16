import { integer, sqliteTable, text } from "drizzle-orm/sqlite-core";

export const synapse_entity = sqliteTable("HomeAssistantEntity", {
  application_name: text().notNull(),
  base_state: text({ mode: "json" }).notNull(),
  entity_id: text().notNull(),
  entity_json: text({ mode: "json" }).notNull(),
  first_observed: text().notNull(),
  id: integer().primaryKey({ autoIncrement: true }),
  last_modified: text().notNull(),
  last_reported: text().notNull(),
  unique_id: text().unique().notNull(),
});
