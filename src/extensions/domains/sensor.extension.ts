import { TServiceParams } from "@digital-alchemy/core";

import { AddEntityOptions, SensorConfiguration } from "../..";

export type SensorEvents = {
  //
};

export function VirtualSensor({ context, synapse }: TServiceParams) {
  const generate = synapse.generator.create<SensorConfiguration<object>, SensorEvents>({
    context,
    domain: "sensor",
    load_config_keys: [
      "device_class",
      "last_reset",
      "state",
      "suggested_display_precision",
      "suggested_unit_of_measurement",
      "unit_of_measurement",
    ],
  });

  return <ATTRIBUTES extends object>(
    options: AddEntityOptions<SensorConfiguration<ATTRIBUTES>, SensorEvents, ATTRIBUTES>,
  ) => generate.addEntity<ATTRIBUTES>(options);
}
