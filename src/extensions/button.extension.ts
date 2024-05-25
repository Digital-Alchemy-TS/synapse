import { is, TBlackHole, TServiceParams } from "@digital-alchemy/core";

import { TRegistry } from "..";
import {
  BUTTON_CONFIGURATION_KEYS,
  ButtonConfiguration,
  HassButtonUpdateEvent,
  TButton,
  TVirtualButton,
} from "../helpers/domains";

export function VirtualButton({
  logger,
  event,
  hass,
  context,
  synapse,
  internal,
}: TServiceParams) {
  const registry = synapse.registry.create<TVirtualButton>({
    context,
    details: entity => ({
      attributes: entity._rawAttributes,
      configuration: entity._rawConfiguration,
      state: undefined,
    }),
    // @ts-expect-error it's fine
    domain: "button",
  });

  // #MARK: create
  function create<
    STATE extends void = void,
    ATTRIBUTES extends object = object,
    CONFIGURATION extends ButtonConfiguration = ButtonConfiguration,
  >(entity: TButton<ATTRIBUTES>) {
    const entityOut = new Proxy({} as TVirtualButton<STATE, ATTRIBUTES>, {
      // #MARK: get
      get(_, property: keyof TVirtualButton<STATE, ATTRIBUTES>) {
        // * state
        if (property === "state") {
          return undefined;
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
        // * onPress
        if (property === "onPress") {
          return function (callback: (remove: () => void) => TBlackHole) {
            const remove = () => event.removeListener(EVENT_ID, exec);
            const exec = async () =>
              await internal.safeExec(async () => callback(remove));
            event.on(EVENT_ID, exec);
            return { remove };
          };
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
          "onPress",
        ];
      },
      // #MARK: set
      set(_, property: string, value: unknown) {
        if (property === "attributes") {
          loader.setAttributes(value as ATTRIBUTES);
          return true;
        }
        return false;
      },
    });

    // Validate a good id was passed, and it's the only place in code that's using it
    const unique_id = registry.add(entityOut, entity);
    const EVENT_ID = `synapse/press/${unique_id}`;

    const loader = synapse.storage.wrapper<STATE, ATTRIBUTES, CONFIGURATION>({
      name: entity.name,
      registry: registry as TRegistry<unknown>,
      unique_id,
      value: {
        attributes: (entity.defaultAttributes ?? {}) as ATTRIBUTES,
        configuration: Object.fromEntries(
          BUTTON_CONFIGURATION_KEYS.map(key => [key, entity[key]]),
        ) as unknown as CONFIGURATION,
        state: undefined,
      },
    });

    logger.error({ event }, `listening for event`);

    hass.socket.onEvent({
      context,
      event: synapse.registry.eventName("press"),
      async exec({ data: { unique_id: id } }: HassButtonUpdateEvent) {
        if (id !== unique_id) {
          return;
        }
        logger.trace({ context, name: entity.name }, `press`);
        event.emit(EVENT_ID);
      },
    });
    if (is.function(entity.press)) {
      const remove = () => event.removeListener(EVENT_ID, callback);
      const callback = async () =>
        await internal.safeExec(async () => entity.press(remove));
      event.on(EVENT_ID, callback);
    }

    return entityOut;
  }

  return create;
}
