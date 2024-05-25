import { TServiceParams } from "@digital-alchemy/core";

import {
  BinarySensorConfiguration,
  BinarySensorValue,
  SynapseBinarySensorParams,
  SynapseVirtualBinarySensor,
  TRegistry,
  VIRTUAL_ENTITY_BASE_KEYS,
} from "..";

export function VirtualBinarySensor({ context, synapse }: TServiceParams) {
  const registry = synapse.registry.create<SynapseVirtualBinarySensor>({
    context,
    domain: "binary_sensor",
  });

  return function <
    STATE extends BinarySensorValue = BinarySensorValue,
    ATTRIBUTES extends object = object,
  >(entity: SynapseBinarySensorParams) {
    // - Provide additional defaults
    entity.defaultState ??= "off";

    // - Define the proxy
    const proxy = new Proxy({} as SynapseVirtualBinarySensor, {
      // #MARK: get
      get(_, property: keyof SynapseVirtualBinarySensor) {
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
        // > domain specific
        // * state
        if (property === "state") {
          return loader.state;
        }
        // * is_on
        if (property === "is_on") {
          return loader.state === "on";
        }
        return undefined;
      },

      ownKeys: () => [...VIRTUAL_ENTITY_BASE_KEYS, "is_on", "state"],

      // #MARK: set
      set(_, property: string, value: unknown) {
        // * attributes
        if (property === "attributes") {
          loader.setAttributes(value as ATTRIBUTES);
          return true;
        }
        // > domain specific
        // * state
        if (property === "state") {
          loader.setState(value as STATE);
          return true;
        }
        // * is_on
        if (property === "is_on") {
          const new_state = ((value as boolean) ? "on" : "off") as STATE;
          loader.setState(new_state);
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
      BinarySensorConfiguration
    >({
      config_defaults: { entity_category: "diagnostic" },
      load_keys: ["device_class"],
      name: entity.name,
      registry: registry as TRegistry<unknown>,
      unique_id,
    });

    // - Done
    return proxy;
  };
}
