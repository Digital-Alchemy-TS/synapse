import { is, TBlackHole, TServiceParams } from "@digital-alchemy/core";

import {
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
    const SEND_MESSAGE = synapse.registry.busTransfer({
      context,
      eventName: "send_message",
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
