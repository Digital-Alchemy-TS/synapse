import { is, TServiceParams } from "@digital-alchemy/core";

import {
  LightConfiguration,
  RemovableCallback,
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
        // > common
        // * name
        if (property === "name") {
          return entity.name;
        }
        // * unique_id
        if (property === "unique_id") {
          return unique_id;
        }
        // * onUpdate
        if (property === "onUpdate") {
          return loader.onUpdate();
        }
        // * _rawConfiguration
        if (property === "_rawConfiguration") {
          return loader.configuration;
        }
        // * _rawAttributes
        if (property === "_rawAttributes") {
          return loader.attributes;
        }
        // * attributes
        if (property === "attributes") {
          return loader.attributesProxy();
        }
        // * configuration
        if (property === "configuration") {
          return loader.configurationProxy();
        }
        // * state
        if (property === "state") {
          return loader.state;
        }
        // > domain specific
        // * onTurnOn
        if (property === "onTurnOn") {
          return (callback: RemovableCallback) =>
            synapse.registry.removableListener(TURN_ON, callback);
        }
        // * onTurnOff
        if (property === "onTurnOff") {
          return (callback: RemovableCallback) =>
            synapse.registry.removableListener(TURN_OFF, callback);
        }
        return undefined;
      },

      ownKeys: () => [...VIRTUAL_ENTITY_BASE_KEYS, "onTurnOn", "onTurnOff"],

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
    const [TURN_ON, TURN_OFF] = synapse.registry.busTransfer({
      context,
      eventName: ["turn_on", "turn_off"],
      unique_id,
    });

    // - Attach static listener
    if (is.function(entity.turn_on)) {
      proxy.onTurnOn(entity.turn_on);
    }
    if (is.function(entity.turn_off)) {
      proxy.onTurnOff(entity.turn_off);
    }

    // - Done
    return proxy;
  };
}
