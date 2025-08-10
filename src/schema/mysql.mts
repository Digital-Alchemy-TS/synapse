import { int, mysqlTable, text, timestamp, unique, varchar } from "drizzle-orm/mysql-core";

export const mysqlHomeAssistantEntity = mysqlTable("synapse_entity", {
  app_unique_id: varchar("app_unique_id", { length: 255 }).notNull(),
  application_name: varchar("application_name", { length: 255 }).notNull(),
  base_state: text("base_state").notNull(),
  entity_id: varchar("entity_id", { length: 255 }),
  first_observed: timestamp("first_observed").notNull().defaultNow(),
  id: int("id").primaryKey().autoincrement(),
  last_modified: varchar("last_modified", { length: 255 }).notNull(),
  last_reported: varchar("last_reported", { length: 255 }).notNull(),
  state_json: text("state_json").notNull(),
  unique_id: varchar("unique_id", { length: 255 }).notNull().unique(),
});

export const mysqlHomeAssistantEntityLocals = mysqlTable(
  "synapse_entity_locals",
  {
    app_unique_id: varchar("app_unique_id", { length: 255 }).notNull(),
    id: int("id").primaryKey().autoincrement(),
    key: varchar("key", { length: 255 }).notNull(),
    last_modified: timestamp("last_modified").notNull().defaultNow(),
    unique_id: varchar("unique_id", { length: 255 }).notNull(),
    value_json: text("value_json").notNull(),
  },
  table => [unique().on(table.unique_id, table.key)],
);
