import { CronExpression, InternalError, is, TServiceParams } from "@digital-alchemy/core";
import { ENTITY_STATE, PICK_ENTITY, TRawDomains } from "@digital-alchemy/hass";

import {
  AddEntityOptions,
  EntityConfigCommon,
  isCommonConfigKey,
  isReactiveConfig,
  ReactiveConfig,
  SettableConfiguration,
  TSynapseId,
} from "../helpers";

export type TSynapseEntityStorage<CONFIGURATION extends object = object> = {
  unique_id: TSynapseId;
  set: <KEY extends keyof CONFIGURATION>(key: KEY, value: CONFIGURATION[KEY]) => void;
  get: <KEY extends keyof CONFIGURATION>(key: KEY) => CONFIGURATION[KEY];
  isStored(key: string): key is Extract<keyof CONFIGURATION, string>;
  export: () => CONFIGURATION;
};

const LATE_READY = -1;

type AddStateOptions<CONFIGURATION extends EntityConfigCommon<object>> = {
  domain: TRawDomains;
  entity: AddEntityOptions<CONFIGURATION>;
  /**
   * initial import from typescript defs
   */
  load_config_keys: (keyof AddEntityOptions<CONFIGURATION>)[];
  /**
   * when loading data from hass, map `state` to this config property
   */
  map_state: Extract<keyof CONFIGURATION, string>;
  /**
   * when loading data from hass, import these config properties from entity attributes
   */
  map_config: ConfigMapper<Extract<keyof CONFIGURATION, string>>[];
};

const NO_LIVE_UPDATE = new Set<string>([
  "unique_id",
  "suggested_object_id",
  "entity_category",
  "translation_key",
]);

export type ConfigMapper<KEY extends string> =
  | {
      key: KEY;
      load<ENTITY extends PICK_ENTITY>(entity: ENTITY_STATE<ENTITY>): unknown;
    }
  | KEY;

export function StorageExtension({
  logger,
  context,
  lifecycle,
  hass,
  synapse,
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
  function add<CONFIGURATION extends EntityConfigCommon<object>>({
    entity,
    load_config_keys,
    map_config = [],
    domain,
    map_state,
  }: AddStateOptions<CONFIGURATION>) {
    if (registry.has(entity.unique_id as TSynapseId)) {
      throw new InternalError(context, `ENTITY_COLLISION`, `${domain} registry already id`);
    }
    domain_lookup.set(entity.unique_id, domain);
    let initialized = false;

    const CURRENT_VALUE = {} as Record<keyof CONFIGURATION, unknown>;

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
    }

    const load = [
      ...load_config_keys,
      "attributes",
      "entity_category",
      "icon",
      "name",
      "suggested_object_id",
      "translation_key",
      "unique_id",
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
          setImmediate(async () => await synapse.socket.send(entity.unique_id, CURRENT_VALUE));
        }
      },
      unique_id: entity.unique_id,
    } as TSynapseEntityStorage<CONFIGURATION>;
    registry.set(entity.unique_id as TSynapseId, storage as unknown as TSynapseEntityStorage);

    // * value loading
    if (!is.empty(map_state) || !is.empty(map_config)) {
      lifecycle.onReady(async () => {
        const config = hass.entity.registry.current.find(i => i.unique_id === entity.unique_id);
        if (!config) {
          logger.warn({ options: entity }, "cannot find entity in hass registry");
          initialized = true;
          return;
        }
        const entity_id = config.entity_id;
        const reference = hass.entity.byId(entity_id);
        if (reference.state === "unavailable") {
          logger.trace({ name: entity_id, state: reference.state }, `waiting for initial value`);
          await reference.nextState();
          logger.trace({ name: entity_id }, "received");
        }

        if (!is.empty(map_state)) {
          storage.set(map_state, reference.state as CONFIGURATION[typeof map_state]);
        }

        map_config.forEach(config => {
          if (is.string(config)) {
            storage.set(
              config,
              reference.attributes[
                config as keyof typeof reference.attributes
              ] as CONFIGURATION[typeof map_state],
            );
            return;
          }
          storage.set(config.key, config.load(reference) as CONFIGURATION[typeof map_state]);
        });
        initialized = true;
      }, LATE_READY);
    } else {
      initialized = true;
    }

    // * done
    return storage;
  }

  return { add, dump, find: (id: TSynapseId) => registry.get(id) };
}
