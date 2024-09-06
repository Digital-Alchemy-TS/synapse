import { TServiceParams } from "@digital-alchemy/core";
import { BinarySensorDeviceClass } from "@digital-alchemy/hass";

import { AddEntityOptions, BasicAddParams, SettableConfiguration } from "../..";

export type BinarySensorConfiguration = {
  /**
   * Type of binary sensor.
   */
  device_class?: `${BinarySensorDeviceClass}`;
  /**
   * If the binary sensor is currently on or off.
   */
  is_on?: SettableConfiguration<boolean>;
};

export type BinarySensorEvents = {
  //
};

export function VirtualBinarySensor({ context, synapse }: TServiceParams) {
  const generate = synapse.generator.create<BinarySensorConfiguration, BinarySensorEvents>({
    context,
    default_config: { is_on: false },
    domain: "binary_sensor",
    load_config_keys: ["device_class", "is_on"],
  });

  return <PARAMS extends BasicAddParams>(
    options: AddEntityOptions<
      BinarySensorConfiguration,
      BinarySensorEvents,
      PARAMS["Attributes"],
      PARAMS["locals"]
    >,
  ) => generate.addEntity(options);
}
