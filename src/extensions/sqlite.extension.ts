import { is, TServiceParams } from "@digital-alchemy/core";
import { PICK_ENTITY } from "@digital-alchemy/hass";
import SQLiteDriver, { Database } from "better-sqlite3";

import {
  ENTITY_CREATE,
  ENTITY_LOCALS_UPSERT,
  ENTITY_UPSERT,
  HomeAssistantEntityLocalRow,
  HomeAssistantEntityRow,
  LOCALS_CREATE,
  SELECT_LOCALS_QUERY,
  SELECT_QUERY,
  TSynapseId,
} from "../helpers";

export type SynapseSqliteDriver = typeof SQLiteDriver;

type SynapseSqlite = {
  getDriver: () => SynapseSqliteDriver;
  load: (unique_id: TSynapseId, defaults: object) => HomeAssistantEntityRow;
  setDriver: (driver: SynapseSqliteDriver) => void;
  update: (unique_id: TSynapseId, content: object) => void;
  updateLocal: (unique_id: TSynapseId, key: string, content: unknown) => void;
};

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
  let Driver: SynapseSqliteDriver = SQLiteDriver;

  lifecycle.onPostConfig(() => {
    database = new Driver(config.synapse.SQLITE_DB);
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

  return {
    getDriver: () => Driver,
    load,
    setDriver: (driver: SynapseSqliteDriver) => (Driver = driver),
    update,
    updateLocal,
  };
}
