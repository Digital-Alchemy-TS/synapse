import { TBlackHole, TContext, TServiceParams } from "@digital-alchemy/core";
import {
  ButtonDeviceClass,
  ENTITY_STATE,
  PICK_ENTITY,
} from "@digital-alchemy/hass";

import {
  BASE_CONFIG_KEYS,
  EntityConfigCommon,
  TRegistry,
  TSynapseId,
} from "..";

type TButton<ATTRIBUTES extends object = object> = {
  context: TContext;
  // defaultState?: STATE;
  defaultAttributes?: ATTRIBUTES;
  name: string;
} & ButtonConfiguration;

type ButtonConfiguration = EntityConfigCommon & {
  exec: () => TBlackHole;
  device_class?: `${ButtonDeviceClass}`;
};

const CONFIGURATION_KEYS = [
  ...BASE_CONFIG_KEYS,
  "device_class",
  // exec should not be included
] as (keyof ButtonConfiguration)[];

type UpdateCallback<ENTITY_ID extends PICK_ENTITY> = (
  callback: (
    new_state: NonNullable<ENTITY_STATE<ENTITY_ID>>,
    old_state: NonNullable<ENTITY_STATE<ENTITY_ID>>,
    remove: () => TBlackHole,
  ) => TBlackHole,
) => {
  remove: () => void;
};

export type TVirtualButton<
  STATE extends void = void,
  ATTRIBUTES extends object = object,
  CONFIGURATION extends ButtonConfiguration = ButtonConfiguration,
  ENTITY_ID extends PICK_ENTITY<"sensor"> = PICK_ENTITY<"sensor">,
> = {
  /**
   * Do not define attributes that change frequently.
   * Create new sensors instead
   */
  attributes: ATTRIBUTES;
  configuration: CONFIGURATION;
  _rawAttributes: ATTRIBUTES;
  _rawConfiguration: ATTRIBUTES;
  name: string;
  /**
   * look up the entity id, and
   */
  onUpdate: UpdateCallback<ENTITY_ID>;
  /**
   * NOT USED WITH BUTTONS
   *
   * Virtual buttons are stateless
   */
  state: STATE;
  /**
   * Used to uniquely identify this entity in home assistant
   */
  unique_id: string;
};

type HassButtonUpdateEvent = { data: { unique_id: TSynapseId } };

export function VirtualButton({
  logger,
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
      state: entity.state,
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
    const sensorOut = new Proxy({} as TVirtualButton<STATE, ATTRIBUTES>, {
      // #MARK: get
      get(_, property: keyof TVirtualButton<STATE, ATTRIBUTES>) {
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
          "is_on",
          "onUpdate",
          "state",
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
    const unique_id = registry.add(sensorOut, entity);

    const loader = synapse.storage.wrapper<STATE, ATTRIBUTES, CONFIGURATION>({
      name: entity.name,
      registry: registry as TRegistry<unknown>,
      unique_id,
      value: {
        attributes: (entity.defaultAttributes ?? {}) as ATTRIBUTES,
        configuration: Object.fromEntries(
          CONFIGURATION_KEYS.map(key => [key, entity[key]]),
        ) as unknown as CONFIGURATION,
        state: undefined,
      },
    });

    const event = synapse.registry.eventName("press");
    logger.error({ event }, `listening for event`);

    hass.socket.onEvent({
      context,
      event,
      async exec({ data: { unique_id: id } }: HassButtonUpdateEvent) {
        if (id !== unique_id) {
          return;
        }
        logger.trace({ context, name: entity.name }, `press`);
        await internal.safeExec(async () => entity.exec());
      },
    });

    return sensorOut;
  }

  return create;
}
