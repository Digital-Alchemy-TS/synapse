import { TServiceParams } from "@digital-alchemy/core";

import {
  HassLockEvent,
  LOCK_CONFIGURATION_KEYS,
  LockConfiguration,
  LockValue,
  TLock,
  TRegistry,
  TVirtualLock,
} from "..";

export function VirtualLock({
  context,
  synapse,
  hass,
  event,
  logger,
}: TServiceParams) {
  const registry = synapse.registry.create<TVirtualLock>({
    context,
    details: entity => ({
      attributes: entity._rawAttributes,
      configuration: entity._rawConfiguration,
      state: entity.state,
    }),
    // @ts-expect-error its fine
    domain: "lock",
  });

  // #MARK: create
  function create<
    STATE extends LockValue = LockValue,
    ATTRIBUTES extends object = object,
    CONFIGURATION extends LockConfiguration = LockConfiguration,
  >(entity: TLock<STATE, ATTRIBUTES>) {
    const entityOut = new Proxy({} as TVirtualLock<STATE, ATTRIBUTES>, {
      // #MARK: get
      get(_, property: keyof TVirtualLock<STATE, ATTRIBUTES>) {
        // * state
        if (property === "state") {
          return loader.state;
        }
        // * is_on
        if (property === "is_locked") {
          return loader.state === "locked";
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
          "is_locked",
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

    const unique_id = registry.add(entityOut, entity);
    const EVENT = (event: string) => `lock/${unique_id}/${event}`;

    ["lock", "unlock", "open"].forEach(name => {
      hass.socket.onEvent({
        context,
        event: synapse.registry.eventName(name),
        exec({ data: { unique_id: id } }: HassLockEvent) {
          if (id !== unique_id) {
            return;
          }
          logger.trace({ context, unique_id }, name);
          event.emit(EVENT(name));
        },
      });
    });

    const loader = synapse.storage.wrapper<STATE, ATTRIBUTES, CONFIGURATION>({
      name: entity.name,
      registry: registry as TRegistry<unknown>,
      unique_id,
      value: {
        attributes: (entity.defaultAttributes ?? {}) as ATTRIBUTES,
        configuration: Object.fromEntries(
          LOCK_CONFIGURATION_KEYS.map(key => [key, entity[key]]),
        ) as unknown as CONFIGURATION,
        state: (entity.defaultState ?? "off") as STATE,
      },
    });
    return entityOut;
  }

  return create;
}
