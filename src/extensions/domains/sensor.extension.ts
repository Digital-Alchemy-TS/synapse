import { TServiceParams } from "@digital-alchemy/core";

import { AddEntityOptions, SensorConfiguration } from "../..";

export type SensorEvents = {
  //
};

export function VirtualSensor({ context, synapse }: TServiceParams) {
  const generate = synapse.generator.create<
    SensorConfiguration<object, object, string | number>,
    SensorEvents
  >({
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

  return <
    STATE_TYPE extends string | number,
    LOCALS extends object = never,
    ATTRIBUTES extends object = never,
  >(
    options: AddEntityOptions<
      SensorConfiguration<ATTRIBUTES, LOCALS, STATE_TYPE>,
      SensorEvents,
      ATTRIBUTES,
      LOCALS
    >,
  ) => {
    const out = generate.addEntity<ATTRIBUTES, LOCALS>(options);
    return out as typeof out & { state: STATE_TYPE };
  };
}
