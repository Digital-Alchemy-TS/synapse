import { TServiceParams } from "@digital-alchemy/core";

import {
  isBaseEntityKeys,
  SynapseUpdateParams,
  SynapseVirtualUpdate,
  UpdateConfiguration,
  VIRTUAL_ENTITY_BASE_KEYS,
} from "../..";
import { TRegistry } from "../registry.extension";

export function VirtualUpdate({ context, synapse }: TServiceParams) {
  const registry = synapse.registry.create<SynapseVirtualUpdate>({
    context,
    // @ts-expect-error it's fine
    domain: "cover",
  });

  // #MARK: create
  return function <
    STATE extends string = string,
    ATTRIBUTES extends object = object,
  >(entity: SynapseUpdateParams) {
    const proxy = new Proxy({} as SynapseVirtualUpdate, {
      // #MARK: get
      // eslint-disable-next-line sonarjs/cognitive-complexity
      get(_, property: keyof SynapseVirtualUpdate) {
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
      UpdateConfiguration
    >({
      load_keys: [
        "auto_update",
        "device_class",
        "in_progress",
        "installed_version",
        "latest_version",
        "release_notes",
        "release_summary",
        "release_url",
        "supported_features",
        "title",
      ],
      name: entity.name,
      registry: registry as TRegistry<unknown>,
      unique_id,
    });

    // - Attach bus events
    const { dynamicAttach, staticAttach, keys } = synapse.registry.busTransfer({
      context,
      eventName: ["install"],
      unique_id,
    });

    // - Attach static listener
    staticAttach(proxy, entity);

    // - Done
    return proxy;
  };
}
