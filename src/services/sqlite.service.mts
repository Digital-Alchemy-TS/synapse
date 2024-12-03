import { is, TServiceParams } from "@digital-alchemy/core";
import SQLiteDriver, { Database } from "better-sqlite3";

import {
  ENTITY_CREATE,
  ENTITY_UPSERT,
  HomeAssistantEntityRow,
  LOCALS_CREATE,
  SELECT_QUERY,
  TSynapseId,
} from "../helpers/index.mts";

export type SynapseSqliteDriver = typeof SQLiteDriver;

type SynapseSqlite = {
  getDatabase: () => Database;
  load: (unique_id: TSynapseId, defaults: object) => HomeAssistantEntityRow;
  setDriver: (driver: SynapseSqliteDriver) => void;
  update: (unique_id: TSynapseId, content: object) => void;
};

export function SQLiteService({
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
    logger.trace("create if not exists tables");
    database = new Driver(config.synapse.SQLITE_DB);
    database.prepare(ENTITY_CREATE).run();
    database.prepare(LOCALS_CREATE).run();
  });

  lifecycle.onShutdownStart(() => {
    logger.trace("close database");
    database.close();
  });

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
    logger.trace({ entity_id, unique_id }, "update entity");
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

  // #MARK: loadRow
  function loadRow<LOCALS extends object = object>(unique_id: TSynapseId) {
    logger.trace({ unique_id }, "load entity");
    const row = database
      .prepare<[TSynapseId, string], HomeAssistantEntityRow<LOCALS>>(SELECT_QUERY)
      .get(unique_id, application_name);
    if (!row) {
      logger.debug("entity not found in database");
      return undefined;
    }
    logger.trace({ entity_id: row.entity_id, unique_id }, "load entity");
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
    logger.trace({ name: load, unique_id }, `creating new sqlite entry`);
    update(unique_id, defaults);
    return loadRow<LOCALS>(unique_id);
  }

  return {
    getDatabase: () => database,
    load,
    setDriver: (driver: SynapseSqliteDriver) => (Driver = driver),
    update,
  };
}
