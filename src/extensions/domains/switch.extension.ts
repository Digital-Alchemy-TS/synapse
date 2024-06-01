import { TServiceParams } from "@digital-alchemy/core";
import { SwitchDeviceClass } from "@digital-alchemy/hass";

import { AddEntityOptions } from "../..";

type EntityConfiguration = {
  device_class?: `${SwitchDeviceClass}`;
  /**
   * If the switch is currently on or off.
   */
  is_on?: boolean;
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
  });

  return <ATTRIBUTES extends object>(
    options: AddEntityOptions<EntityConfiguration, EntityEvents, ATTRIBUTES>,
  ) => generate.add_entity(options);
}
