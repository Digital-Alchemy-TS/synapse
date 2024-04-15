import {
  START,
  TBlackHole,
  TContext,
  TServiceParams,
} from "@digital-alchemy/core";

import { SensorDeviceClasses, TRegistry } from "..";

type TSelect<STATE extends SelectValue, ATTRIBUTES extends object = object> = {
  context: TContext;
  defaultState?: STATE;
  icon?: string;
  defaultAttributes?: Omit<ATTRIBUTES, keyof BaseSelectAttributes>;
  name: string;
} & SensorDeviceClasses &
  BaseSelectAttributes;

type SelectValue = string;
type SelectUpdateCallback<
  STATE extends SelectValue = SelectValue,
  ATTRIBUTES extends object = object,
> = (options: { state?: STATE; attributes?: ATTRIBUTES }) => TBlackHole;

export type VirtualSelect<
  STATE extends SelectValue = SelectValue,
  ATTRIBUTES extends object = object,
> = {
  icon: string;
  attributes: ATTRIBUTES;
  _rawAttributes?: ATTRIBUTES;
  onUpdate: (callback: SelectUpdateCallback<STATE, ATTRIBUTES>) => void;
  state: STATE;
} & SensorDeviceClasses &
  BaseSelectAttributes;

type BaseSelectAttributes = {
  options: string[];
  name: string;
};

export function SelectDomain({ context, synapse }: TServiceParams) {
  const registry = synapse.registry<VirtualSelect>({
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
    STATE extends SelectValue = SelectValue,
    ATTRIBUTES extends BaseSelectAttributes = BaseSelectAttributes,
  >(entity: TSelect<STATE, ATTRIBUTES>) {
    const numberOut = new Proxy({} as VirtualSelect<STATE, ATTRIBUTES>, {
      // ### Getters
      get(_, property: keyof VirtualSelect<STATE, ATTRIBUTES>) {
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
        if (property === "options") {
          return entity.options;
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
    const loader = synapse.storage.loader<STATE, ATTRIBUTES>({
      id,
      registry: registry as TRegistry<unknown>,
      value: {
        attributes: (entity.defaultAttributes ?? {}) as ATTRIBUTES,
        state: entity.options[START] as STATE,
      },
    });
    return numberOut;
  }
  return create;
}
