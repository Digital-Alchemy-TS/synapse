import { TServiceParams } from "@digital-alchemy/core";

import {
  SENSOR_DEVICE_CLASS_CONFIG_KEYS,
  SensorConfiguration,
  SensorValue,
  SynapseSensorParams,
  SynapseVirtualSensor,
  TRegistry,
  VIRTUAL_ENTITY_BASE_KEYS,
} from "../..";

export function VirtualSensor({ context, synapse, logger }: TServiceParams) {
  const registry = synapse.registry.create<SynapseVirtualSensor>({
    context,
    domain: "sensor",
  });

  return function <
    STATE extends SensorValue = SensorValue,
    ATTRIBUTES extends object = object,
  >(entity: SynapseSensorParams) {
    // - Provide additional defaults
    entity.defaultState ??= "" as STATE;

    // - Define the proxy
    const proxy = new Proxy({} as SynapseVirtualSensor, {
      // #MARK: get
      get(_, property: keyof SynapseVirtualSensor) {
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
        // * reset
        if (property === "reset") {
          return function () {
            logger.debug(
              { context: entity.context, name: entity.name },
              `reset`,
            );
            // what it means to "reset" is up to dev
            entity.last_reset = new Date();
          };
        }
        return undefined;
      },

      ownKeys: () => [...VIRTUAL_ENTITY_BASE_KEYS, "reset"],

      // #MARK: set
      set(_, property: string, value: unknown) {
        // > common
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
        return false;
      },
    });

    // - Add to registry
    const unique_id = registry.add(proxy, entity);

    // - Initialize value storage
    const loader = synapse.storage.wrapper<
      STATE,
      ATTRIBUTES,
      SensorConfiguration
    >({
      load_keys: [
        ...SENSOR_DEVICE_CLASS_CONFIG_KEYS,
        "last_reset",
        "options",
        "state_class",
        "suggested_display_precision",
        "unit_of_measurement",
      ] as (keyof SensorConfiguration)[],
      name: entity.name,
      registry: registry as TRegistry<unknown>,
      unique_id,
    });

    // - Done
    return proxy;
  };
}
