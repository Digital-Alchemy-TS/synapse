import { TServiceParams } from "@digital-alchemy/core";

import {
  isBaseEntityKeys,
  NumberConfiguration,
  SynapseNumberParams,
  SynapseVirtualNumber,
  VIRTUAL_ENTITY_BASE_KEYS,
} from "../../helpers";
import { TRegistry } from "../registry.extension";

export function VirtualNumber({ context, synapse }: TServiceParams) {
  const registry = synapse.registry.create<SynapseVirtualNumber>({
    context,
    // @ts-expect-error it's fine
    domain: "number",
  });

  // #MARK: create
  return function <
    STATE extends number = number,
    ATTRIBUTES extends object = object,
  >(entity: SynapseNumberParams) {
    const proxy = new Proxy({} as SynapseVirtualNumber, {
      // #MARK: get
      get(_, property: keyof SynapseVirtualNumber) {
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
      NumberConfiguration
    >({
      config_defaults: {
        mode: "auto",
        native_max_value: 100,
        native_min_value: 0,
        step: 1,
      },
      load_keys: ["mode", "native_max_value", "native_min_value", "step"],
      name: entity.name,
      registry: registry as TRegistry<unknown>,
      unique_id,
    });

    // - Attach bus events
    const { dynamicAttach, staticAttach, keys } = synapse.registry.busTransfer({
      context,
      eventName: ["native_set_value"],
      unique_id,
    });

    // - Attach static listener
    staticAttach(proxy, entity);

    if (entity.managed !== false) {
      proxy.onSetValue(({ value }) => (proxy.state = value));
    }

    // - Done
    return proxy;
  };
}
