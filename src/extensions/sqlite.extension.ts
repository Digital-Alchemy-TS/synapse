import { is, TServiceParams } from "@digital-alchemy/core";
import DB, { Database } from "better-sqlite3";

import { TSynapseId } from "../helpers";

const CREATE = `CREATE TABLE IF NOT EXISTS HomeAssistantEntity (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  unique_id TEXT NOT NULL UNIQUE,
  entity_id TEXT NOT NULL,
  state_json TEXT NOT NULL,
  first_observed DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  last_reported DATETIME NOT NULL,
  last_modified DATETIME NOT NULL,
  application_name TEXT NOT NULL
)`;

const UPSERT = `INSERT INTO HomeAssistantEntity (
  unique_id, entity_id, state_json, first_observed, last_reported, last_modified, application_name
) VALUES (
  @unique_id, @entity_id, @state_json, @first_observed, @last_reported, @last_modified, @application_name
) ON CONFLICT(unique_id) DO UPDATE SET
  entity_id = excluded.entity_id,
  last_reported = excluded.last_reported,
  last_modified = excluded.last_modified,
  state_json = excluded.state_json,
  application_name = excluded.application_name`;

export type HomeAssistantEntityRow = {
  id?: number;
  unique_id: string;
  entity_id: string;
  state_json: string;
  first_observed: string;
  last_reported: string;
  last_modified: string;
  application_name: string;
};

export type SynapseSqliteDriver = typeof DB;

export function SQLite({
  lifecycle,
  config,
  logger,
  hass,
  internal,
  synapse,
}: TServiceParams): SynapseSqlite {
  let database: Database;
  const application_name = internal.boot.application.name;
  let Driver: SynapseSqliteDriver = DB;

  lifecycle.onPostConfig(() => {
    database = new Driver(config.synapse.SQLITE_DB);
    database.prepare(CREATE).run();
  });

  lifecycle.onShutdownStart(() => database.close());

  function update(unique_id: TSynapseId, content: object) {
    const entity_id = hass.entity.registry.current.find(i => i.unique_id === unique_id)?.entity_id;
    if (is.empty(entity_id)) {
      if (synapse.configure.isRegistered()) {
        logger.warn({ name: update, unique_id }, `not exists`);
      }
      return;
    }
    const state_json = JSON.stringify(content);
    const now = new Date().toISOString();
    const insert = database.prepare(UPSERT);
    insert.run({
      application_name,
      entity_id,
      first_observed: now,
      last_modified: now,
      last_reported: now,
      state_json,
      unique_id,
    });
  }

  function load(unique_id: TSynapseId, defaults: object) {
    const data = database
      .prepare(`SELECT * FROM HomeAssistantEntity WHERE unique_id = ? AND application_name = ?`)
      .get(unique_id, application_name) as HomeAssistantEntityRow;
    if (data) {
      return data;
    }
    update(unique_id, defaults);
    return database
      .prepare(`SELECT * FROM HomeAssistantEntity WHERE unique_id = ? AND application_name = ?`)
      .get(unique_id, application_name) as HomeAssistantEntityRow;
  }

  return {
    load,
    setDriver: (driver: SynapseSqliteDriver) => (Driver = driver),
    update,
  };
}

type SynapseSqlite = {
  load: (unique_id: TSynapseId, defaults: object) => HomeAssistantEntityRow;
  setDriver: (driver: SynapseSqliteDriver) => void;
  update: (unique_id: TSynapseId, content: object) => void;
};
