import { TServiceParams } from "@digital-alchemy/core";

import {
  isBaseEntityKeys,
  LawnMowerConfiguration,
  SynapseLawnMowerParams,
  SynapseVirtualLawnMower,
  VIRTUAL_ENTITY_BASE_KEYS,
} from "../../helpers";
import { TRegistry } from "../registry.extension";

export function VirtualLawnMower({ context, synapse }: TServiceParams) {
  const registry = synapse.registry.create<SynapseVirtualLawnMower>({
    context,
    // @ts-expect-error it's fine
    domain: "lawn_mower",
  });

  // #MARK: create
  return function <
    STATE extends string = string,
    ATTRIBUTES extends object = object,
  >(entity: SynapseLawnMowerParams) {
    const proxy = new Proxy({} as SynapseVirtualLawnMower, {
      // #MARK: get
      get(_, property: keyof SynapseVirtualLawnMower) {
        if (isBaseEntityKeys(property)) {
          return loader.baseGet(property);
        }
        return dynamicAttach(property);
      },

      ownKeys: () => [...VIRTUAL_ENTITY_BASE_KEYS, ...keys],

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
      LawnMowerConfiguration
    >({
      load_keys: ["activity", "supported_features"],
      name: entity.name,
      registry: registry as TRegistry<unknown>,
      unique_id,
    });

    // - Attach bus events
    const { dynamicAttach, staticAttach, keys } = synapse.registry.busTransfer({
      context,
      eventName: ["start_mowing", "dock", "pause"],
      unique_id,
    });

    // - Attach static listener
    staticAttach(proxy, entity);

    // - Done
    return proxy;
  };
}
