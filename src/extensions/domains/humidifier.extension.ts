import { TServiceParams } from "@digital-alchemy/core";
import { HumidifierDeviceClass } from "@digital-alchemy/hass";

import { AddEntityOptions } from "../..";

type EntityConfiguration = {
  /**
   * Returns the current status of the device.
   */
  action?: string;
  /**
   * The available modes. Requires `SUPPORT_MODES`.
   */
  available_modes?: `${HumidifierModes}`[];
  /**
   * The current humidity measured by the device.
   */
  current_humidity?: number;
  /**
   * Type of hygrostat
   */
  device_class?: `${HumidifierDeviceClass}`;
  /**
   * Whether the device is on or off.
   */
  is_on?: boolean;
  /**
   * The maximum humidity.
   */
  max_humidity?: number;
  /**
   * The minimum humidity.
   */
  min_humidity?: string;
  /**
   * The current active mode. Requires `SUPPORT_MODES`.
   */
  mode?: `${HumidifierModes}`;
  /**
   * The target humidity the device is trying to reach.
   */
  target_humidity?: number;
};

type HumidifierModes =
  | "normal"
  | "eco"
  | "away"
  | "boost"
  | "comfort"
  | "home"
  | "sleep"
  | "auto"
  | "baby";

type EntityEvents = {
  set_humidity: {
    humidity: number;
  };
  turn_on: {
    //
  };
  turn_off: {
    //
  };
};

export function VirtualHumidifier({ context, synapse }: TServiceParams) {
  const generate = synapse.generator.create<EntityConfiguration, EntityEvents>({
    bus_events: ["set_humidity", "turn_on", "turn_off"],
    context,
    // @ts-expect-error its fine
    domain: "humidifier",
    load_config_keys: [
      "action",
      "available_modes",
      "current_humidity",
      "device_class",
      "is_on",
      "max_humidity",
      "min_humidity",
      "mode",
      "target_humidity",
    ],
  });

  return <ATTRIBUTES extends object>(
    options: AddEntityOptions<EntityConfiguration, EntityEvents, ATTRIBUTES>,
  ) => generate.add_entity(options);
}
