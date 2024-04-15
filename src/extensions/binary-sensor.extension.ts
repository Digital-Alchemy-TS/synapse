import { TBlackHole, TContext, TServiceParams } from "@digital-alchemy/core";

import { OnOff, TRegistry } from "..";

type TBinarySensor<ATTRIBUTES extends object = object> = {
  context: TContext;
  defaultState?: OnOff;
  icon?: string;
  name: string;
  defaultAttributes?: ATTRIBUTES;
};

export type VirtualBinarySensor<ATTRIBUTES extends object = object> = {
  state: OnOff;
  attributes: ATTRIBUTES;
  name: string;
  icon: string;
  onUpdate: (callback: BinarySensorUpdateCallback) => void;
  on: boolean;
};
type BinarySensorUpdateCallback = (state: boolean) => TBlackHole;

export function BinarySensor({ context, synapse }: TServiceParams) {
  const callbacks = [] as BinarySensorUpdateCallback[];

  const registry = synapse.registry<VirtualBinarySensor>({
    context,
    details: item => ({ state: item.state }),
    domain: "binary_sensor",
  });

  // # Binary sensor entity creation function
  function create<ATTRIBUTES extends object = object>(
    entity: TBinarySensor<ATTRIBUTES>,
  ) {
    let state: OnOff;

    const out = new Proxy({} as VirtualBinarySensor<ATTRIBUTES>, {
      get(_, property: keyof VirtualBinarySensor<ATTRIBUTES>) {
        if (property === "state") {
          return state;
        }
        if (property === "on") {
          return state === "on";
        }
        if (property === "icon") {
          return entity.icon;
        }
        if (property === "onUpdate") {
          return (callback: BinarySensorUpdateCallback) =>
            callbacks.push(callback);
        }
        if (property === "name") {
          return entity.name;
        }
        return undefined;
      },
      set(_, property: keyof VirtualBinarySensor<ATTRIBUTES>, value: unknown) {
        if (property === "state") {
          loader.setState(value as OnOff);
          return true;
        }
        if (property === "on") {
          loader.setState(value ? "on" : "off");
          return true;
        }
        return false;
      },
    });

    const id = registry.add(out);
    const loader = synapse.storage.loader<OnOff, ATTRIBUTES>({
      id,
      registry: registry as TRegistry<unknown>,
      value: {
        attributes: {} as ATTRIBUTES,
        state: "off" as OnOff,
      },
    });
    return out;
  }

  return create;
}
