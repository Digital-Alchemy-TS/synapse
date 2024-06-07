import { TServiceParams } from "@digital-alchemy/core";
import { BinarySensorDeviceClass, ENTITY_STATE, PICK_ENTITY } from "@digital-alchemy/hass";

import { AddEntityOptions, SettableConfiguration } from "../..";

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
    map_config: [
      { key: "is_on", load: (entity: ENTITY_STATE<PICK_ENTITY>) => entity.state === "on" },
    ],
  });

  return <ATTRIBUTES extends object>(
    options: AddEntityOptions<BinarySensorConfiguration, BinarySensorEvents, ATTRIBUTES>,
  ) => generate.addEntity(options);
}
