import { TServiceParams } from "@digital-alchemy/core";
import { HumidifierDeviceClass } from "@digital-alchemy/hass";

import { AddEntityOptions, BasicAddParams, SettableConfiguration } from "../../helpers/index.mts";

export type HumidifierConfiguration = {
  /**
   * Returns the current status of the device.
   */
  action?: SettableConfiguration<string>;
  /**
   * The available modes. Requires `SUPPORT_MODES`.
   */
  available_modes?: `${HumidifierModes}`[];
  /**
   * The current humidity measured by the device.
   */
  current_humidity?: SettableConfiguration<number>;
  /**
   * Type of hygrostat
   */
  device_class?: `${HumidifierDeviceClass}`;
  /**
   * Whether the device is on or off.
   */
  is_on?: SettableConfiguration<boolean>;
  /**
   * The maximum humidity.
   */
  max_humidity?: SettableConfiguration<number>;
  /**
   * The minimum humidity.
   */
  min_humidity?: SettableConfiguration<string>;
  /**
   * The current active mode. Requires `SUPPORT_MODES`.
   */
  mode?: SettableConfiguration<`${HumidifierModes}`>;
  /**
   * The target humidity the device is trying to reach.
   */
  target_humidity?: SettableConfiguration<number>;
};

export type HumidifierModes =
  | "normal"
  | "eco"
  | "away"
  | "boost"
  | "comfort"
  | "home"
  | "sleep"
  | "auto"
  | "baby";

export type HumidifierEvents = {
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
  const generate = synapse.generator.create<HumidifierConfiguration, HumidifierEvents>({
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

  return <PARAMS extends BasicAddParams>(
    options: AddEntityOptions<
      HumidifierConfiguration,
      HumidifierEvents,
      PARAMS["attributes"],
      PARAMS["locals"]
    >,
  ) => generate.addEntity(options);
}
