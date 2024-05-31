import { TServiceParams } from "@digital-alchemy/core";

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
  return function <ATTRIBUTES extends object = object>(entity: SynapseNotifyParams) {
    // - Define the proxy
    const proxy = new Proxy({} as SynapseVirtualNotify, {
      // #MARK: get
      get(_, property: keyof SynapseVirtualNotify) {
        if (isBaseEntityKeys(property)) {
          return loader.baseGet(property);
        }
        return dynamicAttach(property);
      },

      ownKeys: () => [...VIRTUAL_ENTITY_BASE_KEYS, ...keys],

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
    const loader = synapse.storage.wrapper<never, ATTRIBUTES, NotifyConfiguration>({
      name: entity.name,
      registry: registry as TRegistry<unknown>,
      unique_id,
    });

    // - Attach bus events
    const { dynamicAttach, staticAttach, keys } = synapse.registry.busTransfer({
      context,
      eventName: ["send_message"],
      unique_id,
    });

    // - Attach static listener
    staticAttach(proxy, entity);

    // - Done
    return proxy;
  };
}
