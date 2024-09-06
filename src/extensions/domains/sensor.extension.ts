import { TServiceParams } from "@digital-alchemy/core";

import { AddEntityOptions, SensorConfiguration } from "../..";

export type SensorEvents = {
  //
};

type AddParams = {
  State?: string | number;
  locals?: object;
  Attributes?: object;
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

  return <PARAMS extends AddParams>(
    options: AddEntityOptions<
      SensorConfiguration<PARAMS["Attributes"], PARAMS["locals"], PARAMS["State"]>,
      SensorEvents,
      PARAMS["Attributes"],
      PARAMS["locals"]
    >,
  ) => {
    const out = generate.addEntity<PARAMS["Attributes"], PARAMS["locals"]>(options);
    return out as typeof out & { state: PARAMS["State"] };
  };
}
