import { TServiceParams } from "@digital-alchemy/core";

import { AddEntityOptions, EntityException, SensorConfiguration } from "../..";

export type SensorEvents = {
  //
};

type AddParams = {
  state?: string | number;
  locals?: object;
  attributes?: object;
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
      SensorConfiguration<PARAMS["attributes"], PARAMS["locals"], PARAMS["state"]>,
      SensorEvents,
      PARAMS["attributes"],
      PARAMS["locals"]
    >,
  ) => {
    if ("options" in options) {
      if ("state_class" in options || "native_unit_of_measurement" in options) {
        throw new EntityException(
          context,
          "CANNOT_COMBINE_KEYS",
          "Cannot combine state_class & native_unit_of_measurement with options",
        );
      }
      options.device_class = "enum";
    }
    const out = generate.addEntity<PARAMS["attributes"], PARAMS["locals"]>(options);

    type SynapseSensor = typeof out & { state: PARAMS["state"] };

    return out as SynapseSensor;
  };
}
