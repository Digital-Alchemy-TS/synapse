import { is, TServiceParams } from "@digital-alchemy/core";

import {
  isBaseEntityKeys,
  RemoteConfiguration,
  RemovableCallback,
  SynapseRemoteParams,
  SynapseVirtualRemote,
  VIRTUAL_ENTITY_BASE_KEYS,
} from "../..";
import { TRegistry } from "../registry.extension";

export function VirtualRemote({ context, synapse }: TServiceParams) {
  const registry = synapse.registry.create<SynapseVirtualRemote>({
    context,
    // @ts-expect-error it's fine
    domain: "remote",
  });

  // #MARK: create
  return function <
    STATE extends string = string,
    ATTRIBUTES extends object = object,
  >(entity: SynapseRemoteParams) {
    const proxy = new Proxy({} as SynapseVirtualRemote, {
      // #MARK: get
      // eslint-disable-next-line sonarjs/cognitive-complexity
      get(_, property: keyof SynapseVirtualRemote) {
        // > common
        if (isBaseEntityKeys(property)) {
          return loader.baseGet(property);
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
        // * onToggle
        if (property === "onToggle") {
          return (callback: RemovableCallback) =>
            synapse.registry.removableListener(TOGGLE, callback);
        }
        // * onSendCommand
        if (property === "onSendCommand") {
          return (callback: RemovableCallback) =>
            synapse.registry.removableListener(SEND_COMMAND, callback);
        }
        // * onLearnCommand
        if (property === "onLearnCommand") {
          return (callback: RemovableCallback) =>
            synapse.registry.removableListener(LEARN_COMMAND, callback);
        }
        // * onDeleteCommand
        if (property === "onDeleteCommand") {
          return (callback: RemovableCallback) =>
            synapse.registry.removableListener(DELETE_COMMAND, callback);
        }
        return undefined;
      },

      ownKeys: () => [
        ...VIRTUAL_ENTITY_BASE_KEYS,
        "onTurnOn",
        "onTurnOff",
        "onToggle",
        "onSendCommand",
        "onLearnCommand",
        "onDeleteCommand",
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
      RemoteConfiguration
    >({
      load_keys: ["current_activity", "activity_list", "supported_features"],
      name: entity.name,
      registry: registry as TRegistry<unknown>,
      unique_id,
    });

    // - Attach bus events
    const [
      TURN_ON,
      TURN_OFF,
      TOGGLE,
      SEND_COMMAND,
      LEARN_COMMAND,
      DELETE_COMMAND,
    ] = synapse.registry.busTransfer({
      context,
      eventName: [
        "turn_on",
        "turn_off",
        "toggle",
        "send_command",
        "learn_command",
        "delete_command",
      ],
      unique_id,
    });

    // - Attach static listener
    if (is.function(entity.turn_on)) {
      proxy.onTurnOn(entity.turn_on);
    }
    if (is.function(entity.turn_off)) {
      proxy.onTurnOff(entity.turn_off);
    }
    if (is.function(entity.toggle)) {
      proxy.onToggle(entity.toggle);
    }
    if (is.function(entity.send_command)) {
      proxy.onSendCommand(entity.send_command);
    }
    if (is.function(entity.learn_command)) {
      proxy.onLearnCommand(entity.learn_command);
    }
    if (is.function(entity.delete_command)) {
      proxy.onDeleteCommand(entity.delete_command);
    }

    // - Done
    return proxy;
  };
}
