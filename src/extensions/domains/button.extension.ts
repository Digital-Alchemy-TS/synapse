import { is, TBlackHole, TServiceParams } from "@digital-alchemy/core";

import { isBaseEntityKeys, TRegistry, VIRTUAL_ENTITY_BASE_KEYS } from "../..";
import {
  ButtonConfiguration,
  SynapseButtonParams,
  SynapseVirtualButton,
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
        // > common
        if (isBaseEntityKeys(property)) {
          return loader.baseGet(property);
        }
        // > domain specific
        // * onPress
        if (property === "onPress") {
          return (callback: (remove: () => void) => TBlackHole) =>
            synapse.registry.removableListener(PRESS_EVENT, callback);
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
      ButtonConfiguration
    >({
      load_keys: ["device_class"],
      name: entity.name,
      registry: registry as TRegistry<unknown>,
      unique_id,
    });

    // - Attach bus events
    const [PRESS_EVENT] = synapse.registry.busTransfer({
      context,
      eventName: ["press"],
      unique_id,
    });

    // - Attach static listener
    if (is.function(entity.press)) {
      proxy.onPress(entity.press);
    }

    // - Done
    return proxy;
  };
}
