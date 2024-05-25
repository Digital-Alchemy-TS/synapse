import { TServiceParams } from "@digital-alchemy/core";

import {
  BINARY_SENSOR_CONFIGURATION_KEYS,
  BinarySensorConfiguration,
  BinarySensorValue,
  TBinarySensor,
  TRegistry,
  TVirtualBinarySensor,
} from "..";

export function VirtualBinarySensor({ context, synapse }: TServiceParams) {
  const registry = synapse.registry.create<TVirtualBinarySensor>({
    context,
    details: entity => ({
      attributes: entity._rawAttributes,
      configuration: entity._rawConfiguration,
      state: entity.state,
    }),
    domain: "binary_sensor",
  });

  // #MARK: create
  function create<
    STATE extends BinarySensorValue = BinarySensorValue,
    ATTRIBUTES extends object = object,
    CONFIGURATION extends BinarySensorConfiguration = BinarySensorConfiguration,
  >(entity: TBinarySensor<STATE, ATTRIBUTES>) {
    const entityOut = new Proxy({} as TVirtualBinarySensor<STATE, ATTRIBUTES>, {
      // #MARK: get
      get(_, property: keyof TVirtualBinarySensor<STATE, ATTRIBUTES>) {
        // * state
        if (property === "state") {
          return loader.state;
        }
        // * is_on
        if (property === "is_on") {
          return loader.state === "on";
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
          "is_on",
          "onUpdate",
          "state",
        ];
      },
      // #MARK: set
      set(_, property: string, value: unknown) {
        if (property === "state") {
          loader.setState(value as STATE);
          return true;
        }
        if (property === "is_on") {
          const new_state = ((value as boolean) ? "on" : "off") as STATE;
          loader.setState(new_state);
          return true;
        }
        if (property === "attributes") {
          loader.setAttributes(value as ATTRIBUTES);
          return true;
        }
        return false;
      },
    });

    // Validate a good id was passed, and it's the only place in code that's using it
    const unique_id = registry.add(entityOut, entity);
    const defaultData = {
      ...entity,
      entity_category: "diagnostic",
    };

    const loader = synapse.storage.wrapper<STATE, ATTRIBUTES, CONFIGURATION>({
      name: entity.name,
      registry: registry as TRegistry<unknown>,
      unique_id,
      value: {
        attributes: (entity.defaultAttributes ?? {}) as ATTRIBUTES,
        configuration: Object.fromEntries(
          BINARY_SENSOR_CONFIGURATION_KEYS.map(key => [key, defaultData[key]]),
        ) as unknown as CONFIGURATION,
        state: (entity.defaultState ?? "off") as STATE,
      },
    });
    return entityOut;
  }

  return create;
}
