import { is, TServiceParams } from "@digital-alchemy/core";

import {
  RemovableCallback,
  SynapseVacuumParams,
  SynapseVirtualVacuum,
  VacuumConfiguration,
  VIRTUAL_ENTITY_BASE_KEYS,
} from "../../helpers";
import { TRegistry } from "../registry.extension";

export function VirtualVacuum({ context, synapse }: TServiceParams) {
  const registry = synapse.registry.create<SynapseVirtualVacuum>({
    context,
    // @ts-expect-error it's fine
    domain: "lawn_mower",
  });

  // #MARK: create
  return function <
    STATE extends string = string,
    ATTRIBUTES extends object = object,
  >(entity: SynapseVacuumParams) {
    const proxy = new Proxy({} as SynapseVirtualVacuum, {
      // #MARK: get
      // eslint-disable-next-line sonarjs/cognitive-complexity
      get(_, property: keyof SynapseVirtualVacuum) {
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
        if (property === "onCleanSpot") {
          return (callback: RemovableCallback) =>
            synapse.registry.removableListener(CLEAN_SPOT, callback);
        }
        if (property === "onLocate") {
          return (callback: RemovableCallback) =>
            synapse.registry.removableListener(LOCATE, callback);
        }
        if (property === "onPause") {
          return (callback: RemovableCallback) =>
            synapse.registry.removableListener(PAUSE, callback);
        }
        if (property === "onReturnToBase") {
          return (callback: RemovableCallback) =>
            synapse.registry.removableListener(RETURN_TO_BASE, callback);
        }
        if (property === "onSendCommand") {
          return (callback: RemovableCallback) =>
            synapse.registry.removableListener(SEND_COMMAND, callback);
        }
        if (property === "onSetFanSpeed") {
          return (callback: RemovableCallback) =>
            synapse.registry.removableListener(SET_FAN_SPEED, callback);
        }
        if (property === "onStart") {
          return (callback: RemovableCallback) =>
            synapse.registry.removableListener(START, callback);
        }
        if (property === "onStop") {
          return (callback: RemovableCallback) =>
            synapse.registry.removableListener(STOP, callback);
        }
        return undefined;
      },

      ownKeys: () => [
        ...VIRTUAL_ENTITY_BASE_KEYS,
        "onCleanSpot",
        "onLocate",
        "onPause",
        "onReturnToBase",
        "onSendCommand",
        "onSetFanSpeed",
        "onStart",
        "onStop",
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
      VacuumConfiguration
    >({
      load_keys: [
        "battery_level",
        "fan_speed",
        "fan_speed_list",
        "supported_features",
      ],
      name: entity.name,
      registry: registry as TRegistry<unknown>,
      unique_id,
    });

    // - Attach bus events
    const CLEAN_SPOT = synapse.registry.busTransfer({
      context,
      eventName: "clean_spot",
      unique_id,
    });
    const LOCATE = synapse.registry.busTransfer({
      context,
      eventName: "locate",
      unique_id,
    });
    const PAUSE = synapse.registry.busTransfer({
      context,
      eventName: "pause",
      unique_id,
    });
    const RETURN_TO_BASE = synapse.registry.busTransfer({
      context,
      eventName: "return_to_base",
      unique_id,
    });
    const SEND_COMMAND = synapse.registry.busTransfer({
      context,
      eventName: "send_command",
      unique_id,
    });
    const SET_FAN_SPEED = synapse.registry.busTransfer({
      context,
      eventName: "set_fan_speed",
      unique_id,
    });
    const START = synapse.registry.busTransfer({
      context,
      eventName: "start",
      unique_id,
    });
    const STOP = synapse.registry.busTransfer({
      context,
      eventName: "stop",
      unique_id,
    });

    // - Attach static listener
    if (is.function(entity.clean_spot)) {
      proxy.onCleanSpot(entity.clean_spot);
    }
    if (is.function(entity.locate)) {
      proxy.onLocate(entity.locate);
    }
    if (is.function(entity.pause)) {
      proxy.onPause(entity.pause);
    }
    if (is.function(entity.return_to_base)) {
      proxy.onReturnToBase(entity.return_to_base);
    }
    if (is.function(entity.send_command)) {
      proxy.onSendCommand(entity.send_command);
    }
    if (is.function(entity.set_fan_speed)) {
      proxy.onSetFanSpeed(entity.set_fan_speed);
    }
    if (is.function(entity.start)) {
      proxy.onStart(entity.start);
    }
    if (is.function(entity.stop)) {
      proxy.onStop(entity.stop);
    }

    // - Done
    return proxy;
  };
}
