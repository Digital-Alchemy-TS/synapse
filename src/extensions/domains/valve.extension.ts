import { is, TServiceParams } from "@digital-alchemy/core";

import {
  RemovableCallback,
  SynapseValveParams,
  SynapseVirtualValve,
  ValveConfiguration,
  VIRTUAL_ENTITY_BASE_KEYS,
} from "../../helpers";
import { TRegistry } from "../registry.extension";

export function VirtualValve({ context, synapse }: TServiceParams) {
  const registry = synapse.registry.create<SynapseVirtualValve>({
    context,
    // @ts-expect-error it's fine
    domain: "valve",
  });

  // #MARK: create
  return function <
    STATE extends string = string,
    ATTRIBUTES extends object = object,
  >(entity: SynapseValveParams) {
    const proxy = new Proxy({} as SynapseVirtualValve, {
      // #MARK: get
      // eslint-disable-next-line sonarjs/cognitive-complexity
      get(_, property: keyof SynapseVirtualValve) {
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
        // * onOpenValve
        if (property === "onOpenValve") {
          return (callback: RemovableCallback) =>
            synapse.registry.removableListener(OPEN_VALVE, callback);
        }
        // * onCloseValve
        if (property === "onCloseValve") {
          return (callback: RemovableCallback) =>
            synapse.registry.removableListener(CLOSE_VALVE, callback);
        }
        // * onSetValvePosition
        if (property === "onSetValvePosition") {
          return (callback: RemovableCallback) =>
            synapse.registry.removableListener(SET_VALVE_POSITION, callback);
        }
        // * onStopValve
        if (property === "onStopValve") {
          return (callback: RemovableCallback) =>
            synapse.registry.removableListener(STOP_VALVE, callback);
        }
        return undefined;
      },

      ownKeys: () => [
        ...VIRTUAL_ENTITY_BASE_KEYS,
        "onOpenValve",
        "onCloseValve",
        "onSetValvePosition",
        "onStopValve",
      ],

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
      ValveConfiguration
    >({
      load_keys: [
        "current_valve_position",
        "is_closed",
        "is_opening",
        "reports_position",
        "device_class",
        "is_closing",
        "supported_features",
      ],
      name: entity.name,
      registry: registry as TRegistry<unknown>,
      unique_id,
    });

    // - Attach bus events
    const [OPEN_VALVE, CLOSE_VALVE, SET_VALVE_POSITION, STOP_VALVE] =
      synapse.registry.busTransfer({
        context,
        eventName: [
          "open_valve",
          "close_valve",
          "set_valve_position",
          "stop_valve",
        ],
        unique_id,
      });

    // - Attach static listener
    if (is.function(entity.open_valve)) {
      proxy.onOpenValve(entity.open_valve);
    }
    if (is.function(entity.close_valve)) {
      proxy.onCloseValve(entity.close_valve);
    }
    if (is.function(entity.set_valve_position)) {
      proxy.onSetValvePosition(entity.set_valve_position);
    }
    if (is.function(entity.stop_valve)) {
      proxy.onStopValve(entity.stop_valve);
    }

    // - Done
    return proxy;
  };
}
