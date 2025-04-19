import { PICK_ENTITY } from "@digital-alchemy/hass";
import Database from "better-sqlite3";
import { drizzle } from "drizzle-orm/better-sqlite3";

export type HomeAssistantEntityLocalRow = {
  id?: number;
  entity_id: string;
  key: string;
  value_json: string;
  last_modified: string;
};

export type HomeAssistantEntityRow<LOCALS extends object = object> = {
  id?: number;
  unique_id: string;
  entity_id: PICK_ENTITY;
  entity_json: string;
  first_observed: string;
  last_reported: string;
  last_modified: string;
  base_state: string;
  application_name: string;
  locals: LOCALS;
};

export function betterSqlite(db: string) {
  const sqlite = new Database(db);
  return drizzle({ client: sqlite });
}
