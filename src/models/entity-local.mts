import { integer, sqliteTable, text, uniqueIndex } from "drizzle-orm/sqlite-core";

export const synapse_entity_locals = sqliteTable(
  "HomeAssistantEntityLocals",
  {
    id: integer().primaryKey({ autoIncrement: true }),
    key: text().notNull(),
    last_modified: text().notNull(),
    unique_id: text().unique().notNull(),
    value_json: text({ mode: "json" }).notNull(),
  },
  table => [uniqueIndex("entity_key").on(table.unique_id, table.key)],
);
