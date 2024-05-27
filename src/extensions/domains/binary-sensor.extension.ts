import { TServiceParams } from "@digital-alchemy/core";

import {
  BinarySensorConfiguration,
  BinarySensorValue,
  isBaseEntityKeys,
  SynapseBinarySensorParams,
  SynapseVirtualBinarySensor,
  TRegistry,
  VIRTUAL_ENTITY_BASE_KEYS,
} from "../..";

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
        if (isBaseEntityKeys(property)) {
          return loader.baseGet(property);
        }
        // > domain specific
        // * is_on
        if (property === "is_on") {
          return loader.state === "on";
        }
        return undefined;
      },

      ownKeys: () => [...VIRTUAL_ENTITY_BASE_KEYS, "is_on"],

      // #MARK: set
      set(_, property: string, value: unknown) {
        // * attributes
        if (property === "attributes") {
          loader.setAttributes(value as ATTRIBUTES);
          return true;
        }
        // * state
        if (property === "state") {
          loader.setState(value as STATE);
          return true;
        }
        // > domain specific
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
