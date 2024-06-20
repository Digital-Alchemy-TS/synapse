import { TServiceParams } from "@digital-alchemy/core";
import { SwitchDeviceClass } from "@digital-alchemy/hass";

import { AddEntityOptions, SettableConfiguration } from "../..";

export type SwitchConfiguration = {
  device_class?: `${SwitchDeviceClass}`;
  /**
   * If the switch is currently on or off.
   */
  is_on?: SettableConfiguration<boolean>;
  /**
   * default: true
   */
  managed?: boolean;
};

export type SwitchEvents = {
  turn_on: {
    //
  };
  turn_off: {
    //
  };
  toggle: {
    //
  };
};

export function VirtualSwitch({ context, synapse }: TServiceParams) {
  const generate = synapse.generator.create<SwitchConfiguration, SwitchEvents>({
    bus_events: ["turn_on", "turn_off", "toggle"],
    context,
    domain: "switch",
    load_config_keys: ["device_class", "is_on"],
  });

  return function <ATTRIBUTES extends object>({
    managed = true,
    ...options
  }: AddEntityOptions<SwitchConfiguration, SwitchEvents, ATTRIBUTES>) {
    const entity = generate.addEntity(options);
    if (managed) {
      entity.onToggle(() => entity.storage.set("is_on", !entity.storage.get("is_on")));
      entity.onTurnOff(() => entity.storage.set("is_on", false));
      entity.onTurnOn(() => entity.storage.set("is_on", true));
    }
    return entity;
  };
}
