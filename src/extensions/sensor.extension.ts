import { TBlackHole, TContext, TServiceParams } from "@digital-alchemy/core";

import { SensorDeviceClasses, SensorStateClass, TRegistry } from "..";

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
  icon?: string;
  defaultAttributes?: ATTRIBUTES;
  name: string;
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
} & SensorDeviceClasses &
  (
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
         * Type of state. If not `None`, the sensor is assumed to be numerical and will be displayed as a line-chart in the frontend instead of as discrete values.
         */
        state_class?: SensorStateClass;
      }
  );

type SensorConfiguration = {
  //
};
type SensorValue = string | number;
type SwitchUpdateCallback<
  STATE extends SensorValue = SensorValue,
  ATTRIBUTES extends object = object,
> = (options: { state?: STATE; attributes?: ATTRIBUTES }) => TBlackHole;

export type VirtualSensor<
  STATE extends SensorValue = SensorValue,
  ATTRIBUTES extends object = object,
  CONFIGURATION extends SensorConfiguration = SensorConfiguration,
> = {
  icon: string;
  attributes: ATTRIBUTES;
  _configuration?: CONFIGURATION;
  _rawAttributes?: ATTRIBUTES;
  name: string;
  onUpdate: (callback: SwitchUpdateCallback<STATE, ATTRIBUTES>) => void;
  state: STATE;
  /**
   * bumps the last reset time
   */
  reset: () => TBlackHole;
} & SensorDeviceClasses;

export function Sensor({ context, synapse, logger }: TServiceParams) {
  const registry = synapse.registry.create<VirtualSensor>({
    context,
    details: entity => ({
      attributes: entity._rawAttributes,
      device_class: entity.device_class,
      state: entity.state,
      unit_of_measurement: entity.unit_of_measurement,
    }),
    domain: "sensor",
  });

  // # Sensor creation function
  function create<
    STATE extends SensorValue = SensorValue,
    ATTRIBUTES extends object = object,
    CONFIGURATION extends SensorConfiguration = SensorConfiguration,
  >(entity: TSensor<STATE, ATTRIBUTES>) {
    const sensorOut = new Proxy({} as VirtualSensor<STATE, ATTRIBUTES>, {
      // ### Getters
      get(_, property: keyof VirtualSensor<STATE, ATTRIBUTES>) {
        if (property === "state") {
          return loader.state;
        }
        if (property === "unit_of_measurement") {
          return entity.unit_of_measurement;
        }
        if (property === "device_class") {
          return entity.device_class;
        }
        if (property === "name") {
          return entity.name;
        }
        if (property === "onUpdate") {
          return loader.onUpdate();
        }
        if (property === "_rawAttributes") {
          return loader.attributes;
        }
        if (property === "reset") {
          return function () {
            // what it means to "reset" is up to dev
            entity.last_reset = new Date();
            logger.debug(`reset`);
          };
        }
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
        if (property === "icon") {
          return entity.icon;
        }
        return undefined;
      },
      ownKeys: () => {
        return [
          "state",
          "unit_of_measurement",
          "device_class",
          "name",
          "onUpdate",
          "attributes",
        ];
      },
      // ### Setters
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

    // ## Validate a good id was passed, and it's the only place in code that's using it
    const id = registry.add(sensorOut);

    const loader = synapse.storage.loader<STATE, ATTRIBUTES, CONFIGURATION>({
      id,
      name: entity.name,
      registry: registry as TRegistry<unknown>,
      value: {
        attributes: {} as ATTRIBUTES,
        configuration: {} as CONFIGURATION,
        state: "" as STATE,
      },
    });
    return sensorOut;
  }

  return create;
}
