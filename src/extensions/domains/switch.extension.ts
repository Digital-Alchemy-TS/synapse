import { TServiceParams } from "@digital-alchemy/core";
import { SwitchDeviceClass } from "@digital-alchemy/hass";

import { AddEntityOptions } from "../..";

type EntityConfiguration = {
  device_class?: `${SwitchDeviceClass}`;
  /**
   * If the switch is currently on or off.
   */
  is_on?: boolean;
  /**
   * default: true
   */
  managed?: boolean;
};

type EntityEvents = {
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
  const generate = synapse.generator.create<EntityConfiguration, EntityEvents>({
    bus_events: ["turn_on", "turn_off", "toggle"],
    context,
    domain: "switch",
    load_config_keys: ["device_class", "is_on"],
    map_config: [{ key: "is_on", load: entity => entity.state === "on" }],
  });

  return function <ATTRIBUTES extends object>({
    managed = true,
    ...options
  }: AddEntityOptions<EntityConfiguration, EntityEvents, ATTRIBUTES>) {
    const entity = generate.add_entity(options);
    if (managed) {
      entity.onToggle(() => entity.storage.set("is_on", !entity.storage.get("is_on")));
      entity.onTurnOff(() => entity.storage.set("is_on", false));
      entity.onTurnOn(() => entity.storage.set("is_on", true));
    }
    return entity;
  };
}
