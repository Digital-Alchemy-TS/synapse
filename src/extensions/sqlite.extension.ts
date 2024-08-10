import { is, TServiceParams } from "@digital-alchemy/core";
import { PICK_ENTITY } from "@digital-alchemy/hass";
import DB, { Database } from "better-sqlite3";

import { TSynapseId } from "../helpers";

const ENTITY_CREATE = `CREATE TABLE IF NOT EXISTS HomeAssistantEntity (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  unique_id TEXT NOT NULL UNIQUE,
  entity_id TEXT NOT NULL,
  state_json TEXT NOT NULL,
  first_observed DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  last_reported DATETIME NOT NULL,
  last_modified DATETIME NOT NULL,
  application_name TEXT NOT NULL
)`;

const LOCALS_CREATE = `CREATE TABLE IF NOT EXISTS HomeAssistantEntityLocals (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  unique_id INTEGER NOT NULL,
  key TEXT NOT NULL,
  value_json TEXT NOT NULL,
  last_modified DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (entity_id) REFERENCES HomeAssistantEntity(id),
  UNIQUE (entity_id, key)
)`;

const ENTITY_UPSERT = `INSERT INTO HomeAssistantEntity (
  unique_id, entity_id, state_json, first_observed, last_reported, last_modified, application_name
) VALUES (
  @unique_id, @entity_id, @state_json, @first_observed, @last_reported, @last_modified, @application_name
) ON CONFLICT(unique_id) DO UPDATE SET
  entity_id = excluded.entity_id,
  last_reported = excluded.last_reported,
  last_modified = excluded.last_modified,
  state_json = excluded.state_json,
  application_name = excluded.application_name`;

const ENTITY_LOCALS_UPSERT = `INSERT INTO HomeAssistantEntityLocals (
  unique_id, key, value_json, last_modified
) VALUES (
  @unique_id, @key, @value_json, @last_modified
) ON CONFLICT(unique_id, key) DO UPDATE SET
  value_json = excluded.value_json,
  last_modified = excluded.last_modified`;

const SELECT_QUERY = `SELECT *
  FROM HomeAssistantEntity
  WHERE unique_id = ? AND application_name = ?`;

const SELECT_LOCALS_QUERY = `SELECT *
  FROM HomeAssistantEntityLocals
  WHERE unique_id = ?`;

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
  state_json: string;
  first_observed: string;
  last_reported: string;
  last_modified: string;
  application_name: string;
  locals: LOCALS;
};

export function SQLite({ lifecycle, config, logger, hass, internal, synapse }: TServiceParams) {
  let database: Database;
  const application_name = internal.boot.application.name;

  lifecycle.onPostConfig(() => {
    database = new DB(config.synapse.SQLITE_DB);
    database.prepare(ENTITY_CREATE).run();
    database.prepare(LOCALS_CREATE).run();
  });

  lifecycle.onShutdownStart(() => database.close());

  // #MARK: updateLocal
  function updateLocal(unique_id: TSynapseId, key: string, content: unknown) {
    const entity = database
      .prepare(`SELECT id FROM HomeAssistantEntity WHERE unique_id = ?`)
      .get(unique_id) as HomeAssistantEntityRow;

    if (!entity) {
      logger.warn({ name: updateLocal, unique_id }, `Entity with unique_id not found`);
      return;
    }

    const entity_id = entity.id;
    const value_json = JSON.stringify(content);
    const now = new Date().toISOString();

    const insertLocal = database.prepare(ENTITY_LOCALS_UPSERT);
    insertLocal.run({
      entity_id,
      key,
      last_modified: now,
      value_json,
    });
  }

  // #MARK: update
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
    const insert = database.prepare(ENTITY_UPSERT);
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

  function loadRow<LOCALS extends object = object>(unique_id: TSynapseId) {
    const row = database
      .prepare<[TSynapseId, string], HomeAssistantEntityRow<LOCALS>>(SELECT_QUERY)
      .get(unique_id, application_name);
    if (!row) {
      return undefined;
    }

    const locals = database
      .prepare<[PICK_ENTITY], HomeAssistantEntityLocalRow>(SELECT_LOCALS_QUERY)
      .all(row.entity_id);
    row.locals = Object.fromEntries(locals.map(i => [i.key, JSON.parse(i.value_json)])) as LOCALS;

    return row;
  }

  // #MARK: load
  function load<LOCALS extends object = object>(
    unique_id: TSynapseId,
    defaults: object,
  ): HomeAssistantEntityRow<LOCALS> {
    // - if exists, return existing data
    const data = loadRow<LOCALS>(unique_id);
    if (data) {
      return data;
    }
    // - if new: insert then try again
    logger.debug({ name: load, unique_id }, `creating new sqlite entry`);
    update(unique_id, defaults);
    return loadRow<LOCALS>(unique_id);
  }

  return { load, update, updateLocal };
}
