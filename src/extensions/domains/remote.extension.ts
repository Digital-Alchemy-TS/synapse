import { TServiceParams } from "@digital-alchemy/core";

import {
  isBaseEntityKeys,
  RemoteConfiguration,
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
        if (isBaseEntityKeys(property)) {
          return loader.baseGet(property);
        }
        return dynamicAttach(property);
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
    const { dynamicAttach, staticAttach } = synapse.registry.busTransfer({
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
    staticAttach(proxy, entity);

    // - Done
    return proxy;
  };
}
