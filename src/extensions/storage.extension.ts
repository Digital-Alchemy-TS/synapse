import { CronExpression, InternalError, is, TServiceParams } from "@digital-alchemy/core";
import { TRawDomains, TUniqueId } from "@digital-alchemy/hass";
import { PrismaClient } from "@prisma/client";

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
  let prisma: PrismaClient;

  // * init prisma
  lifecycle.onPostConfig(async () => {
    const url = config.synapse.SQLITE_DB.startsWith("file")
      ? config.synapse.SQLITE_DB
      : `file:${config.synapse.SQLITE_DB}`;
    prisma = new PrismaClient({ datasources: { db: { url } } });
    prisma.$connect();
    await prisma.$executeRaw`CREATE TABLE IF NOT EXISTS HomeAssistantEntity (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      unique_id TEXT NOT NULL UNIQUE,
      entity_id TEXT NOT NULL,
      state_json TEXT NOT NULL,
      first_observed DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
      last_reported DATETIME NOT NULL,
      last_modified DATETIME NOT NULL,
      application_name TEXT NOT NULL
    )`;
  });

  // * teardown prisma
  lifecycle.onShutdownStart(() => prisma.$disconnect());

  async function update(unique_id: TSynapseId) {
    const content = registry.get(unique_id);
    const state_json = JSON.stringify(content.export());
    const now = new Date();
    await prisma.homeAssistantEntity.upsert({
      create: {
        application_name: internal.boot.application.name,
        entity_id: hass.idBy.unique_id(unique_id as TUniqueId),
        first_observed: now,
        last_modified: now,
        last_reported: now,
        state_json,
        unique_id,
      },
      update: {
        entity_id: hass.idBy.unique_id(unique_id as TUniqueId),
        last_modified: now,
        last_reported: now,
        state_json,
        unique_id,
      },
      where: { unique_id },
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
    lifecycle.onBootstrap(async () => {
      const data = await prisma.homeAssistantEntity.findFirst({
        where: { unique_id: entity.unique_id },
      });
      if (!data) {
        logger.warn(`first observation of entity`);
        await update(entity.unique_id as TSynapseId);
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
