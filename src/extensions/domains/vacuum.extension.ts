import { TServiceParams } from "@digital-alchemy/core";

import { AddEntityOptions } from "../..";

type EntityConfiguration = {
  /**
   * Current battery level.
   */
  battery_level?: number;
  /**
   * The current fan speed.
   */
  fan_speed?: string;
  /**
   * List of available fan speeds.
   */
  fan_speed_list?: string[];
  supported_features?: number;
};

type EntityEvents = {
  clean_spot: {
    //
  };
  locate: {
    //
  };
  pause: {
    //
  };
  return_to_base: {
    //
  };
  send_command: {
    //
  };
  set_fan_speed: {
    //
  };
  start: {
    //
  };
  stop: {
    //
  };
};

export function VirtualVacuum({ context, synapse }: TServiceParams) {
  const generate = synapse.generator.create<EntityConfiguration, EntityEvents>({
    bus_events: [
      "clean_spot",
      "locate",
      "pause",
      "return_to_base",
      "send_command",
      "set_fan_speed",
      "start",
      "stop",
    ],
    context,
    // @ts-expect-error its fine
    domain: "vacuum",
    load_config_keys: ["battery_level", "fan_speed", "fan_speed_list", "supported_features"],
  });

  return <ATTRIBUTES extends object>(
    options: AddEntityOptions<EntityConfiguration, EntityEvents, ATTRIBUTES>,
  ) => generate.add_entity(options);
}
