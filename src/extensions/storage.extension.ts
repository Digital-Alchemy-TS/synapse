import { CronExpression, InternalError, is, TServiceParams } from "@digital-alchemy/core";
import { TRawDomains, TUniqueId } from "@digital-alchemy/hass";
import Database from "better-sqlite3";

import {
  AddStateOptions,
  COMMON_CONFIG_KEYS,
  EntityConfigCommon,
  isCommonConfigKey,
  isReactiveConfig,
  NO_LIVE_UPDATE,
  ReactiveConfig,
  TSynapseEntityStorage,
  TSynapseId,
} from "../helpers";

export type HomeAssistantEntityRow = {
  id?: number;
  unique_id: string;
  entity_id: string;
  state_json: string;
  first_observed: string; // assuming the date is stored as a string
  last_reported: string;
  last_modified: string;
  application_name: string;
};

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

const INSERT = `INSERT INTO HomeAssistantEntity (
  unique_id, entity_id, state_json, first_observed, last_reported, last_modified, application_name
) VALUES (
  @unique_id, @entity_id, @state_json, @first_observed, @last_reported, @last_modified, @application_name
) ON CONFLICT(unique_id) DO UPDATE SET
  entity_id = excluded.entity_id,
  last_reported = excluded.last_reported,
  last_modified = excluded.last_modified,
  state_json = excluded.state_json,
  application_name = excluded.application_name`;

export function StorageExtension({
  logger,
  config,
  context,
  lifecycle,
  hass,
  internal,
  synapse,
  scheduler,
}: TServiceParams) {
  const registry = new Map<TSynapseId, TSynapseEntityStorage>();
  const domain_lookup = new Map<string, TRawDomains>();
  let database: Database.Database;

  // * init better-sqlite3
  lifecycle.onPostConfig(() => {
    database = new Database(config.synapse.SQLITE_DB);
    database.prepare(CREATE).run();
  });

  lifecycle.onShutdownStart(() => database.close());

  function update(unique_id: TSynapseId) {
    const entity_id = hass.idBy.unique_id(unique_id as TUniqueId);
    if (is.empty(entity_id)) {
      logger.warn({ unique_id }, `not exists`);
      return;
    }
    const content = registry.get(unique_id);
    const state_json = JSON.stringify(content.export());
    const now = new Date().toISOString();
    const insert = database.prepare(INSERT);
    insert.run({
      application_name: internal.boot.application.name,
      entity_id,
      first_observed: now,
      last_modified: now,
      last_reported: now,
      state_json,
      unique_id,
    });
  }

  function dump() {
    const list = [...registry.keys()];
    const out = {} as Record<TRawDomains, object[]>;
    list.forEach(i => {
      const storage = registry.get(i);
      const section = domain_lookup.get(i);
      out[section] ??= [];
      out[section].push(storage.export());
    });
    return out;
  }

  // #MARK: add
  function add<CONFIGURATION extends EntityConfigCommon<object>>({
    entity,
    load_config_keys,
    domain,
  }: AddStateOptions<CONFIGURATION>) {
    if (registry.has(entity.unique_id as TSynapseId)) {
      throw new InternalError(context, `ENTITY_COLLISION`, `${domain} registry already id`);
    }
    domain_lookup.set(entity.unique_id, domain);
    let initialized = false;

    let CURRENT_VALUE = {} as Record<keyof CONFIGURATION, unknown>;

    // * update settable config
    function createSettableConfig(key: keyof CONFIGURATION, config: ReactiveConfig) {
      const update = () => {
        const new_value = config.current() as CONFIGURATION[typeof key];
        const current_value = storage.get(key);
        if (new_value === current_value) {
          return;
        }
        storage.set(key, new_value);
      };
      scheduler.cron({
        exec: update,
        schedule: config.schedule || CronExpression.EVERY_30_SECONDS,
      });
      if (!is.empty(config.onUpdate)) {
        config.onUpdate.forEach(entity => entity.onUpdate(update));
      }
      setImmediate(() => update());
    }

    // * import
    const load = [
      ...load_config_keys,
      ...COMMON_CONFIG_KEYS.values(),
    ] as (keyof EntityConfigCommon<object>)[];
    load.forEach(key => {
      const value = entity[key];
      if (isReactiveConfig(key, value)) {
        createSettableConfig(key, value);
        return;
      }
      CURRENT_VALUE[key] = value;
    });

    // * storage object
    const storage = {
      export: () => ({ ...CURRENT_VALUE }),
      get: key => CURRENT_VALUE[key],
      isStored: key => isCommonConfigKey(key) || load_config_keys.includes(key),
      set: (key: Extract<keyof CONFIGURATION, string>, value) => {
        if (NO_LIVE_UPDATE.has(key)) {
          throw new InternalError(context, "NO_LIVE_UPDATE", `${key} cannot be updated at runtime`);
        }
        CURRENT_VALUE[key] = value;
        if (initialized) {
          setImmediate(async () => {
            await update(entity.unique_id as TSynapseId);
            if (hass.socket.connectionState === "connected") {
              await synapse.socket.send(entity.unique_id, CURRENT_VALUE);
            }
          });
        }
      },
      unique_id: entity.unique_id,
    } as TSynapseEntityStorage<CONFIGURATION>;
    registry.set(entity.unique_id as TSynapseId, storage as unknown as TSynapseEntityStorage);

    // * value loading
    lifecycle.onBootstrap(() => {
      const data = database
        .prepare(`SELECT * FROM HomeAssistantEntity WHERE unique_id = ?`)
        .get(entity.unique_id) as HomeAssistantEntityRow;
      if (!data) {
        logger.warn(`first observation of entity`);
        lifecycle.onReady(() => {
          update(entity.unique_id as TSynapseId);
        });
        initialized = true;
        return;
      }
      logger.debug({ name: data.entity_id }, `importing value`);
      CURRENT_VALUE = JSON.parse(data.state_json);
      initialized = true;
    });

    // * done
    return storage;
  }

  return { add, dump, find: (id: TSynapseId) => registry.get(id) };
}
