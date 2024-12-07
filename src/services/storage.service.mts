import { CronExpression, InternalError, is, TServiceParams } from "@digital-alchemy/core";
import { TRawDomains, TUniqueId } from "@digital-alchemy/hass";

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
} from "../helpers/index.mts";

export function StorageService({
  logger,
  context,
  lifecycle,
  hass,
  synapse,
  event,
  scheduler,
}: TServiceParams) {
  const registry = new Map<TSynapseId, TSynapseEntityStorage>();
  const domain_lookup = new Map<string, TRawDomains>();

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
  function add<
    LOCALS extends object,
    ATTRIBUTES extends object,
    CONFIGURATION extends EntityConfigCommon<ATTRIBUTES, LOCALS>,
  >({
    entity,
    load_config_keys,
    domain,
    serialize,
  }: AddStateOptions<ATTRIBUTES, LOCALS, CONFIGURATION>) {
    if (registry.has(entity.unique_id as TSynapseId)) {
      throw new InternalError(context, `ENTITY_COLLISION`, `${domain} registry already id`);
    }
    domain_lookup.set(entity.unique_id, domain);
    let initialized = false;
    type ValueData = Record<keyof CONFIGURATION, unknown>;

    let CURRENT_VALUE = {} as ValueData;

    // #MARK: createSettableConfig
    function createSettableConfig(key: keyof CONFIGURATION, config: ReactiveConfig) {
      function updateSettableConfig() {
        const current_value = storage.get(key);
        const new_value = config.current() as CONFIGURATION[typeof key];
        if (new_value === current_value) {
          logger.trace({ key, unique_id: entity.unique_id }, "ignoring noop");
          return;
        }
        logger.trace(
          { key, name: updateSettableConfig, unique_id: entity.unique_id },
          `setting new value`,
        );
        storage.set(key, new_value);
      }
      scheduler.cron({
        exec: updateSettableConfig,
        schedule: config.schedule || CronExpression.EVERY_30_SECONDS,
      });
      if (!is.empty(config.onUpdate)) {
        config.onUpdate.forEach(entity => entity.onUpdate(updateSettableConfig));
      }
      lifecycle.onReady(() => updateSettableConfig());
      event.on(entity.unique_id, updateSettableConfig);
      setImmediate(() => updateSettableConfig());
    }

    type LoadKeys = keyof EntityConfigCommon<ATTRIBUTES, LOCALS>;

    // * import
    const load = [...load_config_keys, ...COMMON_CONFIG_KEYS.values()] as LoadKeys[];

    load.forEach(key => {
      const value = entity[key];
      if (isReactiveConfig(key, value)) {
        createSettableConfig(key, value);
        return;
      }
      CURRENT_VALUE[key] = value;
    });

    // #MARK: storage
    const storage = {
      export: () => {
        const keys = Object.keys(CURRENT_VALUE) as Extract<keyof typeof CURRENT_VALUE, string>[];
        return Object.fromEntries(
          keys.map(i => {
            if (serialize) {
              // @ts-expect-error don't care
              return [i, serialize(i, CURRENT_VALUE[i], undefined)];
            }
            return [i, CURRENT_VALUE[i]];
          }),
        ) as ValueData;
      },
      get: key => CURRENT_VALUE[key],
      isStored: key => isCommonConfigKey(key) || load_config_keys.includes(key),
      keys: () => load,
      purge() {
        logger.warn("you should report this... I think");
      },
      set: (key: Extract<keyof CONFIGURATION, string>, value) => {
        const unique_id = entity.unique_id as TSynapseId;
        if (NO_LIVE_UPDATE.has(key)) {
          throw new InternalError(context, "NO_LIVE_UPDATE", `${key} cannot be updated at runtime`);
        }
        CURRENT_VALUE[key] = value;
        if (initialized) {
          logger.trace({ key, unique_id }, "update locals");
          synapse.sqlite.update(unique_id, registry.get(unique_id).export());
          if (hass.socket.connectionState === "connected") {
            setImmediate(async () => await synapse.socket.send(unique_id, CURRENT_VALUE));
          }
        }
      },
      unique_id: entity.unique_id,
    } as TSynapseEntityStorage<CONFIGURATION>;
    registry.set(entity.unique_id as TSynapseId, storage as unknown as TSynapseEntityStorage);

    // * value loading
    lifecycle.onReady(function onReady() {
      // - identify id
      const unique_id = entity.unique_id as TSynapseId;

      // - ??
      const data = synapse.sqlite.load(unique_id, CURRENT_VALUE);

      if (is.empty(data?.state_json)) {
        initialized = true;
        logger.warn({ unique_id }, "initial create entity row");
        synapse.sqlite.update(unique_id, registry.get(unique_id).export());
        return;
      }

      // - load previous value
      logger.warn({ entity_id: data.entity_id, name: onReady }, `importing value`);
      CURRENT_VALUE = JSON.parse(data.state_json);
      initialized = true;
    });

    // * done
    return storage;
  }

  return {
    add,
    dump,
    find: <CONFIGURATION extends object>(id: TSynapseId | TUniqueId) =>
      registry.get(id as TSynapseId) as unknown as TSynapseEntityStorage<CONFIGURATION>,
  };
}
