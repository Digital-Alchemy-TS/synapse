import { is, TServiceParams } from "@digital-alchemy/core";

import {
  HumidifierConfiguration,
  RemovableCallback,
  SynapseHumidifierParams,
  SynapseVirtualHumidifier,
  VIRTUAL_ENTITY_BASE_KEYS,
} from "../..";
import { TRegistry } from "../registry.extension";

export function VirtualHumidifier({ context, synapse }: TServiceParams) {
  const registry = synapse.registry.create<SynapseVirtualHumidifier>({
    context,
    // @ts-expect-error it's fine
    domain: "humidifier",
  });

  // #MARK: create
  return function <
    STATE extends string = string,
    ATTRIBUTES extends object = object,
  >(entity: SynapseHumidifierParams) {
    const proxy = new Proxy({} as SynapseVirtualHumidifier, {
      // #MARK: get
      // eslint-disable-next-line sonarjs/cognitive-complexity
      get(_, property: keyof SynapseVirtualHumidifier) {
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
        // * onSetHumidity
        if (property === "onSetHumidity") {
          return (callback: RemovableCallback) =>
            synapse.registry.removableListener(SET_HUMIDITY, callback);
        }
        return undefined;
      },

      ownKeys: () => [...VIRTUAL_ENTITY_BASE_KEYS, "onSetValue"],

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
      HumidifierConfiguration
    >({
      load_keys: [
        "action",
        "available_modes",
        "current_humidity",
        "device_class",
        "is_on",
        "max_humidity",
        "min_humidity",
        "mode",
        "target_humidity",
      ],
      name: entity.name,
      registry: registry as TRegistry<unknown>,
      unique_id,
    });

    // - Attach bus events
    const TURN_ON = synapse.registry.busTransfer({
      context,
      eventName: "turn_on",
      unique_id,
    });
    const TURN_OFF = synapse.registry.busTransfer({
      context,
      eventName: "turn_off",
      unique_id,
    });
    const SET_HUMIDITY = synapse.registry.busTransfer({
      context,
      eventName: "set_humidity",
      unique_id,
    });

    // - Attach static listener
    if (is.function(entity.turn_on)) {
      proxy.onTurnOn(entity.turn_on);
    }
    if (is.function(entity.turn_off)) {
      proxy.onTurnOff(entity.turn_off);
    }
    if (is.function(entity.set_humidity)) {
      proxy.onSetHumidity(entity.set_humidity);
    }

    // - Done
    return proxy;
  };
}
