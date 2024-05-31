import { TServiceParams } from "@digital-alchemy/core";

import {
  isBaseEntityKeys,
  SelectConfiguration,
  SynapseSelectParams,
  SynapseVirtualSelect,
  VIRTUAL_ENTITY_BASE_KEYS,
} from "../../helpers";
import { TRegistry } from "../registry.extension";

export function VirtualSelect({ context, synapse }: TServiceParams) {
  const registry = synapse.registry.create<SynapseVirtualSelect<string>>({
    context,
    // @ts-expect-error it's fine
    domain: "select",
  });

  // #MARK: create
  return function <OPTIONS extends string, ATTRIBUTES extends object = object>(
    entity: SynapseSelectParams<OPTIONS>,
  ) {
    const proxy = new Proxy({} as SynapseVirtualSelect<OPTIONS>, {
      // #MARK: get
      get(_, property: keyof SynapseVirtualSelect<OPTIONS>) {
        if (property === "state") {
          return loader.configuration.current_option;
        }
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
          loader.setConfiguration("current_option", value as OPTIONS);
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
    const loader = synapse.storage.wrapper<OPTIONS, ATTRIBUTES, SelectConfiguration<OPTIONS>>({
      load_keys: ["options", "current_option"],
      name: entity.name,
      registry: registry as TRegistry<unknown>,
      unique_id,
    });

    // - Attach bus events
    const { dynamicAttach, staticAttach, keys } = synapse.registry.busTransfer({
      context,
      eventName: ["select_option"],
      unique_id,
    });

    // - Attach static listener
    staticAttach(proxy, entity);

    if (entity.managed !== false) {
      proxy.onSelectOption(({ option }) => (proxy.configuration.current_option = option));
    }

    // - Done
    return proxy;
  };
}
