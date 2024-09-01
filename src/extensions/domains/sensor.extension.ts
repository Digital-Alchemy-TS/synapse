import { TServiceParams } from "@digital-alchemy/core";

import { AddEntityOptions, SensorConfiguration } from "../..";

export type SensorEvents = {
  //
};

export function VirtualSensor({ context, synapse }: TServiceParams) {
  const generate = synapse.generator.create<SensorConfiguration<object, object>, SensorEvents>({
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

  return <LOCALS extends object, ATTRIBUTES extends object = object>(
    options: AddEntityOptions<
      SensorConfiguration<ATTRIBUTES, LOCALS>,
      SensorEvents,
      ATTRIBUTES,
      LOCALS
    >,
  ) => generate.addEntity<ATTRIBUTES, LOCALS>(options);
}
