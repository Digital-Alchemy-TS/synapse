import { jsonb, pgTable, serial, text, timestamp } from "drizzle-orm/pg-core";

export const pgHomeAssistantEntity = pgTable("HomeAssistantEntity", {
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

export const pgHomeAssistantEntityLocals = pgTable("HomeAssistantEntityLocals", {
  app_unique_id: text("app_unique_id").notNull(),
  id: serial("id").primaryKey(),
  key: text("key").notNull(),
  last_modified: timestamp("last_modified").notNull().defaultNow(),
  unique_id: text("unique_id").notNull(),
  value_json: jsonb("value_json").notNull(),
});
