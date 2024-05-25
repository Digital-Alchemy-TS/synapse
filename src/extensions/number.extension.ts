import { NONE, TServiceParams } from "@digital-alchemy/core";

import {
  HassNumberEvent,
  NUMBER_CONFIGURATION_KEYS,
  NumberConfiguration,
  TNumber,
  TVirtualNumber,
} from "../helpers/domains/number";
import { TRegistry } from "./registry.extension";

export function VirtualNumber({
  context,
  synapse,
  hass,
  logger,
}: TServiceParams) {
  const registry = synapse.registry.create<TVirtualNumber>({
    context,
    details: entity => ({
      attributes: entity._rawAttributes,
      configuration: entity._rawConfiguration,
      state: entity.state,
    }),
    // @ts-expect-error it's fine
    domain: "number",
  });

  // #MARK: create
  function create<
    STATE extends number = number,
    ATTRIBUTES extends object = object,
    CONFIGURATION extends NumberConfiguration = NumberConfiguration,
  >(entity: TNumber<STATE, ATTRIBUTES>) {
    const entityOut = new Proxy({} as TVirtualNumber<STATE, ATTRIBUTES>, {
      // #MARK: get
      get(_, property: keyof TVirtualNumber<STATE, ATTRIBUTES>) {
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
        ];
      },
      // #MARK: set
      set(_, property: string, value: unknown) {
        if (property === "state") {
          loader.setState(value as STATE);
          return true;
        }
        if (property === "attributes") {
          loader.setAttributes(value as ATTRIBUTES);
          return true;
        }
        return false;
      },
    });

    const unique_id = registry.add(entityOut, entity);

    hass.socket.onEvent({
      context,
      event: synapse.registry.eventName("set_native_value"),
      exec({ data: { unique_id: id, value } }: HassNumberEvent) {
        if (id !== unique_id) {
          return;
        }
        logger.trace({ context, unique_id }, "set_native_value");
        loader.setState(value as STATE);
      },
    });

    const defaults = {
      max_value: 100,
      min_value: 0,
      mode: "auto",
      step: 1,
      ...entity,
    };

    const loader = synapse.storage.wrapper<STATE, ATTRIBUTES, CONFIGURATION>({
      name: entity.name,
      registry: registry as TRegistry<unknown>,
      unique_id,
      value: {
        attributes: (entity.defaultAttributes ?? {}) as ATTRIBUTES,
        configuration: Object.fromEntries(
          NUMBER_CONFIGURATION_KEYS.map(key => [key, defaults[key]]),
        ) as unknown as CONFIGURATION,
        state: (entity.defaultState ?? entity.min_value ?? NONE) as STATE,
      },
    });
    return entityOut;
  }

  return create;
}
