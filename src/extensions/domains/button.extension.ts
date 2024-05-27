import { TServiceParams } from "@digital-alchemy/core";

import {
  ButtonConfiguration,
  isBaseEntityKeys,
  SynapseButtonParams,
  SynapseVirtualButton,
  TRegistry,
  VIRTUAL_ENTITY_BASE_KEYS,
} from "../..";

export function VirtualButton({ context, synapse }: TServiceParams) {
  const registry = synapse.registry.create<SynapseVirtualButton>({
    context,
    // @ts-expect-error it's fine
    domain: "button",
  });

  // #MARK: create
  return function <ATTRIBUTES extends object = object>(
    entity: SynapseButtonParams,
  ) {
    // - Define the proxy
    const proxy = new Proxy({} as SynapseVirtualButton, {
      // #MARK: get
      get(_, property: keyof SynapseVirtualButton) {
        if (isBaseEntityKeys(property)) {
          return loader.baseGet(property);
        }
        return dynamicAttach(property);
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
      ButtonConfiguration
    >({
      load_keys: ["device_class"],
      name: entity.name,
      registry: registry as TRegistry<unknown>,
      unique_id,
    });

    // - Attach bus events
    const { dynamicAttach, staticAttach } = synapse.registry.busTransfer({
      context,
      eventName: ["press"],
      unique_id,
    });

    // - Attach static listener
    staticAttach(proxy, entity);

    // - Done
    return proxy;
  };
}
