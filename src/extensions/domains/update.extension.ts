import { is, TServiceParams } from "@digital-alchemy/core";

import {
  RemovableCallback,
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
        // * onInstall
        if (property === "onInstall") {
          return (callback: RemovableCallback) =>
            synapse.registry.removableListener(INSTALL, callback);
        }
        return undefined;
      },

      ownKeys: () => [...VIRTUAL_ENTITY_BASE_KEYS, "onInstall"],

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
    const [INSTALL] = synapse.registry.busTransfer({
      context,
      eventName: ["install"],
      unique_id,
    });

    // - Attach static listener
    if (is.function(entity.install)) {
      proxy.onInstall(entity.install);
    }

    // - Done
    return proxy;
  };
}
