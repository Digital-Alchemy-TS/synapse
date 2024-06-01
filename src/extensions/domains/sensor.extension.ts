import { TServiceParams } from "@digital-alchemy/core";

import { AddEntityOptions, SensorConfiguration } from "../..";

type EntityConfiguration = SensorConfiguration<object>;

type EntityEvents = {
  //
};

export function VirtualSensor({ context, synapse }: TServiceParams) {
  const generate = synapse.generator.create<EntityConfiguration, EntityEvents>({
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
    options: AddEntityOptions<SensorConfiguration<ATTRIBUTES>, EntityEvents, ATTRIBUTES>,
  ) => generate.add_entity<ATTRIBUTES>(options);
}
