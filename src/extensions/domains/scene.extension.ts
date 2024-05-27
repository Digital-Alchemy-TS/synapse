import { is, TServiceParams } from "@digital-alchemy/core";

import {
  isBaseEntityKeys,
  RemovableCallback,
  SceneConfiguration,
  SynapseSceneParams,
  SynapseVirtualScene,
  TRegistry,
  VIRTUAL_ENTITY_BASE_KEYS,
} from "../..";

export function VirtualScene({ context, synapse }: TServiceParams) {
  const registry = synapse.registry.create<SynapseVirtualScene>({
    context,
    domain: "scene",
  });

  // #MARK: create
  return function <
    STATE extends void = void,
    ATTRIBUTES extends object = object,
    CONFIGURATION extends SceneConfiguration = SceneConfiguration,
  >(entity: SynapseSceneParams) {
    // - Define the proxy
    const proxy = new Proxy({} as SynapseVirtualScene, {
      // #MARK: get
      get(_, property: keyof SynapseVirtualScene) {
        // > common
        if (isBaseEntityKeys(property)) {
          return loader.baseGet(property);
        }
        // > domain specific
        // * onActivate
        if (property === "onActivate") {
          return (callback: RemovableCallback) =>
            synapse.registry.removableListener(ACTIVATE, callback);
        }
        return undefined;
      },

      ownKeys: () => [...VIRTUAL_ENTITY_BASE_KEYS, "onActivate"],

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
    const loader = synapse.storage.wrapper<STATE, ATTRIBUTES, CONFIGURATION>({
      name: entity.name,
      registry: registry as TRegistry<unknown>,
      unique_id,
    });

    // - Attach bus events
    const [ACTIVATE] = synapse.registry.busTransfer({
      context,
      eventName: ["activate"],
      unique_id,
    });

    // - Attach static listener
    if (is.function(entity.activate)) {
      proxy.onActivate(entity.activate);
    }

    // - Done
    return proxy;
  };
}
