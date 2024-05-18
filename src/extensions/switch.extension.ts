import { TBlackHole, TContext, TServiceParams } from "@digital-alchemy/core";

import { TSynapseId } from "../helpers";
import { TRegistry } from "./registry.extension";

type TSwitch<ATTRIBUTES extends object = object> = {
  context: TContext;
  defaultState?: LocalOnOff;
  icon?: string;
  defaultAttributes?: ATTRIBUTES;
  name: string;
};

type LocalOnOff = "on" | "off";

export type VirtualSwitch<ATTRIBUTES extends object = object> = {
  state: LocalOnOff;
  on: boolean;
  icon: string;
  attributes?: ATTRIBUTES;
  name: string;
  onUpdate: (callback: SwitchUpdateCallback) => void;
};

type UpdateSwitchBody = {
  event_type: "digital_alchemy_switch_update";
  data: { data: { switch: TSynapseId; state: LocalOnOff } };
};

type SwitchUpdateCallback = (state: boolean) => TBlackHole;

export function Switch({ logger, context, hass, synapse }: TServiceParams) {
  const registry = synapse.registry.create<VirtualSwitch>({
    context,
    details: entity => ({
      state: entity.state,
    }),
    domain: "switch",
  });

  // ### Listen for socket events
  hass.socket.onEvent({
    context: context,
    event: "digital_alchemy_switch_update",
    exec({ data: { data } }: UpdateSwitchBody) {
      const item = registry.byId(data.switch);
      if (!item) {
        logger.warn(
          { data, id: data.switch },
          `received switch update for unknown switch`,
        );
        return;
      }
      const state = data.state;
      if (!["on", "off"].includes(state)) {
        logger.warn({ state }, `received bad value for state update`);
        return;
      }
      if (item.state === state) {
        return;
      }
      logger.trace(
        { label: item.name, state: data.state },
        `received state update`,
      );
      item.state = state;
    },
  });

  /**
   * ### Register a new switch
   *
   * Can be interacted with via return object, or standard home assistant switch services
   */
  function create<ATTRIBUTES extends object = object>(entity: TSwitch) {
    const returnEntity = new Proxy({} as VirtualSwitch, {
      get(_, property: keyof VirtualSwitch) {
        if (property === "state") {
          return loader.state;
        }
        if (property === "on") {
          return loader.state === "on";
        }
        if (property === "icon") {
          return entity.icon;
        }
        if (property === "name") {
          return entity.name;
        }
        if (property === "onUpdate") {
          return loader.onUpdate();
        }
        return undefined;
      },
      set(_, property: keyof VirtualSwitch, value: LocalOnOff) {
        if (property === "state") {
          setImmediate(async () => await loader.setState(value));
          return true;
        }
        if (property === "on") {
          setImmediate(async () => await loader.setState(value ? "on" : "off"));
          return true;
        }
        return false;
      },
    });

    const id = registry.add(returnEntity);
    const loader = synapse.storage.wrapper<LocalOnOff, ATTRIBUTES>({
      id,
      name: entity.name,
      registry: registry as TRegistry<unknown>,
      value: {
        attributes: {} as ATTRIBUTES,
        state: "off",
      },
    });
    return returnEntity;
  }

  return create;
}
