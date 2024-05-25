import { TServiceParams } from "@digital-alchemy/core";

import {
  SENSOR_CONFIGURATION_KEYS,
  SensorConfiguration,
  SensorValue,
  TRegistry,
  TSensor,
  TVirtualSensor,
} from "..";

export function VirtualSensor({ context, synapse, logger }: TServiceParams) {
  const registry = synapse.registry.create<TVirtualSensor>({
    context,
    details: entity => ({
      attributes: entity._rawAttributes,
      configuration: entity._rawConfiguration,
      state: entity.state,
    }),
    domain: "sensor",
  });

  // #MARK: create
  function create<
    STATE extends SensorValue = SensorValue,
    ATTRIBUTES extends object = object,
    CONFIGURATION extends SensorConfiguration = SensorConfiguration,
  >(entity: TSensor<STATE, ATTRIBUTES>) {
    const entityOut = new Proxy({} as TVirtualSensor<STATE, ATTRIBUTES>, {
      // #MARK: get
      get(_, property: keyof TVirtualSensor<STATE, ATTRIBUTES>) {
        // * state
        if (property === "state") {
          return loader.state;
        }
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
        // * reset
        if (property === "reset") {
          return function () {
            // what it means to "reset" is up to dev
            entity.last_reset = new Date();
            logger.debug(`reset`);
          };
        }
        // * attributes
        if (property === "attributes") {
          return new Proxy({} as ATTRIBUTES, {
            get: <KEY extends Extract<keyof ATTRIBUTES, string>>(
              _: ATTRIBUTES,
              property: KEY,
            ) => {
              return loader.attributes[property];
            },
            set: <
              KEY extends Extract<keyof ATTRIBUTES, string>,
              VALUE extends ATTRIBUTES[KEY],
            >(
              _: ATTRIBUTES,
              property: KEY,
              value: VALUE,
            ) => {
              loader.setAttribute(property, value);
              return true;
            },
          });
        }
        // * configuration
        if (property === "configuration") {
          return new Proxy({} as CONFIGURATION, {
            get: <KEY extends Extract<keyof CONFIGURATION, string>>(
              _: CONFIGURATION,
              property: KEY,
            ) => {
              return loader.configuration[property];
            },
            set: <
              KEY extends Extract<keyof CONFIGURATION, string>,
              VALUE extends CONFIGURATION[KEY],
            >(
              _: CONFIGURATION,
              property: KEY,
              value: VALUE,
            ) => {
              loader.setConfiguration(property, value);
              return true;
            },
          });
        }
        return undefined;
      },
      // #MARK: ownKeys
      ownKeys: () => {
        return [
          "attributes",
          "configuration",
          "_rawAttributes",
          "_rawConfiguration",
          "name",
          "onUpdate",
          "state",
          "reset",
        ];
      },
      // #MARK: set
      set(_, property: string, value: unknown) {
        // entity.state = ...
        if (property === "state") {
          loader.setState(value as STATE);
          return true;
        }
        // entity.attributes = { ... }
        if (property === "attributes") {
          loader.setAttributes(value as ATTRIBUTES);
          return true;
        }
        // not supported:
        // entity.configuration = {...}
        return false;
      },
    });

    // Validate a good id was passed, and it's the only place in code that's using it
    const unique_id = registry.add(entityOut, entity);

    const loader = synapse.storage.wrapper<STATE, ATTRIBUTES, CONFIGURATION>({
      name: entity.name,
      registry: registry as TRegistry<unknown>,
      unique_id,
      value: {
        attributes: (entity.defaultAttributes ?? {}) as ATTRIBUTES,
        configuration: Object.fromEntries(
          SENSOR_CONFIGURATION_KEYS.map(key => [key, entity[key]]),
        ) as CONFIGURATION,
        state: (entity.defaultState ?? "") as STATE,
      },
    });
    return entityOut;
  }

  return create;
}
