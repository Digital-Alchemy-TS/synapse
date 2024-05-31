import { TServiceParams } from "@digital-alchemy/core";

import {
  ClimateConfiguration,
  isBaseEntityKeys,
  SynapseClimateParams,
  SynapseVirtualClimate,
  VIRTUAL_ENTITY_BASE_KEYS,
} from "../..";
import { TRegistry } from "../registry.extension";

export function VirtualClimate({ context, synapse }: TServiceParams) {
  const registry = synapse.registry.create<SynapseVirtualClimate>({
    context,
    // @ts-expect-error it's fine
    domain: "climate",
  });

  // #MARK: create
  return function <STATE extends string = string, ATTRIBUTES extends object = object>(
    entity: SynapseClimateParams,
  ) {
    const proxy = new Proxy({} as SynapseVirtualClimate, {
      // #MARK: get
      // eslint-disable-next-line sonarjs/cognitive-complexity
      get(_, property: keyof SynapseVirtualClimate) {
        if (isBaseEntityKeys(property)) {
          return loader.baseGet(property);
        }
        return dynamicAttach(property);
      },

      ownKeys: () => [...VIRTUAL_ENTITY_BASE_KEYS, ...keys],

      // #MARK: set
      set(_, property: string, value: unknown) {
        // > common
        // * state
        if (property === "state") {
          loader.setState(value as STATE);
          return true;
        }
        // * attributes
        if (property === "attributes") {
          loader.setAttributes(value as ATTRIBUTES);
          return true;
        }
        return false;
      },
    });

    // - Add to registry
    const unique_id = registry.add(proxy, entity);

    // - Initialize value storage
    const loader = synapse.storage.wrapper<STATE, ATTRIBUTES, ClimateConfiguration>({
      load_keys: [
        "current_humidity",
        "current_temperature",
        "fan_mode",
        "fan_modes",
        "hvac_action",
        "hvac_mode",
        "hvac_modes",
        "max_humidity",
        "max_temp",
        "min_humidity",
        "min_temp",
        "precision",
        "preset_mode",
        "preset_modes",
        "swing_mode",
        "swing_modes",
        "target_humidity",
        "target_temperature_high",
        "target_temperature_low",
        "target_temperature_step",
        "target_temperature",
        "temperature_unit",
      ],
      name: entity.name,
      registry: registry as TRegistry<unknown>,
      unique_id,
    });

    // - Attach bus events
    const { dynamicAttach, staticAttach, keys } = synapse.registry.busTransfer({
      context,
      eventName: [
        "set_hvac_mode",
        "turn_on",
        "turn_off",
        "toggle",
        "set_preset_mode",
        "set_fan_mode",
        "set_humidity",
        "set_swing_mode",
        "set_temperature",
      ],
      unique_id,
    });

    // - Attach static listener
    staticAttach(proxy, entity);

    // - Done
    return proxy;
  };
}
