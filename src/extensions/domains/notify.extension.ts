import { is, TBlackHole, TServiceParams } from "@digital-alchemy/core";

import {
  isBaseEntityKeys,
  NotifyConfiguration,
  SynapseNotifyParams,
  SynapseVirtualNotify,
  TRegistry,
  VIRTUAL_ENTITY_BASE_KEYS,
} from "../..";

export function VirtualNotify({ context, synapse }: TServiceParams) {
  const registry = synapse.registry.create<SynapseVirtualNotify>({
    context,
    // @ts-expect-error it's fine
    domain: "notify",
  });

  // #MARK: create
  return function <ATTRIBUTES extends object = object>(
    entity: SynapseNotifyParams,
  ) {
    // - Define the proxy
    const proxy = new Proxy({} as SynapseVirtualNotify, {
      // #MARK: get
      get(_, property: keyof SynapseVirtualNotify) {
        // > common
        if (isBaseEntityKeys(property)) {
          return loader.baseGet(property);
        }
        // > domain specific
        // * onPress
        if (property === "onSendMessage") {
          return (callback: (remove: () => void) => TBlackHole) =>
            synapse.registry.removableListener(SEND_MESSAGE, callback);
        }
        return undefined;
      },

      ownKeys: () => [...VIRTUAL_ENTITY_BASE_KEYS, "onPress"],

      // #MARK: set
      set(_, property: string, value: unknown) {
        // > common
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
      never,
      ATTRIBUTES,
      NotifyConfiguration
    >({
      name: entity.name,
      registry: registry as TRegistry<unknown>,
      unique_id,
    });

    // - Attach bus events
    const [SEND_MESSAGE] = synapse.registry.busTransfer({
      context,
      eventName: ["send_message"],
      unique_id,
    });

    // - Attach static listener
    if (is.function(entity.send_message)) {
      proxy.onSendMessage(entity.send_message);
    }

    // - Done
    return proxy;
  };
}
