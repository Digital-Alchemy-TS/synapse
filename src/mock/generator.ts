import { TServiceParams } from "@digital-alchemy/core";

export function EntityGenerator({ synapse, context, logger }: TServiceParams) {
  const locationSensor = synapse.sensor({
    context,
    defaultAttributes: {
      origin: "mars",
    },
    defaultState: 10,
    device_class: "speed",
    entity_category: "diagnostic",
    name: "Test the sensor",
    suggested_object_id: "magic_the_sensor",
    unit_of_measurement: "ft/s",
  });
  // locationSensor.configuration.

  synapse.binary_sensor({
    context,
    defaultState: "off",
    name: "Smoke detector",
  });

  ["high", "medium", "low"].forEach(i =>
    synapse.scene({
      context,
      exec() {
        logger.info(`activate bedroom ${i}`);
      },
      name: `bedroom_${i}`,
    }),
  );
}
