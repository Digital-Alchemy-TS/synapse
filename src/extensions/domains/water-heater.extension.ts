import { TServiceParams } from "@digital-alchemy/core";

import {
  isBaseEntityKeys,
  SynapseVirtualWaterHeater,
  SynapseWaterHeaterParams,
  VIRTUAL_ENTITY_BASE_KEYS,
  WaterHeaterConfiguration,
} from "../../helpers";
import { TRegistry } from "../registry.extension";

export function VirtualWaterHeater({ context, synapse }: TServiceParams) {
  const registry = synapse.registry.create<SynapseVirtualWaterHeater>({
    context,
    // @ts-expect-error it's fine
    domain: "water_heater",
  });

  // #MARK: create
  return function <
    STATE extends string = string,
    ATTRIBUTES extends object = object,
  >(entity: SynapseWaterHeaterParams) {
    const proxy = new Proxy({} as SynapseVirtualWaterHeater, {
      // #MARK: get
      // eslint-disable-next-line sonarjs/cognitive-complexity
      get(_, property: keyof SynapseVirtualWaterHeater) {
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
    const loader = synapse.storage.wrapper<
      STATE,
      ATTRIBUTES,
      WaterHeaterConfiguration
    >({
      load_keys: [
        "min_temp",
        "max_temp",
        "current_temperature",
        "target_temperature",
        "target_temperature_high",
        "target_temperature_low",
        "temperature_unit",
        "current_operation",
        "operation_list",
        "supported_features",
        "is_away_mode_on",
      ],
      name: entity.name,
      registry: registry as TRegistry<unknown>,
      unique_id,
    });

    // - Attach bus events
    const { dynamicAttach, staticAttach, keys } = synapse.registry.busTransfer({
      context,
      eventName: [
        "set_temperature",
        "set_operation_mode",
        "turn_away_mode_on",
        "turn_away_mode_off",
        "turn_on",
        "turn_off",
      ],
      unique_id,
    });

    // - Attach static listener
    staticAttach(proxy, entity);

    // - Done
    return proxy;
  };
}
