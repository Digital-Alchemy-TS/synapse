import { TBlackHole, TContext, TServiceParams } from "@digital-alchemy/core";

import { SensorDeviceClasses, TRegistry } from "..";

type TNumber<STATE extends NumberValue, ATTRIBUTES extends object = object> = {
  context: TContext;
  defaultState?: STATE;
  icon?: string;
  defaultAttributes?: Omit<ATTRIBUTES, keyof BaseNumberAttributes>;
  name: string;
} & SensorDeviceClasses &
  BaseNumberAttributes;

type NumberValue = string | number;
type NumberUpdateCallback<
  STATE extends NumberValue = NumberValue,
  ATTRIBUTES extends object = object,
> = (options: { state?: STATE; attributes?: ATTRIBUTES }) => TBlackHole;

export type VirtualNumber<
  STATE extends NumberValue = NumberValue,
  ATTRIBUTES extends object = object,
> = {
  icon: string;
  attributes: ATTRIBUTES;
  _rawAttributes?: ATTRIBUTES;
  onUpdate: (callback: NumberUpdateCallback<STATE, ATTRIBUTES>) => void;
  state: STATE;
} & SensorDeviceClasses &
  BaseNumberAttributes;

type BaseNumberAttributes = {
  min?: number;
  name: string;
  max?: number;
  step?: number;
};

export function NumberDomain({ context, synapse }: TServiceParams) {
  const registry = synapse.registry.create<VirtualNumber>({
    context,
    details: entity => ({
      attributes: entity._rawAttributes,
      device_class: entity.device_class,
      state: entity.state,
      unit_of_measurement: entity.unit_of_measurement,
    }),
    // @ts-expect-error need to add more examples to `hass` to populate types
    domain: "number",
  });

  // # Sensor creation function
  function create<
    STATE extends NumberValue = NumberValue,
    ATTRIBUTES extends BaseNumberAttributes = BaseNumberAttributes,
  >(entity: TNumber<STATE, ATTRIBUTES>) {
    const numberOut = new Proxy({} as VirtualNumber<STATE, ATTRIBUTES>, {
      // ### Getters
      get(_, property: keyof VirtualNumber<STATE, ATTRIBUTES>) {
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
        if (property === "max") {
          return entity.max;
        }
        if (property === "min") {
          return entity.min;
        }
        if (property === "step") {
          return entity.step;
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

    const id = registry.add(numberOut);
    const loader = synapse.storage.wrapper<STATE, ATTRIBUTES>({
      name: entity.name,
      registry: registry as TRegistry<unknown>,
      unique_id: id,
      value: {
        attributes: {} as ATTRIBUTES,
        state: "" as STATE,
      },
    });
    return numberOut;
  }
  return create;
}
