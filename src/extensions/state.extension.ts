import { InternalError, is, TServiceParams } from "@digital-alchemy/core";
import { domain } from "@digital-alchemy/hass";

import { EntityConfigCommon, TSynapseId } from "../helpers";
import { AddEntityOptions } from "./generator.extension";

type TSynapseEntityStorage<CONFIGURATION extends object = object> = {
  unique_id: TSynapseId;
  set: <KEY extends keyof CONFIGURATION>(key: KEY, value: CONFIGURATION[KEY]) => void;
  get: <KEY extends keyof CONFIGURATION>(key: KEY) => CONFIGURATION[KEY];
  export: () => CONFIGURATION;
};

const LATE_READY = -1;

type AddStateOptions<CONFIGURATION extends EntityConfigCommon<object>> = {
  entity: AddEntityOptions<CONFIGURATION>;
  load_keys: (keyof AddEntityOptions<CONFIGURATION>)[];
  map_state?: Extract<keyof CONFIGURATION, string>;
  map_config?: Extract<keyof CONFIGURATION, string>[];
};

export function StateExtension({ logger, context, lifecycle, hass }: TServiceParams) {
  const registry = new Map<TSynapseId, TSynapseEntityStorage>();

  function add<CONFIGURATION extends EntityConfigCommon<object>>({
    entity,
    load_keys,
    map_config = [],
    map_state,
  }: AddStateOptions<CONFIGURATION>) {
    if (registry.has(entity.unique_id as TSynapseId)) {
      throw new InternalError(context, `ENTITY_COLLISION`, `${domain} registry already id`);
    }

    // * add
    const CURRENT_VALUE = {} as Record<keyof CONFIGURATION, unknown>;
    const load = [
      ...load_keys,
      "attributes",
      "entity_category",
      "icon",
      "name",
      "suggested_object_id",
      "translation_key",
      "unique_id",
    ] as (keyof EntityConfigCommon<object>)[];
    load.forEach(key => (CURRENT_VALUE[key] = entity[key]));

    // * storage object
    const storage = {
      get(key) {
        return CURRENT_VALUE[key] as CONFIGURATION[typeof key];
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
          storage.set(
            config,
            reference.attributes[
              config as keyof typeof reference.attributes
            ] as CONFIGURATION[typeof map_state],
          );
        });
      }, LATE_READY);
    }

    // * done
    return storage;
  }

  return { add, find: (id: TSynapseId) => registry.get(id) };
}
