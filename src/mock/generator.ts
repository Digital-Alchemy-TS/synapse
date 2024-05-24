import { SECOND, TServiceParams } from "@digital-alchemy/core";

export function EntityGenerator({
  scheduler,
  synapse,
  context,
  logger,
}: TServiceParams) {
  const magicSensor = synapse.sensor({
    area_id: "bedroom",
    context,
    defaultAttributes: {
      destination: "saturn",
    },
    defaultState: 10 as number,
    device_class: "speed",
    entity_category: "diagnostic",
    labels: ["synapse", "test"],
    name: "Test the sensor",
    suggested_object_id: "magic_the_sensor",
    unit_of_measurement: "ft/s",
  });
  scheduler.interval({
    exec() {
      magicSensor.state = Math.floor(Math.random() * 1000);
    },
    interval: 10 * SECOND,
  });

  // synapse.binary_sensor({
  //   context,
  //   defaultState: "off",
  //   name: "Smoke detector",
  // });

  // ["high", "medium", "low"].forEach(i =>
  //   synapse.scene({
  //     context,
  //     exec() {
  //       logger.info(`activate bedroom ${i}`);
  //     },
  //     name: `bedroom_${i}`,
  //   }),
  // );
  return { magicSensor };
}
