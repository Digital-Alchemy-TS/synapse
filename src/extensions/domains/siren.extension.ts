import { TServiceParams } from "@digital-alchemy/core";

import {
  isBaseEntityKeys,
  SirenConfiguration,
  SynapseSirenParams,
  SynapseVirtualSiren,
  VIRTUAL_ENTITY_BASE_KEYS,
} from "../../helpers";
import { TRegistry } from "../registry.extension";

export function VirtualSiren({ context, synapse }: TServiceParams) {
  const registry = synapse.registry.create<SynapseVirtualSiren>({
    context,
    // @ts-expect-error it's fine
    domain: "valve",
  });

  // #MARK: create
  return function <
    STATE extends string = string,
    ATTRIBUTES extends object = object,
  >(entity: SynapseSirenParams) {
    const proxy = new Proxy({} as SynapseVirtualSiren, {
      // #MARK: get
      get(_, property: keyof SynapseVirtualSiren) {
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
      SirenConfiguration
    >({
      load_keys: ["is_on", "available_tones", "supported_features"],
      name: entity.name,
      registry: registry as TRegistry<unknown>,
      unique_id,
    });

    // - Attach bus events
    const { dynamicAttach, staticAttach, keys } = synapse.registry.busTransfer({
      context,
      eventName: ["turn_off", "turn_on"],
      unique_id,
    });

    // - Attach static listener
    staticAttach(proxy, entity);

    // - Done
    return proxy;
  };
}
