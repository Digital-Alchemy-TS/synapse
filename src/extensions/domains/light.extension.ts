import { TServiceParams } from "@digital-alchemy/core";

import {
  isBaseEntityKeys,
  LightConfiguration,
  SynapseLightParams,
  SynapseVirtualLight,
  VIRTUAL_ENTITY_BASE_KEYS,
} from "../../helpers";
import { TRegistry } from "../registry.extension";

export function VirtualLight({ context, synapse }: TServiceParams) {
  const registry = synapse.registry.create<SynapseVirtualLight>({
    context,
    // @ts-expect-error it's fine
    domain: "fan",
  });

  // #MARK: create
  return function <
    STATE extends string = string,
    ATTRIBUTES extends object = object,
  >(entity: SynapseLightParams) {
    const proxy = new Proxy({} as SynapseVirtualLight, {
      // #MARK: get
      // eslint-disable-next-line sonarjs/cognitive-complexity
      get(_, property: keyof SynapseVirtualLight) {
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
      LightConfiguration
    >({
      load_keys: [
        "brightness",
        "color_mode",
        "color_temp_kelvin",
        "effect",
        "effect_list",
        "hs_color",
        "is_on",
        "max_color_temp_kelvin",
        "min_color_temp_kelvin",
        "rgb_color",
        "rgbw_color",
        "rgbww_color",
        "supported_color_modes",
        "supported_features",
        "xy_color",
      ],
      name: entity.name,
      registry: registry as TRegistry<unknown>,
      unique_id,
    });

    // - Attach bus events
    const { dynamicAttach, staticAttach, keys } = synapse.registry.busTransfer({
      context,
      eventName: ["turn_on", "turn_off"],
      unique_id,
    });

    // - Attach static listener
    staticAttach(proxy, entity);

    // - Done
    return proxy;
  };
}
