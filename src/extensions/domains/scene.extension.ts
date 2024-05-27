import { is, TServiceParams } from "@digital-alchemy/core";

import {
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
