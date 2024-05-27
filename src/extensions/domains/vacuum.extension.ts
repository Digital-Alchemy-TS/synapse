import { is, TServiceParams } from "@digital-alchemy/core";

import {
  RemovableCallback,
  SynapseVacuumParams,
  SynapseVirtualVacuum,
  VacuumConfiguration,
  VIRTUAL_ENTITY_BASE_KEYS,
} from "../../helpers";
import { TRegistry } from "../registry.extension";
import { isBaseEntityKeys } from "../storage.extension";

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
        if (isBaseEntityKeys(property)) {
          return loader.baseGet(property);
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
    const [
      CLEAN_SPOT,
      LOCATE,
      PAUSE,
      RETURN_TO_BASE,
      SEND_COMMAND,
      SET_FAN_SPEED,
      START,
      STOP,
    ] = synapse.registry.busTransfer({
      context,
      eventName: [
        "clean_spot",
        "locate",
        "pause",
        "return_to_base",
        "send_command",
        "set_fan_speed",
        "start",
        "stop",
      ],
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
