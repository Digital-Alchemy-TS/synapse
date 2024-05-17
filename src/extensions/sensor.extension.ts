import { TBlackHole, TContext, TServiceParams } from "@digital-alchemy/core";

import { SensorDeviceClasses, TRegistry } from "..";

type TSensor<STATE extends SensorValue, ATTRIBUTES extends object = object> = {
  context: TContext;
  defaultState?: STATE;
  icon?: string;
  defaultAttributes?: ATTRIBUTES;
  name: string;
} & SensorDeviceClasses;

type SensorValue = string | number;
type SwitchUpdateCallback<
  STATE extends SensorValue = SensorValue,
  ATTRIBUTES extends object = object,
> = (options: { state?: STATE; attributes?: ATTRIBUTES }) => TBlackHole;

export type VirtualSensor<
  STATE extends SensorValue = SensorValue,
  ATTRIBUTES extends object = object,
> = {
  icon: string;
  attributes: ATTRIBUTES;
  _rawAttributes?: ATTRIBUTES;
  name: string;
  onUpdate: (callback: SwitchUpdateCallback<STATE, ATTRIBUTES>) => void;
  state: STATE;
} & SensorDeviceClasses;

export function Sensor({ context, synapse }: TServiceParams) {
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

    const loader = synapse.storage.loader<STATE, ATTRIBUTES>({
      id,
      name: entity.name,
      registry: registry as TRegistry<unknown>,
      value: {
        attributes: {} as ATTRIBUTES,
        state: "" as STATE,
      },
    });
    return sensorOut;
  }

  return create;
}
