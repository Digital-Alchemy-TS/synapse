import { TServiceParams } from "@digital-alchemy/core";
import { BinarySensorDeviceClass } from "@digital-alchemy/hass";

import { AddEntityOptions } from "../..";

type EntityConfiguration = {
  /**
   * Type of binary sensor.
   */
  device_class?: `${BinarySensorDeviceClass}`;
  /**
   * If the binary sensor is currently on or off.
   */
  is_on?: boolean;
};

type EntityEvents = {
  //
};

export function VirtualBinarySensor({ context, synapse }: TServiceParams) {
  const generate = synapse.generator.create<EntityConfiguration, EntityEvents>({
    context,
    default_config: { is_on: false },
    domain: "binary_sensor",
    load_config_keys: ["device_class", "is_on"],
  });

  return <ATTRIBUTES extends object>(
    options: AddEntityOptions<EntityConfiguration, EntityEvents, ATTRIBUTES>,
  ) => generate.add_entity(options);
}
