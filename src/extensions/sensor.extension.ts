import { TBlackHole, TContext, TServiceParams } from "@digital-alchemy/core";
import { ENTITY_STATE, PICK_ENTITY } from "@digital-alchemy/hass";

import {
  BASE_CONFIG_KEYS,
  EntityConfigCommon,
  SENSOR_DEVICE_CLASS_CONFIG_KEYS,
  SensorDeviceClasses,
  SensorStateClass,
  TRegistry,
} from "..";

// type SensorTypes =
//   | "none"
//   | "date"
//   | "datetime"
//   | "decimal"
//   | "float"
//   | "int"
//   | "string";

type TSensor<STATE extends SensorValue, ATTRIBUTES extends object = object> = {
  context: TContext;
  defaultState?: STATE;
  defaultAttributes?: ATTRIBUTES;
  name: string;
} & SensorConfiguration;

type SensorConfiguration = EntityConfigCommon &
  SensorDeviceClasses & {
    /**
     * The number of decimals which should be used in the sensor's state when it's displayed.
     */
    suggested_display_precision?: number;
    /**
     * The time when an accumulating sensor such as an electricity usage meter, gas meter, water meter etc. was initialized.
     *
     * If the time of initialization is unknown, set it to `None`.
     *
     * Note that the `datetime.datetime` returned by the `last_reset` property will be converted to an ISO 8601-formatted string when the entity's state attributes are updated. When changing `last_reset`, the `state` must be a valid number.
     */
    last_reset?: Date;
  } & (
    | {
        /**
         * In case this sensor provides a textual state, this property can be used to provide a list of possible states.
         * Requires the enum device class to be set.
         * Cannot be combined with `state_class` or `native_unit_of_measurement`.
         */
        options?: string[];
      }
    | {
        /**
         * Type of state.
         * If not `None`, the sensor is assumed to be numerical and will be displayed as a line-chart in the frontend instead of as discrete values.
         */
        state_class?: SensorStateClass;
      }
  );

type SensorValue = string | number;

const CONFIGURATION_KEYS = [
  ...BASE_CONFIG_KEYS,
  ...SENSOR_DEVICE_CLASS_CONFIG_KEYS,
  "last_reset",
  "options",
  "state_class",
  "suggested_display_precision",
  "unit_of_measurement",
] as (keyof SensorConfiguration)[];

type UpdateCallback<ENTITY_ID extends PICK_ENTITY> = (
  callback: (
    new_state: NonNullable<ENTITY_STATE<ENTITY_ID>>,
    old_state: NonNullable<ENTITY_STATE<ENTITY_ID>>,
    remove: () => TBlackHole,
  ) => TBlackHole,
) => {
  remove: () => void;
};

export type VirtualSensor<
  STATE extends SensorValue = SensorValue,
  ATTRIBUTES extends object = object,
  CONFIGURATION extends SensorConfiguration = SensorConfiguration,
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
   * the current state
   */
  state: STATE;
  /**
   * Used to uniquely identify this entity in home assistant
   */
  unique_id: string;
  /**
   * bumps the last reset time
   */
  reset: () => TBlackHole;
};

export function Sensor({ context, synapse, logger }: TServiceParams) {
  const registry = synapse.registry.create<VirtualSensor>({
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
    const sensorOut = new Proxy({} as VirtualSensor<STATE, ATTRIBUTES>, {
      // #MARK: get
      get(_, property: keyof VirtualSensor<STATE, ATTRIBUTES>) {
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
    const unique_id = registry.add(sensorOut, entity);

    const loader = synapse.storage.wrapper<STATE, ATTRIBUTES, CONFIGURATION>({
      name: entity.name,
      registry: registry as TRegistry<unknown>,
      unique_id,
      value: {
        attributes: (entity.defaultAttributes ?? {}) as ATTRIBUTES,
        configuration: Object.fromEntries(
          CONFIGURATION_KEYS.map(key => [key, entity[key]]),
        ) as CONFIGURATION,
        state: (entity.defaultState ?? "") as STATE,
      },
    });
    return sensorOut;
  }

  return create;
}
