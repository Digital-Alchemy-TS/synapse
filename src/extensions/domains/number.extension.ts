import { is, TServiceParams } from "@digital-alchemy/core";

import { RemovableCallback, VIRTUAL_ENTITY_BASE_KEYS } from "../../helpers";
import {
  NumberConfiguration,
  SynapseNumberParams,
  SynapseVirtualNumber,
} from "../../helpers/domains/number";
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
        if (property === "onSetValue") {
          return (callback: RemovableCallback) =>
            synapse.registry.removableListener(SET_VALUE, callback);
        }
        return undefined;
      },

      ownKeys: () => [...VIRTUAL_ENTITY_BASE_KEYS, "onSetValue"],

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
      config_defaults: { max_value: 100, min_value: 0, mode: "auto", step: 1 },
      load_keys: ["mode", "max_value", "min_value", "step"],
      name: entity.name,
      registry: registry as TRegistry<unknown>,
      unique_id,
    });

    // - Attach bus events
    const SET_VALUE = synapse.registry.busTransfer({
      context,
      eventName: "native_set_value",
      unique_id,
    });

    // - Attach static listener
    if (is.function(entity.set_value)) {
      proxy.onSetValue(entity.set_value);
    }

    if (entity.managed !== false) {
      proxy.onSetValue(({ value }) => (proxy.state = value));
    }

    // - Done
    return proxy;
  };
}
